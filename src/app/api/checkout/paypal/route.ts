/**
 * POST /api/checkout/paypal
 *
 * Crea una PayPal Order (Checkout API v2) que el comprador aprueba en
 * paypal.com y vuelve a /checkout/success.
 *
 * Body:
 *   guest_email: string         (si no hay sesión)
 *   guest_cart: [{productId,quantity}] (si no hay sesión)
 *   shipping: ShippingAddress
 *
 * Esta ruta es alternativa a /api/checkout/mp (MercadoPago).
 * El seller del producto debe tener seller_paypal vinculado, sino 400.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { paypalFetch } from "@/lib/paypal/client";
import { getSellerPaypalConnection } from "@/lib/paypal/seller-connection";

export const dynamic = "force-dynamic";

const Body = z.object({
  shipping: z.record(z.string(), z.unknown()).optional(),
  guest_email: z.string().email().max(256).optional(),
  guest_cart: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .max(50)
    .optional(),
  currency: z.string().length(3).optional(),
});

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar").replace(/\/$/, "");
const DEFAULT_FX_USD = Number(process.env.PAYPAL_DEFAULT_FX_USD || "1000"); // ARS por USD

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const raw = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Body inválido", details: parsed.error.issues }, { status: 400 });
    }
    const body = parsed.data;

    // Resolución del comprador
    let buyerEmail: string;
    let buyerPrismaId: string | null = null;
    const isGuest = !session?.user?.email;
    if (isGuest) {
      const email = (body.guest_email ?? "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "guest_email requerido" }, { status: 400 });
      }
      if (!body.guest_cart || body.guest_cart.length === 0) {
        return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
      }
      const guest = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, name: email.split("@")[0], isSeller: false, role: "USER" },
      });
      buyerEmail = email;
      buyerPrismaId = guest.id;
    } else {
      buyerEmail = session!.user!.email!;
      buyerPrismaId = (session!.user as { id?: string }).id ?? null;
    }

    // Carga line items
    let lineItems: Array<{
      productId: string;
      quantity: number;
      unitPriceArs: number;
      title: string;
      sellerId: string;
    }>;
    if (isGuest) {
      const ids = (body.guest_cart ?? []).map((l) => l.productId);
      const ps = await prisma.product.findMany({
        where: { id: { in: ids }, isActive: true },
        select: { id: true, title: true, sellerId: true, price: true, stock: true },
      });
      const map = new Map(ps.map((p) => [p.id, p]));
      lineItems = (body.guest_cart ?? [])
        .map((l) => {
          const p = map.get(l.productId);
          if (!p) return null;
          const qty = Math.min(l.quantity, p.stock);
          if (qty <= 0) return null;
          return {
            productId: p.id,
            quantity: qty,
            unitPriceArs: Number(p.price),
            title: p.title,
            sellerId: p.sellerId,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
    } else {
      if (!buyerPrismaId) return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
      const cart = await prisma.cart.findUnique({
        where: { userId: buyerPrismaId },
        include: { items: { include: { product: true } } },
      });
      if (!cart?.items.length) return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
      lineItems = cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPriceArs: Number(i.product.price),
        title: i.product.title,
        sellerId: i.product.sellerId,
      }));
    }
    if (lineItems.length === 0) return NextResponse.json({ error: "Sin items" }, { status: 400 });

    // Solo un seller por checkout
    const sellerIds = new Set(lineItems.map((i) => i.sellerId));
    if (sellerIds.size > 1) {
      return NextResponse.json(
        {
          code: "MULTI_SELLER_CART",
          error: "Por ahora solo podés pagar productos de un mismo vendedor en una sola operación.",
        },
        { status: 400 },
      );
    }
    const sellerId = [...sellerIds][0];

    // Seller necesita PayPal vinculado
    const sellerPp = await getSellerPaypalConnection(sellerId);
    if (!sellerPp?.paypal_email) {
      return NextResponse.json(
        {
          code: "SELLER_NO_PAYPAL",
          error:
            "El vendedor de este producto no tiene PayPal vinculado. Probá pagar con Mercado Pago.",
        },
        { status: 400 },
      );
    }

    const currency = (body.currency ?? sellerPp.default_currency ?? "USD").toUpperCase();

    // Convertir ARS → currency. Hoy USD fijo via env; podemos plugear FX real más adelante.
    const fxRate = currency === "ARS" ? 1 : DEFAULT_FX_USD;
    const subtotalConverted = lineItems.reduce(
      (s, i) => s + (i.unitPriceArs * i.quantity) / fxRate,
      0,
    );
    const round = (n: number) => Math.round(n * 100) / 100;
    const subtotal = round(subtotalConverted);

    // PayPal order payload
    const ppItems = lineItems.map((i) => ({
      name: i.title.slice(0, 127),
      quantity: String(i.quantity),
      unit_amount: {
        currency_code: currency,
        value: round(i.unitPriceArs / fxRate).toFixed(2),
      },
      sku: i.productId,
    }));

    const orderPayload = {
      intent: "CAPTURE" as const,
      purchase_units: [
        {
          reference_id: `madsjeez_${Date.now()}_${buyerPrismaId ?? "guest"}`,
          payee: { email_address: sellerPp.paypal_email },
          amount: {
            currency_code: currency,
            value: subtotal.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: subtotal.toFixed(2),
              },
            },
          },
          items: ppItems,
          description: `Madsjeez · ${lineItems.length} ítem(s)`,
        },
      ],
      payer: { email_address: buyerEmail },
      application_context: {
        brand_name: "Madsjeez Marketplace",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${APP_URL}/checkout/success?provider=paypal`,
        cancel_url: `${APP_URL}/checkout/failure?provider=paypal`,
      },
    };

    const res = await paypalFetch("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify(orderPayload),
    });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      status?: string;
      links?: Array<{ href: string; rel: string }>;
      message?: string;
      details?: unknown;
    };
    if (!res.ok) {
      logger.error("paypal create order failed:", data);
      return NextResponse.json(
        { error: data.message || "No pudimos crear la orden PayPal", details: data.details },
        { status: 502 },
      );
    }

    const approve = data.links?.find((l) => l.rel === "approve" || l.rel === "payer-action");
    return NextResponse.json({
      ok: true,
      paypal_order_id: data.id,
      status: data.status,
      approve_url: approve?.href,
      currency,
      subtotal,
      fx_rate_used: fxRate,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error("checkout/paypal top-level:", { msg });
    return NextResponse.json({ error: "Error interno", debug: msg }, { status: 500 });
  }
}
