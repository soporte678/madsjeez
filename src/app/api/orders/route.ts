export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase URL or SUPABASE_SERVICE_ROLE_KEY not configured");
  }
  return createClient(url, key);
}

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  return new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
  });
}

type OrderItemInput = { productId: string; quantity: number; price?: number };

// POST /api/orders - Crear orden (precios y stock desde servidor; transacción atómica)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { items, shipping } = body as {
      items: OrderItemInput[];
      shipping: {
        name: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        phone: string;
      };
    };

    if (!items?.length || !shipping) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const buyerId = (session.user as { id?: string }).id;
    if (!buyerId) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const order = await prisma.$transaction(async (tx) => {
      const resolved: { productId: string; quantity: number; unitPrice: number }[] = [];
      let subtotal = 0;

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product || !product.isActive) {
          throw new Error(`NO_PRODUCT:${item.productId}`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`NO_STOCK:${item.productId}`);
        }
        const unitPrice = product.price;
        subtotal += unitPrice * item.quantity;
        resolved.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
        });
      }

      for (const r of resolved) {
        const upd = await tx.product.updateMany({
          where: { id: r.productId, stock: { gte: r.quantity } },
          data: { stock: { decrement: r.quantity } },
        });
        if (upd.count !== 1) {
          throw new Error(`RACE_STOCK:${r.productId}`);
        }
      }

      const shippingCost = subtotal > 50000 ? 0 : 3990;
      const tax = subtotal * 0.19;
      const total = subtotal + shippingCost + tax;

      const orderNumber = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

      return tx.order.create({
        data: {
          orderNumber,
          buyerId,
          subtotal,
          shippingCost,
          tax,
          total,
          shippingName: shipping.name,
          shippingAddress: shipping.address,
          shippingCity: shipping.city,
          shippingState: shipping.state,
          shippingZip: shipping.zip,
          shippingPhone: shipping.phone,
          items: {
            create: resolved.map((r) => ({
              quantity: r.quantity,
              price: r.unitPrice,
              productId: r.productId,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    try {
      const supabase = getSupabaseClient();
      for (const line of order.items) {
        const { data: product } = await supabase
          .from("products")
          .select("sales")
          .eq("id", line.productId)
          .maybeSingle();

        if (product) {
          await supabase
            .from("products")
            .update({ sales: (product.sales || 0) + line.quantity })
            .eq("id", line.productId);
        }
      }
    } catch (e) {
      console.error("Error updating sales count in Supabase:", e);
    }

    try {
      const stripe = getStripeClient();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.total),
        currency: "clp",
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      });

      return NextResponse.json({
        order,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (stripeErr) {
      console.error("Stripe error after order create; rolling back order/stock", stripeErr);
      await prisma.$transaction(async (tx) => {
        for (const line of order.items) {
          await tx.product.update({
            where: { id: line.productId },
            data: { stock: { increment: line.quantity } },
          });
        }
        await tx.order.delete({ where: { id: order.id } });
      });
      return NextResponse.json(
        { error: "Error al iniciar pago; la orden no se completó." },
        { status: 502 }
      );
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.startsWith("NO_PRODUCT:") || msg.startsWith("NO_STOCK:")) {
      return NextResponse.json({ error: "Producto no disponible" }, { status: 400 });
    }
    if (msg.startsWith("RACE_STOCK:")) {
      return NextResponse.json(
        { error: "Stock actualizado; reintentá la compra." },
        { status: 409 }
      );
    }
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Error al crear orden" }, { status: 500 });
  }
}

// GET /api/orders - Obtener órdenes del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { buyerId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1 },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Error al cargar órdenes" }, { status: 500 });
  }
}
