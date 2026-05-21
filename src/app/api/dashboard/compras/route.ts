import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchMergedBuyerOrders } from "@/lib/orders/merge-buyer-orders";
import { getProfileUuidByEmail } from "@/lib/supabase-profile-map";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CompraItem {
  id: string;
  orderNumber: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  total: number;
  shippingName: string;
  shippingCity: string;
  shippingState: string;
  productTitle: string;
  productImage: string | null;
  productQuantity: number;
  productPrice: number;
  sellerName: string | null;
  createdAt: string;
  /** Más de un ítem en la orden (resumen en lista). */
  itemCount: number;
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendiente de pago", color: "#f23d4f" },
  PAID: { label: "Pago confirmado", color: "#3483fa" },
  PROCESSING: { label: "Preparando envío", color: "#3483fa" },
  SHIPPED: { label: "En camino", color: "#3483fa" },
  DELIVERED: { label: "Entregado", color: "#00a650" },
  CANCELLED: { label: "Cancelada", color: "#999" },
  REFUNDED: { label: "Reembolsado", color: "#999" },
};

function formatDate(date: Date | string): string {
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const d = new Date(date);
  return `${d.getDate()} de ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const email = session.user.email;
    const buyerUuid = await getProfileUuidByEmail(email);
    let guestPhone: string | undefined;
    let guestDocument: string | undefined;
    if (buyerUuid) {
      const { data: prof } = await supabaseService
        .from("profiles")
        .select("phone, dni, document")
        .eq("id", buyerUuid)
        .maybeSingle();
      const p = prof as { phone?: string | null; dni?: string | null; document?: string | null } | null;
      guestPhone = p?.phone ?? undefined;
      guestDocument = (p?.document ?? p?.dni) ?? undefined;
    }

    const merged = await fetchMergedBuyerOrders(userId, email, {
      email,
      phone: guestPhone,
      document: guestDocument,
    });

    const compras: CompraItem[] = merged.map((order) => {
      const first = order.items[0];
      const n = order.items.length;
      const statusInfo = statusMap[order.status] || { label: order.status, color: "#999" };
      const titleBase = first?.product?.title ?? "Producto";
      const productTitle = n > 1 ? `${titleBase} (+${n - 1} producto${n - 1 === 1 ? "" : "s"})` : titleBase;

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        statusLabel: statusInfo.label,
        statusColor: statusInfo.color,
        total: order.total,
        shippingName: order.shippingName || "—",
        shippingCity: order.shippingCity || "—",
        shippingState: order.shippingState || "—",
        productTitle,
        productImage: first?.product?.images?.[0]?.url ?? null,
        productQuantity: first?.quantity ?? 1,
        productPrice: first?.price ?? order.total,
        sellerName: first?.product?.seller?.name ?? null,
        createdAt: formatDate(order.createdAt),
        itemCount: n,
      };
    });

    return NextResponse.json({
      compras,
      total: compras.length,
      isRealData: true,
      tableExists: true,
    });
  } catch (error) {
    console.error("Error fetching compras:", error);
    return NextResponse.json(
      {
        compras: [] as CompraItem[],
        total: 0,
        isRealData: false,
        tableExists: false,
        error: "Error fetching compras",
      },
      { status: 500 }
    );
  }
}
