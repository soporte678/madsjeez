import { prisma } from "@/lib/prisma";
import { supabaseService } from "@/lib/supabase/service";
import { getProfileUuidByEmail } from "@/lib/supabase-profile-map";
import { normalizeEmail, normalizePhone, normalizeDocument, readGuestClaimFromShipping, guestClaimMatchesProfile } from "@/lib/orders/guest-claim";

export function mapSupabaseOrderStatus(sb: string): string {
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

/** Formato unificado para UI de compras (/orders, dashboard compras) */
export type MergedBuyerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string | Date;
  shipment: unknown | null;
  shippingName: string;
  shippingCity: string;
  shippingState: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      title: string;
      images: Array<{ url: string }>;
      seller: { id?: string; name: string | null } | null;
    };
  }>;
};

/**
 * Órdenes del comprador: Prisma + Supabase por `buyer_id` + pedidos vinculados por `guest_claim` (email/tel/doc).
 */
export async function fetchMergedBuyerOrders(
  prismaUserId: string,
  email: string | null | undefined,
  guestProfile?: { email?: string | null; phone?: string | null; document?: string | null }
): Promise<MergedBuyerOrder[]> {
  type BuyerOrderRow = {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: Date;
    shipment: unknown | null;
    shippingName: string;
    shippingCity: string;
    shippingState: string;
    items: Array<{
      id: string;
      quantity: number;
      price: number;
      product: {
        title: string;
        images: Array<{ url: string }>;
        seller: { id: string; name: string | null } | null;
      } | null;
    }>;
  };

  const prismaOrders = (await prisma.order.findMany({
    where: { buyerId: prismaUserId },
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
  })) as BuyerOrderRow[];

  const normalized: MergedBuyerOrder[] = prismaOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: Number(o.total),
    createdAt: o.createdAt,
    shipment: o.shipment,
    shippingName: o.shippingName,
    shippingCity: o.shippingCity,
    shippingState: o.shippingState,
    items: o.items.map((it) => ({
      id: it.id,
      quantity: it.quantity,
      price: Number(it.price),
      product: {
        title: it.product?.title ?? "Producto",
        images: (it.product?.images ?? []).map((im) => ({ url: im.url })),
        seller: it.product?.seller ? { id: it.product.seller.id, name: it.product.seller.name } : null,
      },
    })),
  }));

  let merged = [...normalized];

  try {
    const buyerUuid = await getProfileUuidByEmail(email);
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
        .order("created_at", { ascending: false })
        .limit(200);

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

        const sbMapped: MergedBuyerOrder[] = (sbRows as unknown as SbRow[]).map((row) => ({
          id: `sb-${row.id}`,
          orderNumber: `MP-${String(row.id).replace(/-/g, "").slice(0, 10).toUpperCase()}`,
          status: mapSupabaseOrderStatus(String(row.status)),
          total: Number(row.total_amount),
          createdAt: row.created_at,
          shipment: null,
          shippingName: "",
          shippingCity: "",
          shippingState: "",
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
      }
    }

    const profile = {
      email: guestProfile?.email ?? email,
      phone: guestProfile?.phone,
      document: guestProfile?.document,
    };

    const seenGuest = new Set(merged.filter((m) => m.id.startsWith("sb-")).map((m) => m.id));

    type GuestOrderRow = {
      id: string;
      total_amount: number | string;
      status: string;
      created_at: string;
      shipping_address?: unknown;
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

    const fetchGuestByContains = async (fragment: Record<string, unknown>) => {
      const { data: rows, error: err } = await supabaseService
        .from("orders")
        .select(
          `
          id,
          total_amount,
          status,
          created_at,
          shipping_address,
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
        .contains("shipping_address", fragment)
        .order("created_at", { ascending: false })
        .limit(80);
      if (err || !rows?.length) return;
      for (const row of rows as unknown as GuestOrderRow[]) {
        const sid = `sb-${row.id}`;
        if (seenGuest.has(sid)) continue;
        const claim = readGuestClaimFromShipping(row.shipping_address);
        if (!guestClaimMatchesProfile(claim, profile)) continue;
        seenGuest.add(sid);
        merged.push({
          id: sid,
          orderNumber: `MP-${String(row.id).replace(/-/g, "").slice(0, 10).toUpperCase()}`,
          status: mapSupabaseOrderStatus(String(row.status)),
          total: Number(row.total_amount),
          createdAt: row.created_at,
          shipment: null,
          shippingName: "",
          shippingCity: "",
          shippingState: "",
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
        });
      }
    };

    const em = normalizeEmail(profile.email);
    if (em) await fetchGuestByContains({ guest_claim: { email: em } });
    const ph = normalizePhone(profile.phone ?? undefined);
    if (ph && ph.length >= 6) await fetchGuestByContains({ guest_claim: { phone: ph } });
    const doc = normalizeDocument(profile.document ?? undefined);
    if (doc && doc.length >= 4) await fetchGuestByContains({ guest_claim: { document: doc } });

    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error("merge Supabase buyer orders:", e);
  }

  return merged;
}
