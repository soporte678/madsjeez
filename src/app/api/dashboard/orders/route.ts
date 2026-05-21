import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchMergedSellerOrders } from "@/lib/orders/merge-seller-orders";
import { fetchMergedBuyerOrders } from "@/lib/orders/merge-buyer-orders";
import { getProfileUuidByEmail } from "@/lib/supabase-profile-map";
import { supabaseService } from "@/lib/supabase/service";

function summarizeByStatus(
  orders: Array<{ status: string; total: number }>
): Record<string, { count: number; total: number }> {
  return orders.reduce(
    (acc, o) => {
      const cur = acc[o.status] ?? { count: 0, total: 0 };
      acc[o.status] = { count: cur.count + 1, total: cur.total + o.total };
      return acc;
    },
    {} as Record<string, { count: number; total: number }>
  );
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const skip = (page - 1) * limit;

    const role = searchParams.get("role") || "seller";

    if (role === "seller") {
      const allMerged = await fetchMergedSellerOrders(userId);
      const statusSummary = summarizeByStatus(allMerged);

      let list = allMerged;
      if (status && status !== "all") {
        list = list.filter((o) => o.status === status);
      }
      const total = list.length;
      const pageSlice = list.slice(skip, skip + limit);
      const orders = pageSlice.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        createdAt: new Date(o.createdAt as string | Date).toISOString(),
        shippingName: o.buyerName || "Comprador",
        shippingCity: o.shippingCity,
        shippingState: o.shippingState,
        buyer: { id: null as string | null, name: o.buyerName, email: o.buyerEmail },
        fulfillmentStage: o.fulfillmentStage ?? null,
        fulfillmentStageLabel: o.fulfillmentStageLabel ?? null,
        delayLabel: o.delayLabel ?? null,
        delayDays: o.delayDays ?? 0,
        items: o.items.map((it) => ({
          id: it.id,
          quantity: it.quantity,
          price: it.price,
          product: {
            id: it.product.id,
            title: it.product.title,
            price: it.price,
            images: it.product.images,
          },
        })),
      }));

      return NextResponse.json({
        orders,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
        statusSummary,
      });
    }

    if (role === "buyer") {
      const email = session.user.email;
      if (!email) {
        return NextResponse.json({ error: "Email requerido para ver compras" }, { status: 400 });
      }

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

      const allMerged = await fetchMergedBuyerOrders(userId, email, {
        email,
        phone: guestPhone,
        document: guestDocument,
      });
      const statusSummary = summarizeByStatus(
        allMerged.map((o) => ({ status: o.status, total: o.total }))
      );

      let list = allMerged;
      if (status && status !== "all") {
        list = list.filter((o) => o.status === status);
      }
      const total = list.length;
      const pageSlice = list.slice(skip, skip + limit);
      const orders = pageSlice.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        createdAt: new Date(o.createdAt as string | Date).toISOString(),
        shippingName: o.shippingName || "—",
        shippingCity: o.shippingCity || "—",
        shippingState: o.shippingState || "—",
        buyer: { id: userId, name: null as string | null, email },
        items: o.items.map((it) => ({
          id: it.id,
          quantity: it.quantity,
          price: it.price,
          product: {
            id: null as string | null,
            title: it.product.title,
            price: it.price,
            images: it.product.images,
            seller: it.product.seller,
          },
        })),
      }));

      return NextResponse.json({
        orders,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
        statusSummary,
      });
    }

    return NextResponse.json({ error: "Rol inválido. Usá role=seller o role=buyer." }, { status: 400 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 });
  }
}
