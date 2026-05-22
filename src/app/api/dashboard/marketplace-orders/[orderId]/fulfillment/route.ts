import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";
import { getProfileUuidForPrismaUserId } from "@/lib/supabase-profile-map";
import {
  computeDispatchDelay,
  mergeSellerFulfillmentIntoShipping,
  type SellerFulfillment,
  type SellerFulfillmentStage,
} from "@/lib/orders/seller-fulfillment";

const ALLOWED: SellerFulfillmentStage[] = [
  "pending_pickup",
  "preparing",
  "awaiting_stock",
  "dispatched",
  "sent",
  "completed",
];

const FULFILLMENT_MANAGEABLE_STATUSES = new Set([
  "paid",
  "preparing",
  "processing",
  "shipped",
  "delivered",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
]);

function stripSb(id: string) {
  return id.startsWith("sb-") ? id.slice(3) : id;
}

/**
 * PATCH /api/dashboard/marketplace-orders/[orderId]/fulfillment
 * Actualiza etapa operativa del vendedor (JSON shipping_address.seller_fulfillment).
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { orderId: raw } = await context.params;
    const orderId = stripSb(decodeURIComponent(raw ?? ""));
    if (!orderId) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = (await request.json()) as {
      stage?: string;
      dispatched_at?: string | null;
    };
    const stage = (body.stage ?? "pending_pickup") as SellerFulfillmentStage;
    if (!ALLOWED.includes(stage)) {
      return NextResponse.json({ error: "Etapa inválida" }, { status: 400 });
    }

    const sellerUuid = await getProfileUuidForPrismaUserId(session.user.id);
    if (!sellerUuid) {
      return NextResponse.json({ error: "Perfil vendedor no encontrado" }, { status: 400 });
    }

    const { data: row, error: fetchErr } = await supabaseService
      .from("orders")
      .select("id, seller_id, status, shipping_address")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchErr || !row) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const r = row as { seller_id?: string; status?: string; shipping_address?: unknown };
    if (r.seller_id !== sellerUuid) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const orderStatus = String(r.status ?? "");
    if (
      !FULFILLMENT_MANAGEABLE_STATUSES.has(orderStatus.toLowerCase()) &&
      !FULFILLMENT_MANAGEABLE_STATUSES.has(orderStatus.toUpperCase())
    ) {
      return NextResponse.json(
        { error: "El pedido todavia no esta pagado o no admite cambios operativos." },
        { status: 409 }
      );
    }

    const fulfillmentPatch: Partial<SellerFulfillment> = { stage };
    if (stage === "dispatched" || stage === "sent" || stage === "completed") {
      fulfillmentPatch.dispatched_at = body.dispatched_at ?? new Date().toISOString();
    }

    const nextShip = mergeSellerFulfillmentIntoShipping(r.shipping_address, fulfillmentPatch);
    const { error: upErr } = await supabaseService
      .from("orders")
      .update({ shipping_address: nextShip, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (upErr) {
      console.error("fulfillment update:", upErr);
      return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
    }

    const delay = computeDispatchDelay({
      mpStatus: String((row as { status?: string }).status ?? ""),
      shipping_address: nextShip,
    });

    return NextResponse.json({
      ok: true,
      fulfillment: delay.fulfillment,
      delayLabel: delay.delayLabel,
      delayDays: delay.delayDays,
    });
  } catch (e) {
    console.error("PATCH fulfillment:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
