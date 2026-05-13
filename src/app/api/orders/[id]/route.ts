import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseService } from "@/lib/supabase/service";
import { getProfileUuidByEmail, getProfileUuidForPrismaUserId } from "@/lib/supabase-profile-map";
import { mapSupabaseOrderStatus } from "@/lib/orders/merge-buyer-orders";

function pickRecipientFromShipping(sa: unknown): string | null {
  if (!sa || typeof sa !== "object") return null;
  const o = sa as Record<string, unknown>;
  if (typeof o.recipient === "string" && o.recipient.trim()) return o.recipient.trim();
  if (typeof o.full_name === "string" && o.full_name.trim()) return o.full_name.trim();
  if (typeof o.name === "string" && o.name.trim()) return o.name.trim();
  return null;
}

function pickShippingFromJson(sa: unknown): {
  shippingName: string;
  shippingCity: string;
  shippingState: string;
  shippingAddress: string;
  shippingZip: string;
  shippingPhone: string;
} {
  const empty = {
    shippingName: "",
    shippingCity: "",
    shippingState: "",
    shippingAddress: "",
    shippingZip: "",
    shippingPhone: "",
  };
  if (!sa || typeof sa !== "object") return empty;
  const o = sa as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : "");
  const name = pickRecipientFromShipping(sa) ?? str("full_name") ?? str("recipient_name");
  return {
    shippingName: name || "",
    shippingCity: str("city") || str("locality") || "",
    shippingState: str("state") || str("province") || "",
    shippingAddress: str("address") || str("street") || str("address_line") || "",
    shippingZip: str("zip") || str("postal_code") || "",
    shippingPhone: str("phone") || str("phone_number") || "",
  };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const email = session.user.email;
    const { id: rawId } = await context.params;
    const id = decodeURIComponent(rawId ?? "");

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    if (id.startsWith("sb-")) {
      const uuid = id.slice(3);
      const sellerUuid = await getProfileUuidForPrismaUserId(userId);
      const buyerUuid = email ? await getProfileUuidByEmail(email) : null;

      const { data: row, error } = await supabaseService
        .from("orders")
        .select(
          `
          id,
          total_amount,
          status,
          created_at,
          buyer_id,
          seller_id,
          shipping_address,
          order_items (
            id,
            quantity,
            unit_price,
            product:products (
              id,
              title,
              product_images ( url )
            )
          )
        `
        )
        .eq("id", uuid)
        .maybeSingle();

      if (error) {
        console.error("orders/[id] supabase:", error);
        return NextResponse.json({ error: "Error al cargar el pedido" }, { status: 500 });
      }
      if (!row) {
        return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
      }

      const r = row as unknown as {
        id: string;
        total_amount: number | string;
        status: string;
        created_at: string;
        buyer_id?: string | null;
        seller_id?: string | null;
        shipping_address?: unknown;
        order_items?: Array<{
          id: string;
          quantity: number;
          unit_price: number | string;
          product: { id?: string; title: string; product_images?: Array<{ url: string }> | null } | null;
        }>;
      };

      const isSeller = sellerUuid && r.seller_id === sellerUuid;
      const isBuyer = buyerUuid && r.buyer_id === buyerUuid;
      if (!isSeller && !isBuyer) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }

      let buyerDisplay: { name: string | null; email: string | null } | null = null;
      if (r.buyer_id) {
        const { data: prof } = await supabaseService
          .from("profiles")
          .select("email")
          .eq("id", r.buyer_id)
          .maybeSingle();
        const em = (prof as { email?: string | null } | null)?.email ?? null;
        buyerDisplay = {
          name: em ? em.split("@")[0] || null : null,
          email: em,
        };
      }

      const perspective = isBuyer ? "buyer" : "seller";
      const ship = pickShippingFromJson(r.shipping_address);
      const orderNumber = `MP-${String(r.id).replace(/-/g, "").slice(0, 12).toUpperCase()}`;
      const items = (r.order_items ?? []).map((it) => ({
        id: it.id,
        quantity: it.quantity,
        price: Number(it.unit_price),
        product: {
          id: it.product?.id ?? null,
          title: it.product?.title ?? "Producto",
          images: (it.product?.product_images ?? []).map((im) => ({ url: im.url })),
          seller: null as { id: string; name: string | null } | null,
        },
      }));

      return NextResponse.json({
        order: {
          id: `sb-${r.id}`,
          orderNumber,
          status: mapSupabaseOrderStatus(String(r.status)),
          total: Number(r.total_amount),
          createdAt: new Date(r.created_at).toISOString(),
          perspective,
          shippingName: ship.shippingName,
          shippingCity: ship.shippingCity,
          shippingState: ship.shippingState,
          shippingAddress: ship.shippingAddress,
          shippingZip: ship.shippingZip,
          shippingPhone: ship.shippingPhone,
          buyer: buyerDisplay,
          items,
        },
      });
    }

    type PrismaOrderDetail = {
      id: string;
      orderNumber: string;
      status: string;
      total: number;
      createdAt: Date;
      buyerId: string;
      shippingName: string;
      shippingCity: string;
      shippingState: string;
      shippingAddress: string;
      shippingZip: string;
      shippingPhone: string;
      buyer: { id: string; name: string | null; email: string | null } | null;
      items: Array<{
        id: string;
        quantity: number;
        price: number;
        product: {
          id: string;
          title: string;
          price: number;
          sellerId: string;
          images: Array<{ url: string }>;
          seller: { id: string; name: string | null } | null;
        } | null;
      }>;
    };

    const order = (await prisma.order.findFirst({
      where: {
        id,
        OR: [{ buyerId: userId }, { items: { some: { product: { sellerId: userId } } } }],
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                sellerId: true,
                images: { orderBy: { order: "asc" }, take: 5, select: { url: true } },
                seller: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    })) as PrismaOrderDetail | null;

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const isBuyer = order.buyerId === userId;
    const perspective = isBuyer ? "buyer" : "seller";
    let items = order.items.map((it) => ({
      id: it.id,
      quantity: it.quantity,
      price: Number(it.price),
      product: {
        id: it.product?.id ?? null,
        title: it.product?.title ?? "Producto",
        images: (it.product?.images ?? []).map((im) => ({ url: im.url })),
        seller: it.product?.seller ? { id: it.product.seller.id, name: it.product.seller.name } : null,
      },
    }));

    if (perspective === "seller") {
      items = items.filter((it) => {
        const sid = order.items.find((oi) => oi.id === it.id)?.product?.sellerId;
        return sid === userId;
      });
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
        perspective,
        shippingName: order.shippingName,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingAddress: order.shippingAddress,
        shippingZip: order.shippingZip,
        shippingPhone: order.shippingPhone,
        buyer: order.buyer
          ? { name: order.buyer.name, email: order.buyer.email }
          : { name: null, email: null },
        items,
      },
    });
  } catch (e) {
    console.error("GET /api/orders/[id]:", e);
    return NextResponse.json({ error: "Error al cargar el pedido" }, { status: 500 });
  }
}
