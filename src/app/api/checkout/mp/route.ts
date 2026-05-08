import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseService } from "@/lib/supabase/service";
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

function envPercent(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw == null || raw === "") return fallback;
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 100) return fallback;
  return n;
}

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
      console.error("checkout/mp buyer profile missing", {
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

    const body = (await req.json()) as {
      shipping?: Record<string, unknown>;
      buyer_email?: string;
    };
    const shippingAddress = body.shipping ?? {};

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
    const subtotal = roundMoney(lines.reduce((s, i) => s + i.price * i.quantity, 0));
    const shippingCostFull = lines.some((i) => !i.product.freeShipping) ? 2500 : 0;

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

    let split = computeCheckoutEscrowSplit({
      productSubtotal: subtotal,
      shippingCostFull,
      affiliateCommissionPercent,
      marketplaceSalesFeePercent,
    });

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

    const baseOrderPayload = {
      buyer_id: buyerUuid,
      seller_id: sellerUuid,
      status: "pending",
      total_amount: split.totalBuyerCharged,
      shipping_cost: shippingCostFull,
      discount_amount: 0,
      shipping_address: shippingAddress,
      notes: null,
    };
    let orderInsert = await supabaseService
      .from("orders")
      .insert({
        ...baseOrderPayload,
        commission_amount: commissionProductTotal,
      })
      .select("id")
      .single();

    const orderInsertCode = (orderInsert.error as { code?: string } | null)?.code;
    const orderInsertMessage = String((orderInsert.error as { message?: string } | null)?.message || "");
    if (
      orderInsert.error &&
      orderInsertCode === "PGRST204" &&
      orderInsertMessage.includes("commission_amount")
    ) {
      orderInsert = await supabaseService
        .from("orders")
        .insert(baseOrderPayload)
        .select("id")
        .single();
    }
    const { data: order, error: orderErr } = orderInsert;

    if (orderErr || !order?.id) {
      console.error("checkout mp insert order:", orderErr);
      return NextResponse.json({ error: "No se pudo crear la orden" }, { status: 500 });
    }

    const orderId = order.id as string;

    const blendedCommissionRate =
      subtotal > 0 ? roundMoney((commissionProductTotal / subtotal) * 100) : 0;

    for (const item of lines) {
      const unit = item.price;
      const totalLine = roundMoney(unit * item.quantity);
      const lineCommission = roundMoney(totalLine * (blendedCommissionRate / 100));

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
        console.error("order_items insert:", liErr);
        await supabaseService.from("orders").delete().eq("id", orderId);
        return NextResponse.json({ error: "No se pudieron guardar los ítems" }, { status: 500 });
      }
    }

    // seller_mercadopago.seller_id es TEXT → User.id (Prisma / OAuth), NO profiles.id UUID.
    let mpConnection: { mp_access_token: string | null } | null = null;
    let mpLookupErr: unknown = null;

    const byPrismaId = await supabaseService
      .from("seller_mercadopago")
      .select("mp_access_token, is_active")
      .eq("seller_id", sellerPrismaId)
      .eq("is_active", true)
      .maybeSingle();

    if (byPrismaId.error) mpLookupErr = byPrismaId.error;
    else if (byPrismaId.data?.mp_access_token) mpConnection = byPrismaId.data;

    if (!mpConnection?.mp_access_token && sellerUuid) {
      const legacy = await supabaseService
        .from("seller_mercadopago")
        .select("mp_access_token, is_active")
        .eq("seller_id", sellerUuid)
        .eq("is_active", true)
        .maybeSingle();
      if (legacy.error) mpLookupErr = legacy.error;
      if (legacy.data?.mp_access_token) mpConnection = legacy.data;
    }

    if (!mpConnection?.mp_access_token) {
      if (mpLookupErr) console.error("seller_mercadopago lookup:", mpLookupErr);
      await supabaseService.from("orders").delete().eq("id", orderId);
      return NextResponse.json(
        {
          code: "SELLER_MP_NOT_CONNECTED",
          error:
            "El vendedor no tiene Mercado Pago conectado. Pedile que vaya al panel → Perfil y vincule Mercado Pago, o elegí otro vendedor.",
        },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const buyerEmail = body.buyer_email || session.user.email || "";

    const mpItems = lines.map((row) => ({
      id: row.productId,
      title: row.product.title.slice(0, 120),
      quantity: row.quantity,
      unit_price: Number(row.price),
      currency_id: "ARS",
    }));

    if (shippingCostFull > 0 && split.buyerShippingShare > 0) {
      mpItems.push({
        id: "shipping_buyer_share",
        title: "Envío (parte comprador 50%)",
        quantity: 1,
        unit_price: split.buyerShippingShare,
        currency_id: "ARS",
      });
    }

    const preference = {
      items: mpItems,
      marketplace_fee: split.marketplaceTotalRetention,
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

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpConnection.mp_access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errData = await mpResponse.json().catch(() => ({}));
      console.error("MP preference error:", errData);
      await supabaseService.from("orders").delete().eq("id", orderId);
      return NextResponse.json(
        { error: "No se pudo iniciar el pago con Mercado Pago", details: errData },
        { status: 502 }
      );
    }

    const mpData = await mpResponse.json();

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
      console.error("checkout mp payments insert (non-fatal):", payErr);
    }

    if (affiliateUuid && split.affiliateCommissionAmount > 0) {
      const releaseDate = new Date();
      releaseDate.setUTCDate(releaseDate.getUTCDate() + 30);

      const { error: ledgerErr } = await supabaseService.from("affiliate_ledger").insert({
        affiliate_id: affiliateUuid,
        order_id: orderId,
        amount: split.affiliateCommissionAmount,
        status: "pending",
        release_date: releaseDate.toISOString(),
      });

      if (ledgerErr) {
        console.error("affiliate_ledger insert (non-fatal):", ledgerErr);
      }
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return NextResponse.json({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      order_id: orderId,
      checkout_summary: {
        total_buyer_charged: split.totalBuyerCharged,
        seller_net_payout: split.sellerNetPayout,
        marketplace_total_retention: split.marketplaceTotalRetention,
        affiliate_commission_escrow: split.affiliateCommissionAmount,
        affiliate_id: affiliateUuid,
      },
    });
  } catch (e) {
    console.error("checkout/mp:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
