/**
 * POST /api/checkout/bank-transfer
 *
 * Genera un Order con paymentMethod="bank_transfer" y status="PENDING_PAYMENT".
 * El comprador queda con la orden creada y recibe instrucciones (CBU/alias del
 * seller). El seller revisa el comprobante y marca como paid manualmente desde
 * su dashboard. No corre por gateway externo.
 *
 * Soporta usuario logueado y guest checkout (con guest_email + guest_cart).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface Body {
  shipping: {
    recipient: string;
    street?: string;
    number?: string;
    apartment?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone: string;
  };
  shipping_method?: "standard" | "flash" | "pickup";
  guest_email?: string;
  guest_cart?: Array<{ productId: string; quantity: number }>;
}

function genOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BT-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    if (!body.shipping?.recipient?.trim() || !body.shipping?.phone?.trim()) {
      return NextResponse.json(
        { error: "Faltan datos de contacto" },
        { status: 400 }
      );
    }

    // Resolver carrito: si guest, viene en body; si logueado, lee de la DB.
    let lines: Array<{ productId: string; quantity: number }> = [];
    let guestEmail: string | null = null;

    if (userId) {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });
      if (!cart || cart.items.length === 0) {
        return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
      }
      lines = cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));
    } else {
      const e = body.guest_email?.trim().toLowerCase();
      if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        return NextResponse.json(
          { error: "Email requerido para guest checkout" },
          { status: 400 }
        );
      }
      guestEmail = e;
      lines = (body.guest_cart || []).filter((l) => l.productId && l.quantity > 0);
      if (lines.length === 0) {
        return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
      }
    }

    // Trae productos para precio + seller
    const productIds = lines.map((l) => l.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        title: true,
        price: true,
        sellerId: true,
        seller: {
          select: {
            id: true,
            name: true,
            sellerName: true,
            email: true,
            sellerProvince: true,
            sellerLocality: true,
          },
        },
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: "Productos no encontrados" }, { status: 404 });
    }

    const sellerIds = new Set(products.map((p) => p.sellerId));
    if (sellerIds.size > 1) {
      return NextResponse.json(
        {
          error:
            "La transferencia bancaria solo admite un vendedor por orden. Dividí el carrito.",
        },
        { status: 400 }
      );
    }
    const sellerId = products[0].sellerId;

    const productMap = new Map(products.map((p) => [p.id, p]));
    const itemsData = lines
      .map((l) => {
        const p = productMap.get(l.productId);
        if (!p) return null;
        return {
          productId: l.productId,
          quantity: l.quantity,
          price: p.price,
        };
      })
      .filter(Boolean) as Array<{
      productId: string;
      quantity: number;
      price: typeof products[0]["price"];
    }>;

    const subtotal = itemsData.reduce(
      (s, it) => s + Number(it.price) * it.quantity,
      0
    );
    // Bank transfer + pickup-or-standard: el envío se acuerda 1:1 entre seller
    // y comprador. Por defecto cero, el seller puede ajustar al confirmar.
    const shippingCost =
      body.shipping_method === "pickup" || body.shipping_method === "standard"
        ? 0
        : 0;
    const total = subtotal + shippingCost;

    // Resolver buyerId: guest crea/usa user shadow por email
    let buyerId = userId;
    if (!buyerId && guestEmail) {
      const existing = await prisma.user.findUnique({
        where: { email: guestEmail },
        select: { id: true },
      });
      if (existing) {
        buyerId = existing.id;
      } else {
        const created = await prisma.user.create({
          data: {
            email: guestEmail,
            name: body.shipping.recipient,
          },
          select: { id: true },
        });
        buyerId = created.id;
      }
    }
    if (!buyerId) {
      return NextResponse.json({ error: "No se pudo identificar al comprador" }, { status: 400 });
    }

    const orderNumber = genOrderNumber();
    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerId,
        status: "PENDING",
        paymentMethod: "bank_transfer",
        subtotal,
        shippingCost,
        total,
        shippingName: body.shipping.recipient,
        shippingAddress:
          body.shipping_method === "pickup"
            ? "Retiro en local del vendedor"
            : `${body.shipping.street ?? ""} ${body.shipping.number ?? ""}${
                body.shipping.apartment ? `, ${body.shipping.apartment}` : ""
              }`.trim(),
        shippingCity:
          body.shipping_method === "pickup"
            ? products[0]?.seller?.sellerLocality ?? "—"
            : body.shipping.city ?? "—",
        shippingState:
          body.shipping_method === "pickup"
            ? products[0]?.seller?.sellerProvince ?? "—"
            : body.shipping.state ?? "—",
        shippingZip: body.shipping.zip ?? "—",
        shippingPhone: body.shipping.phone,
        items: {
          create: itemsData.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            price: it.price,
          })),
        },
      },
      select: { id: true, orderNumber: true },
    });

    // Limpiamos el carrito del user logueado (guest: no hay nada server-side)
    if (userId) {
      await prisma.cartItem.deleteMany({ where: { cart: { userId } } });
    }

    logger.info("Order created (bank_transfer)", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      sellerId,
      total,
    });

    return NextResponse.json({
      ok: true,
      order_id: order.id,
      order_number: order.orderNumber,
      instructions_url: `/track/${order.orderNumber}?method=bank_transfer`,
    });
  } catch (e) {
    logger.error("checkout/bank-transfer:", e);
    const msg = e instanceof Error ? e.message : "Error generando la orden";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
