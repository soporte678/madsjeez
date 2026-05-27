import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseService } from "@/lib/supabase/service";
import { logger } from "@/lib/logger";
import { z } from "zod";
import {
  getProfileUuidByEmail,
  getProfileUuidForPrismaUserId,
} from "@/lib/supabase-profile-map";
import {
  AFFILIATE_COOKIE_NAME,
  computeCheckoutEscrowSplit,
  isUuidLike,
  parseCookieHeader,
  roundMoney,
} from "@/lib/checkout/escrow-split";
import { buildGuestClaim, shippingWithGuestClaim } from "@/lib/orders/guest-claim";
import { resolveCartShippingCost } from "@/lib/zipnova/quote-cart";
import type { SellerMpRow } from "@/lib/mercadopago/seller-access-token";
import { createCheckoutProPreferenceWithSellerTokenRetry } from "@/lib/mercadopago/preference-with-token-retry";
import { notifyPostgrestReloadSchema, ensureSupabaseOrdersSellerIdColumn } from "@/lib/supabase/postgrest-schema";
import { isPrismaSchemaMissingError } from "@/lib/prisma/known-errors";
import {
  markStockReserved,
  reservePrismaStock,
  restorePrismaStock,
  type StockReservationLine,
} from "@/lib/orders/stock-reservation";
import { pushStockToMeliForProductIds } from "@/lib/meli/stock-sync";
import { randomUUID, randomBytes } from "crypto";
import type { FlashAddressData } from "@/lib/flash/types";
import { logFlashAudit } from "@/lib/flash/audit";

function sleepMs(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function envPercent(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw == null || raw === "") return fallback;
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 100) return fallback;
  return n;
}

/**
 * Schema de validación Zod para el body del checkout.
 * Previene datos maliciosos o inválidos en los inputs del usuario.
 */
const CheckoutBodySchema = z.object({
  shipping: z.record(z.string(), z.unknown()).optional(),
  buyer_email: z.string().email().max(256).optional(),
  guest_email: z.string().email().max(256).nullable().optional(),
  guest_phone: z.string().max(64).nullable().optional(),
  guest_document: z.string().max(32).nullable().optional(),
  flash: z
    .object({
      recipientName: z.string().min(1).max(200),
      recipientDni: z.string().max(32),
      recipientPhone: z.string().max(64),
      street: z.string().min(1).max(300),
      streetNumber: z.string().min(1).max(50),
      floor: z.string().max(20).nullable().optional(),
      apartment: z.string().max(20).nullable().optional(),
      betweenStreet1: z.string().max(300).optional(),
      betweenStreet2: z.string().max(300).optional(),
      city: z.string().min(1).max(200),
      province: z.string().min(1).max(200),
      postalCode: z.string().max(20),
      shippingTier: z.string().max(64).optional(),
      shippingPrice: z.number().finite().nonnegative().optional(),
      priorityScore: z.number().int().min(0).max(100).optional(),
    })
    .optional(),
});

type CheckoutBody = z.infer<typeof CheckoutBodySchema>;

