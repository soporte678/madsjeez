export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";
import { getProfileUuidByEmail } from "@/lib/supabase-profile-map";

function mapSupabaseOrderStatus(sb: string): string {
  const m: Record<string, string> = {
    pending: "PENDING",
    paid: "PAID",
    preparing: "PROCESSING",
    shipped: "SHIPPED",
    delivered: "DELIVERED",
    completed: "DELIVERED",
    cancelled: "CANCELLED",
    refunded: "REFUNDED",
  };
  return m[sb.toLowerCase()] ?? sb.toUpperCase();
}

// GET /api/orders - Órdenes Prisma + Mercado Pago (Supabase) del comprador
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !(session.user as { id?: string }).id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const prismaOrders = await prisma.order.findMany({
      where: { buyerId: session.user.id },
      include: {
        shipment: true,
        items: {
          include: {
            product: {
              include: {
                images: { take: 1 },
                seller: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let merged: unknown[] = [...prismaOrders];

    try {
      const buyerUuid = await getProfileUuidByEmail(session.user.email);
      if (buyerUuid) {
        const { data: sbRows, error } = await supabaseService
          .from("orders")
          .select(
            `
            id,
            total_amount,
            status,
            created_at,
            order_items (
              id,
              quantity,
              unit_price,
              product:products (
                title,
                product_images ( url )
              )
            )
          `
          )
          .eq("buyer_id", buyerUuid)
          .order("created_at", { ascending: false });

        if (!error && sbRows?.length) {
          type SbRow = {
            id: string;
            total_amount: number | string;
            status: string;
            created_at: string;
            order_items?: Array<{
              id: string;
              quantity: number;
              unit_price: number | string;
              product: {
                title: string;
                product_images?: Array<{ url: string }> | null;
              } | null;
            }>;
          };

          const sbMapped = (sbRows as SbRow[]).map((row) => ({
            id: `sb-${row.id}`,
            orderNumber: `MP-${String(row.id).replace(/-/g, "").slice(0, 10).toUpperCase()}`,
            status: mapSupabaseOrderStatus(String(row.status)),
            total: Number(row.total_amount),
            subtotal: Number(row.total_amount),
            shippingCost: 0,
            tax: 0,
            createdAt: row.created_at,
            shipment: null,
            items: (row.order_items ?? []).map((it) => ({
              id: it.id,
              quantity: it.quantity,
              price: Number(it.unit_price),
              product: {
                title: it.product?.title ?? "Producto",
                images: (it.product?.product_images ?? []).map((im) => ({ url: im.url })),
                seller: null,
              },
            })),
          }));

          merged = [...merged, ...sbMapped];
          merged.sort(
            (a: { createdAt?: string | Date }, b: { createdAt?: string | Date }) =>
              new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
          );
        }
      }
    } catch (e) {
      console.error("merge Supabase buyer orders:", e);
    }

    return NextResponse.json(merged);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Error al cargar órdenes" }, { status: 500 });
  }
}
