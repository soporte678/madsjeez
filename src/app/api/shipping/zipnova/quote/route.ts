import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  resolveCartShippingCost,
  type ShippingAddressForQuote,
} from "@/lib/zipnova/quote-cart";

/**
 * POST /api/shipping/zipnova/quote
 * Cotiza envío con el carrito del usuario y un domicilio (preview checkout).
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await req.json()) as { shipping?: ShippingAddressForQuote };
    const shipping = body.shipping ?? {};

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart?.items.length) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    const lines = cart.items.map((i) => ({
      quantity: i.quantity,
      price: Number(i.price),
      product: {
        id: i.product.id,
        title: i.product.title,
        sku: i.product.sku,
        freeShipping: i.product.freeShipping,
      },
    }));

    const sellerUserId = cart.items[0]?.product?.sellerId ?? null;
    const res = await resolveCartShippingCost({ lines, shipping, sellerUserId });
    return NextResponse.json({
      shipping_full: res.cost,
      buyer_shipping_share: res.cost > 0 ? Math.round((res.cost / 2) * 100) / 100 : 0,
      used_zipnova: res.usedZipnova,
      zipnova: res.zipnova,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al cotizar envío";
    console.error("zipnova quote:", e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