/**
 * Checkout Mercado Pago con split tipo marketplace:
 * - Comprador paga: subtotal productos + 50% del envío (buyerShippingShare).
 * - Split seller: neto = subtotal - comisión marketplace sobre producto - comisión afiliado - 50% envío.
 * - Mercado Pago retiene en recolector (marketplace_fee): el resto = cargo comprador − seller_net.
 * - Comisión afiliado NO sale por MP al afiliado: ledger Supabase `affiliate_ledger` pending hasta liberación.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(session.user as { id?: string }).id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const buyerPrismaId = (session.user as { id: string }).id;
    const buyerUuid = await getProfileUuidByEmail(session.user.email);
    if (!buyerUuid) {
      logger.error("checkout/mp buyer profile missing", {
        email: session.user.email,
        buyerPrismaId,
      });
      return NextResponse.json(
        {
          code: "BUYER_PROFILE_MISSING",
          error:
            "Tu cuenta no tiene perfil en la tienda (Supabase). Usá el mismo email que en el registro o contactá soporte.",
        },
        { status: 400 }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ code: "INVALID_JSON", error: "Body inválido: se espera JSON" }, { status: 400 });
    }

    const parseResult = CheckoutBodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", error: "Datos de entrada inválidos", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const body = parseResult.data as CheckoutBody;
    const shippingAddressRaw = body.shipping ?? {};
    const guestClaim = buildGuestClaim(session.user.email, {
      email: body.guest_email ?? body.buyer_email,
      phone: body.guest_phone,
      document: body.guest_document,
    });
    const shippingAddress = shippingWithGuestClaim(
      shippingAddressRaw as Record<string, unknown>,
      guestClaim
    );

    const cart = await prisma.cart.findUnique({
      where: { userId: buyerPrismaId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart?.items.length) {
      return NextResponse.json({ code: "EMPTY_CART", error: "El carrito está vacío" }, { status: 400 });
    }

    const sellerIds = new Set(cart.items.map((i) => i.product.sellerId));
    if (sellerIds.size !== 1) {
      return NextResponse.json(
        {
          code: "MULTI_SELLER_CART",
          error:
            "Por ahora solo podés pagar productos del mismo vendedor en un solo pago. Dejá solo ítems de un vendedor en el carrito.",
        },
        { status: 400 }
      );
    }

    const sellerPrismaId = [...sellerIds][0];
    const sellerUuid = await getProfileUuidForPrismaUserId(sellerPrismaId);
    if (!sellerUuid) {
      return NextResponse.json(
        {
          code: "SELLER_PROFILE_MISSING",
          error:
            "No se pudo resolver el perfil del vendedor en la tienda (Supabase). El vendedor debe tener cuenta con el mismo email que en MADSJEEZ.",
        },
        { status: 400 }
      );
    }

    const lines = cart.items;
    const unavailable = lines.find((i) => !i.product.isActive || i.product.stock < i.quantity);
    if (unavailable) {
      return NextResponse.json(
        {
          code: "INSUFFICIENT_STOCK",
          error: `No hay stock suficiente para "${unavailable.product.title}".`,
        },
        { status: 409 }
      );
    }

    const subtotal = roundMoney(lines.reduce((s, i) => s + Number(i.price) * i.quantity, 0));

    try {
      const sellerZipnova = await prisma.sellerZipnovaOAuth.findUnique({
        where: { userId: sellerPrismaId },
        select: { userId: true },
      });
      if (!sellerZipnova) {
        return NextResponse.json(
          {
            code: "SELLER_ZIPNOVA_REQUIRED",
            error:
              "Este vendedor todavia no conecto Zipnova para gestionar envios. Pedile que conecte Zipnova desde su panel antes de comprar.",
          },
          { status: 409 }
        );
      }
    } catch (e) {
      if (isPrismaSchemaMissingError(e)) {
        return NextResponse.json(
          {
            code: "SELLER_ZIPNOVA_SCHEMA_MISSING",
            error:
              "La tabla de conexion Zipnova todavia no esta aplicada en produccion. Ejecuta las migraciones antes de habilitar compras.",
          },
          { status: 503 }
        );
      }
      throw e;
    }

    const shippingForQuote = {
      city: String((shippingAddress as { city?: string }).city ?? ""),
      state: String((shippingAddress as { state?: string }).state ?? ""),
      zip: String((shippingAddress as { zip?: string }).zip ?? ""),
      street: String((shippingAddress as { street?: string }).street ?? ""),
      number: String((shippingAddress as { number?: string }).number ?? ""),
    };

    let shippingAddressOut: Record<string, unknown> = { ...shippingAddress };
    let shippingCostFull = 0;
    try {
      const shipRes = await resolveCartShippingCost({
        lines: lines.map((i) => ({
          quantity: i.quantity,
          price: Number(i.price),
          product: {
            id: i.product.id,
            title: i.product.title,
            sku: i.product.sku,
            freeShipping: i.product.freeShipping,
          },
        })),
        shipping: shippingForQuote,
        sellerUserId: sellerPrismaId,
      });
      shippingCostFull = shipRes.cost;
      if (shipRes.zipnova) {
        shippingAddressOut = { ...shippingAddressOut, zipnova: shipRes.zipnova };
      }
    } catch (zipErr) {
      logger.error("checkout/mp Zipnova quote:", zipErr);
      return NextResponse.json(
        {
          code: "ZIPNOVA_QUOTE_FAILED",
          error:
            zipErr instanceof Error
              ? zipErr.message
              : "No se pudo cotizar el envío con Zipnova. Revisá la dirección o la configuración de envíos.",
        },
        { status: 502 }
      );
    }

    const marketplaceSalesFeePercent = envPercent("MARKETPLACE_SALES_FEE_PERCENT", 10);
    const affiliateDefaultPercent = envPercent("AFFILIATE_COMMISSION_PERCENT", 10);

    const cookieAffiliateRaw = parseCookieHeader(req.headers.get("cookie"), AFFILIATE_COOKIE_NAME);
    let affiliateUuid: string | null = null;
    let affiliateCommissionPercent = 0;

    if (cookieAffiliateRaw && isUuidLike(cookieAffiliateRaw)) {
      const cand = cookieAffiliateRaw.trim();
      if (cand !== buyerUuid && cand !== sellerUuid) {
        const { data: affRow } = await supabaseService.from("profiles").select("id").eq("id", cand).maybeSingle();
        if (affRow?.id) {
          affiliateUuid = cand;
          affiliateCommissionPercent = affiliateDefaultPercent;
        }
      }
    }

    // Flash shipping: validate server-side price matches DB, cost goes 100% to driver
    let flashShippingCost = body.flash?.shippingPrice ?? 0;
    if (body.flash?.shippingTier && flashShippingCost > 0) {
      try {
        const dbOption = await prisma.flashShippingOption.findUnique({
          where: { code: body.flash.shippingTier },
          select: { price: true, isActive: true },
        });
        if (dbOption?.isActive && Number(dbOption.price) !== flashShippingCost) {
          logger.warn(
            `checkout/mp flash price mismatch: client=${flashShippingCost}, db=${dbOption.price}, tier=${body.flash.shippingTier}. Using DB price.`
          );
          flashShippingCost = Number(dbOption.price);
          body.flash.shippingPrice = Number(dbOption.price);
        }
        if (dbOption && !dbOption.isActive) {
          return NextResponse.json(
            { code: "FLASH_TIER_INACTIVE", error: "La opción de envío Flash seleccionada no está disponible." },
            { status: 400 }
          );
        }
      } catch {
        // Table not migrated — accept client price (fallback pricing)
      }
    }
    const effectiveShippingCost = flashShippingCost > 0 ? 0 : shippingCostFull; // Flash shipping is added separately to MP items

    let split = computeCheckoutEscrowSplit({
      productSubtotal: subtotal,
      shippingCostFull: effectiveShippingCost,
      affiliateCommissionPercent,
      marketplaceSalesFeePercent,
    });

    // If Flash, add the Flash shipping to the total buyer charged
    if (flashShippingCost > 0) {
      split = {
        ...split,
        totalBuyerCharged: roundMoney(split.totalBuyerCharged + flashShippingCost),
      };
    }

    // En carritos de ticket bajo, 50/50 de envío puede dejar neto vendedor <= 0.
    // Fallback operativo: el comprador cubre 100% del envío para destrabar checkout.
    if (split.sellerNetPayout <= 0 && shippingCostFull > 0) {
      const buyerShippingShare = shippingCostFull;
      const sellerShippingShare = 0;
      const totalBuyerCharged = roundMoney(subtotal + buyerShippingShare);
      const sellerNetPayout = roundMoney(
        subtotal - split.affiliateCommissionAmount - split.marketplaceSalesFeeAmount - sellerShippingShare
      );
      const marketplaceTotalRetention = roundMoney(totalBuyerCharged - sellerNetPayout);
      split = {
        ...split,
        buyerShippingShare,
        sellerShippingShare,
        totalBuyerCharged,
        sellerNetPayout,
        marketplaceTotalRetention,
      };
    }

    if (split.sellerNetPayout <= 0) {
      return NextResponse.json(
        {
          code: "NEGATIVE_SELLER_NET",
          error:
            "La combinación de envío y comisiones deja al vendedor sin neto positivo. Revisá montos o porcentajes (MARKETPLACE_SALES_FEE_PERCENT / AFFILIATE_COMMISSION_PERCENT).",
        },
        { status: 400 }
      );
    }

    const commissionProductTotal = roundMoney(
      split.marketplaceSalesFeeAmount + split.affiliateCommissionAmount
    );

    const stockReservationLines: StockReservationLine[] = lines.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    let prismaStockReserved = false;

    async function restoreReservedStockIfNeeded() {
      if (!prismaStockReserved) return;
      try {
        await restorePrismaStock(prisma, stockReservationLines);
        prismaStockReserved = false;
      } catch (restoreErr) {
        logger.error("checkout/mp restore Prisma stock:", restoreErr);
      }
    }

    async function cleanupPersistedOrder(orderIdToCleanup: string) {
      try {
        await supabaseService
          .from("orders")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", orderIdToCleanup);
      } catch (cancelErr) {
        logger.error("checkout/mp cancel Supabase order:", cancelErr);
      }
      try {
        await supabaseService.from("orders").delete().eq("id", orderIdToCleanup);
      } catch (deleteErr) {
        logger.error("checkout/mp delete Supabase order:", deleteErr);
      }
      await restoreReservedStockIfNeeded();
    }

    const reservation = await reservePrismaStock(prisma, stockReservationLines);
    if (!reservation.ok) {
      return NextResponse.json(
        {
          code: "INSUFFICIENT_STOCK",
          error: "Otro comprador acaba de reservar stock de un producto del carrito. Recargá el carrito.",
        },
        { status: 409 }
      );
    }
    prismaStockReserved = true;
    shippingAddressOut = markStockReserved(shippingAddressOut);

    void pushStockToMeliForProductIds(stockReservationLines.map((l) => l.productId));

    /** Supabase `public.orders` suele exigir `id` NOT NULL sin default; sin esto falla 23502 y se usa orden `tmp_`. */
    const orderUuid = randomUUID();
    const baseOrderPayload = {
      id: orderUuid,
      buyer_id: buyerUuid,
      seller_id: sellerUuid,
      status: "PENDING",
      total_amount: split.totalBuyerCharged,
      shipping_cost: shippingCostFull,
      discount_amount: 0,
      shipping_address: shippingAddressOut,
      notes: null,
    };
    const orderPayloadAttempts: Array<Record<string, unknown>> = [
      { ...baseOrderPayload, commission_amount: commissionProductTotal },
      { ...baseOrderPayload },
      {
        id: orderUuid,
        buyer_id: buyerUuid,
        seller_id: sellerUuid,
        status: "PENDING",
        total_amount: split.totalBuyerCharged,
        shipping_address: shippingAddressOut,
        notes: null,
      },
      {
        id: orderUuid,
        buyer_id: buyerUuid,
        seller_id: sellerUuid,
        status: "PENDING",
        total_amount: split.totalBuyerCharged,
      },
    ];

    async function insertOrderWithPayloads(
      payloads: Array<Record<string, unknown>>
    ): Promise<{ data: { id: string } | null; error: unknown }> {
      let orderInsert = await supabaseService
        .from("orders")
        .insert(payloads[0])
        .select("id")
        .single();
      for (let i = 1; i < payloads.length; i += 1) {
        if (!orderInsert.error) break;
        const code = (orderInsert.error as { code?: string } | null)?.code;
        if (code !== "PGRST204") break;
        orderInsert = await supabaseService
          .from("orders")
          .insert(payloads[i])
          .select("id")
          .single();
      }
      return orderInsert;
    }

    let orderInsert = await insertOrderWithPayloads(orderPayloadAttempts);
    let lastCode = (orderInsert.error as { code?: string } | null)?.code;
    if (lastCode === "PGRST204") {
      const notified = await notifyPostgrestReloadSchema(prisma);
      if (notified) await sleepMs(500);
      orderInsert = await insertOrderWithPayloads(orderPayloadAttempts);
      lastCode = (orderInsert.error as { code?: string } | null)?.code;
    }
    if (lastCode === "PGRST204") {
      logger.warn(
        "[checkout/mp] PGRST204 en orders tras NOTIFY: intentando ADD COLUMN seller_id / total_amount idempotente + NOTIFY (DDL)."
      );
      const ddlOk = await ensureSupabaseOrdersSellerIdColumn(prisma);
      if (ddlOk) await sleepMs(800);
      orderInsert = await insertOrderWithPayloads(orderPayloadAttempts);
    }

    const { data: order, error: orderErr } = orderInsert;
    let orderId: string;
    let persistedOrder = false;

    if (orderErr || !order?.id) {
      logger.error(
        "checkout mp insert order:",
        orderErr,
        "| Si persiste PGRST204 / enum OrderStatus: status debe coincidir con Postgres (PENDING). MP: reconectar Mercado Pago del vendedor si hay invalid_grant."
      );
      // Fallback operativo: no bloquear checkout por drift de esquema en Supabase.
      orderId = `tmp_${Date.now()}_${buyerPrismaId}`;
    } else {
      orderId = order.id as string;
      persistedOrder = true;
    }

    const blendedCommissionRate =
      subtotal > 0 ? roundMoney((commissionProductTotal / subtotal) * 100) : 0;

    for (const item of lines) {
      const unit = Number(item.price);
      const totalLine = roundMoney(unit * item.quantity);
      const lineCommission = roundMoney(totalLine * (blendedCommissionRate / 100));

      if (persistedOrder) {
        const { error: liErr } = await supabaseService.from("order_items").insert({
          order_id: orderId,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: unit,
          total_price: totalLine,
          commission_rate: blendedCommissionRate,
          commission_amount: lineCommission,
        });
        if (liErr) {
          logger.error("order_items insert:", liErr);
          await cleanupPersistedOrder(orderId);
          return NextResponse.json({ error: "No se pudieron guardar los ítems" }, { status: 500 });
        }
      }
    }

    // seller_mercadopago.seller_id es TEXT → User.id (Prisma / OAuth), NO profiles.id UUID.
    let mpConnection: SellerMpRow | null = null;
    let mpLookupErr: unknown = null;

    const mpSelect = "seller_id, mp_access_token, mp_refresh_token, mp_token_expires_at, is_active";

    const byPrismaId = await supabaseService
      .from("seller_mercadopago")
      .select(mpSelect)
      .eq("seller_id", sellerPrismaId)
      .eq("is_active", true)
      .maybeSingle();

    if (byPrismaId.error) mpLookupErr = byPrismaId.error;
    else if (byPrismaId.data?.mp_access_token) mpConnection = byPrismaId.data as SellerMpRow;

    if (!mpConnection?.mp_access_token && sellerUuid) {
      const legacy = await supabaseService
        .from("seller_mercadopago")
        .select(mpSelect)
        .eq("seller_id", sellerUuid)
        .eq("is_active", true)
        .maybeSingle();
      if (legacy.error) mpLookupErr = legacy.error;
      if (legacy.data?.mp_access_token) mpConnection = legacy.data as SellerMpRow;
    }

    if (!mpConnection?.mp_access_token) {
      if (mpLookupErr) logger.error("seller_mercadopago lookup:", mpLookupErr);
      if (persistedOrder) await cleanupPersistedOrder(orderId);
      else await restoreReservedStockIfNeeded();
      return NextResponse.json(
        {
          code: "SELLER_MP_NOT_CONNECTED",
          error:
            "El vendedor no tiene Mercado Pago conectado. Pedile que vaya al panel → Perfil y vincule Mercado Pago, o elegí otro vendedor.",
        },
        { status: 400 }
      );
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const buyerEmail = String(body.buyer_email || session.user.email || "").trim();
    if (!buyerEmail) {
      if (persistedOrder) await cleanupPersistedOrder(orderId);
      else await restoreReservedStockIfNeeded();
      return NextResponse.json(
        {
          code: "BUYER_EMAIL_REQUIRED",
          error: "Mercado Pago requiere un email del pagador. Verificá tu cuenta o contactá soporte.",
        },
        { status: 400 }
      );
    }

    const mpItems = lines.map((row) => ({
      id: row.productId,
      title: row.product.title.slice(0, 120),
      quantity: row.quantity,
      unit_price: roundMoney(Number(row.price)),
      currency_id: "ARS",
    }));

    // Flash shipping: comprador paga 100% (va al conductor)
    if (body.flash?.shippingPrice && body.flash.shippingPrice > 0) {
      const flashTierLabel = body.flash.shippingTier === "flash_plus" ? "Flash Plus" :
                              body.flash.shippingTier === "flash_local" ? "Flash Local" : "Flash Normal";
      mpItems.push({
        id: "flash_shipping",
        title: `Envío ⚡ ${flashTierLabel}`,
        quantity: 1,
        unit_price: roundMoney(body.flash.shippingPrice),
        currency_id: "ARS",
      });
    } else if (shippingCostFull > 0 && split.buyerShippingShare > 0) {
      mpItems.push({
        id: "shipping_buyer_share",
        title: "Envío (parte comprador 50%)",
        quantity: 1,
        unit_price: roundMoney(split.buyerShippingShare),
        currency_id: "ARS",
      });
    }

    const preference = {
      items: mpItems,
      marketplace_fee: roundMoney(split.marketplaceTotalRetention),
      payer: { email: buyerEmail },
      external_reference: orderId,
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${appUrl}/checkout/success?order_id=${orderId}`,
        failure: `${appUrl}/checkout/failure?order_id=${orderId}`,
        pending: `${appUrl}/checkout/pending?order_id=${orderId}`,
      },
      auto_return: "approved",
    };

    if (process.env.NODE_ENV === "production" && preference.notification_url.startsWith("http://")) {
      logger.warn(
        "checkout/mp: notification_url es HTTP; Mercado Pago suele exigir HTTPS. Revisá NEXT_PUBLIC_APP_URL en Railway."
      );
    }

    const mpPref = await createCheckoutProPreferenceWithSellerTokenRetry({
      supabase: supabaseService,
      mpRow: mpConnection,
      mpSelect,
      preference,
    });

    if (!mpPref.ok) {
      logger.error("MP preference error:", mpPref.body);
      if (persistedOrder) await cleanupPersistedOrder(orderId);
      else await restoreReservedStockIfNeeded();
      const statusOut = mpPref.httpStatus >= 500 ? 502 : 400;
      return NextResponse.json(
        {
          code: "MP_PREFERENCE_FAILED",
          error: mpPref.summarizedMessage,
          details: mpPref.body,
        },
        { status: statusOut }
      );
    }

    const mpData = mpPref.data;

    // Si no se pudo persistir en Supabase y usamos order temporal, guardamos espejo en Prisma
    // para que la compra aparezca en /orders del usuario.
    if (!persistedOrder) {
      try {
        await prisma.order.create({
          data: {
            orderNumber: `MP-${orderId.replace(/^tmp_/, "").slice(0, 22).toUpperCase()}`,
            buyerId: buyerPrismaId,
            subtotal,
            shippingCost: shippingCostFull,
            tax: 0,
            total: split.totalBuyerCharged,
            shippingName: String((shippingAddress as { recipient?: string }).recipient ?? "Destinatario"),
            shippingAddress: `${String((shippingAddress as { street?: string }).street ?? "")} ${String((shippingAddress as { number?: string }).number ?? "")}`.trim(),
            shippingCity: String((shippingAddress as { city?: string }).city ?? ""),
            shippingState: String((shippingAddress as { state?: string }).state ?? ""),
            shippingZip: String((shippingAddress as { zip?: string }).zip ?? ""),
            shippingPhone: String((shippingAddress as { phone?: string }).phone ?? ""),
            items: {
              create: lines.map((row) => ({
                quantity: row.quantity,
                price: row.price,
                productId: row.productId,
              })),
            },
          },
        });
      } catch (shadowErr) {
        logger.error("checkout/mp prisma shadow order (non-fatal):", shadowErr);
      }
    }

    if (persistedOrder) {
      const { error: payErr } = await supabaseService.from("payments").insert({
        order_id: orderId,
        mp_preference_id: mpData.id,
        mp_init_point: mpData.init_point,
        mp_sandbox_init_point: mpData.sandbox_init_point,
        amount: split.totalBuyerCharged,
        marketplace_commission: commissionProductTotal,
        marketplace_fee_total: split.marketplaceTotalRetention,
        seller_receives: split.sellerNetPayout,
        shipping_cost: shippingCostFull,
        shipping_seller_share: split.sellerShippingShare,
        shipping_buyer_share: split.buyerShippingShare,
        status: "pending",
        seller_id: sellerUuid,
        buyer_id: buyerUuid,
        created_at: new Date().toISOString(),
      });
      if (payErr) {
        logger.error("checkout mp payments insert (non-fatal):", payErr);
      }
    }

    if (affiliateUuid && split.affiliateCommissionAmount > 0) {
      const releaseDate = new Date();
      releaseDate.setUTCDate(releaseDate.getUTCDate() + 30);

      if (persistedOrder) {
        const { error: ledgerErr } = await supabaseService.from("affiliate_ledger").insert({
          affiliate_id: affiliateUuid,
          order_id: orderId,
          amount: split.affiliateCommissionAmount,
          status: "pending",
          release_date: releaseDate.toISOString(),
        });

        if (ledgerErr) {
          logger.error("affiliate_ledger insert (non-fatal):", ledgerErr);
        }
      }
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // Crear envío Flash si el comprador eligió ese método
    // orderId es el UUID de Supabase — la FK se satisface directo en la DB
    if (body.flash && persistedOrder) {
      try {
        const fd = body.flash;
        const qrToken = randomBytes(32).toString("hex");
        {
          const flashShipment = await prisma.flashShipment.create({
            data: {
              orderId,
              qrToken,
              status: "CREATED",
              recipientName: fd.recipientName,
              recipientDni: fd.recipientDni,
              recipientPhone: fd.recipientPhone,
              street: fd.street,
              streetNumber: fd.streetNumber,
              floor: fd.floor ?? null,
              apartment: fd.apartment ?? null,
              betweenStreet1: fd.betweenStreet1,
              betweenStreet2: fd.betweenStreet2,
              city: fd.city,
              province: fd.province,
              postalCode: fd.postalCode,
              shippingTier: fd.shippingTier ?? null,
              shippingPrice: fd.shippingPrice ?? null,
              priorityScore: fd.priorityScore ?? 50,
              paymentStatus: "paid_by_customer",
            },
          });
          await logFlashAudit({
            shipmentId: flashShipment.id,
            action: "SHIPMENT_CREATED",
            actorId: buyerPrismaId,
            actorRole: "SYSTEM",
            newStatus: "CREATED",
          });
        }
      } catch (flashErr) {
        logger.error("checkout/mp flash shipment create (non-fatal):", flashErr);
      }
    }

    return NextResponse.json({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      order_id: orderId,
      order_persisted: persistedOrder,
      checkout_summary: {
        total_buyer_charged: split.totalBuyerCharged,
        seller_net_payout: split.sellerNetPayout,
        marketplace_total_retention: split.marketplaceTotalRetention,
        affiliate_commission_escrow: split.affiliateCommissionAmount,
        affiliate_id: affiliateUuid,
      },
    });
  } catch (e) {
    logger.error("checkout/mp:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
