import { prisma } from "@/lib/prisma";
import { supabaseService } from "@/lib/supabase/service";
import { getProfileUuidForPrismaUserId } from "@/lib/supabase-profile-map";
import { mapSupabaseOrderStatus } from "@/lib/orders/merge-buyer-orders";
import {
  computeDispatchDelay,
  FULFILLMENT_STAGE_LABEL,
  type SellerFulfillmentStage,
} from "@/lib/orders/seller-fulfillment";

/** Pedido unificado para panel del vendedor (Prisma + Supabase marketplace). */
export type MergedSellerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: Date | string;
  shippingCity: string;
  shippingState: string;
  buyerName: string | null;
  buyerEmail: string | null;
  /** Supabase marketplace only — etapa operativa del vendedor. */
  fulfillmentStage?: SellerFulfillmentStage;
  fulfillmentStageLabel?: string;
  /** Texto tipo "Paquete demorado 3 días" si pasaron 24h desde el pago sin despacho. */
  delayLabel?: string | null;
  delayDays?: number;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id?: string;
      title: string;
      images: Array<{ url: string }>;
    };
  }>;
};

function pickRecipientFromShipping(sa: unknown): string | null {
  if (!sa || typeof sa !== "object") return null;
  const o = sa as Record<string, unknown>;
  if (typeof o.recipient === "string" && o.recipient.trim()) return o.recipient.trim();
  if (typeof o.full_name === "string" && o.full_name.trim()) return o.full_name.trim();
  if (typeof o.name === "string" && o.name.trim()) return o.name.trim();
  return null;
}

/**
 * Ventas del vendedor: órdenes Prisma donde vendió algún ítem + órdenes marketplace en Supabase (`seller_id` = perfil del vendedor).
 */
export async function fetchMergedSellerOrders(prismaSellerId: string): Promise<MergedSellerOrder[]> {
  type SellerOrderRow = {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: Date;
    shippingCity: string;
    shippingState: string;
    buyer: { id: string; name: string | null; email: string | null } | null;
    items: Array<{
      id: string;
      quantity: number;
      price: number;
      product: {
        id: string;
        title: string;
        images: Array<{ url: string }>;
      } | null;
    }>;
  };

  const prismaOrders = (await prisma.order.findMany({
    where: { items: { some: { product: { sellerId: prismaSellerId } } } },
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      items: {
        where: { product: { sellerId: prismaSellerId } },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  })) as SellerOrderRow[];

  const fromPrisma: MergedSellerOrder[] = prismaOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: Number(o.total),
    createdAt: o.createdAt,
    shippingCity: o.shippingCity,
    shippingState: o.shippingState,
    buyerName: o.buyer?.name ?? null,
    buyerEmail: o.buyer?.email ?? null,
    items: o.items.map((it) => ({
      id: it.id,
      quantity: it.quantity,
      price: Number(it.price),
      product: {
        id: it.product?.id,
        title: it.product?.title ?? "Producto",
        images: (it.product?.images ?? []).map((im) => ({ url: im.url })),
      },
    })),
  }));

  let merged = [...fromPrisma];

  try {
    const sellerUuid = await getProfileUuidForPrismaUserId(prismaSellerId);
    if (!sellerUuid) return merged;

    const { data: sbRows, error } = await supabaseService
      .from("orders")
      .select(
        `
          id,
          total_amount,
          status,
          created_at,
          buyer_id,
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
      .eq("seller_id", sellerUuid)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error || !sbRows?.length) return merged;

    const buyerIds = [...new Set((sbRows as { buyer_id?: string }[]).map((r) => r.buyer_id).filter(Boolean))] as string[];
    const nameByBuyer = new Map<string, { name: string | null; email: string | null }>();
    if (buyerIds.length) {
      const { data: profiles } = await supabaseService.from("profiles").select("id, email").in("id", buyerIds);
      for (const p of profiles ?? []) {
        const row = p as { id: string; email: string | null };
        nameByBuyer.set(row.id, {
          name: row.email?.split("@")[0] ?? null,
          email: row.email ?? null,
        });
      }
    }

    type SbRow = {
      id: string;
      total_amount: number | string;
      status: string;
      created_at: string;
      buyer_id?: string;
      shipping_address?: unknown;
      order_items?: Array<{
        id: string;
        quantity: number;
        unit_price: number | string;
        product: {
          id?: string;
          title: string;
          product_images?: Array<{ url: string }> | null;
        } | null;
      }>;
    };

    const fromSb: MergedSellerOrder[] = (sbRows as unknown as SbRow[]).map((row) => {
      const buyer = row.buyer_id ? nameByBuyer.get(row.buyer_id) : undefined;
      const shipName = pickRecipientFromShipping(row.shipping_address);
      const delay = computeDispatchDelay({
        mpStatus: row.status,
        shipping_address: row.shipping_address,
      });
      const stage = delay.fulfillment.stage;
      return {
        id: `sb-${row.id}`,
        orderNumber: `MP-${String(row.id).replace(/-/g, "").slice(0, 12).toUpperCase()}`,
        status: mapSupabaseOrderStatus(String(row.status)),
        total: Number(row.total_amount),
        createdAt: row.created_at,
        shippingCity: "",
        shippingState: "",
        buyerName: shipName ?? buyer?.name ?? null,
        buyerEmail: buyer?.email ?? null,
        fulfillmentStage: stage,
        fulfillmentStageLabel: FULFILLMENT_STAGE_LABEL[stage],
        delayLabel: delay.delayLabel,
        delayDays: delay.delayDays,
        items: (row.order_items ?? []).map((it) => ({
          id: it.id,
          quantity: it.quantity,
          price: Number(it.unit_price),
          product: {
            id: it.product?.id,
            title: it.product?.title ?? "Producto",
            images: (it.product?.product_images ?? []).map((im) => ({ url: im.url })),
          },
        })),
      };
    });

    merged = [...merged, ...fromSb];
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error("merge seller orders (Supabase):", e);
  }

  return merged;
}
