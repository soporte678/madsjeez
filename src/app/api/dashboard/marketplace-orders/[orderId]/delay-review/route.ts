import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";
import { getProfileUuidForPrismaUserId } from "@/lib/supabase-profile-map";
import {
  computeDispatchDelay,
  mergeSellerFulfillmentIntoShipping,
  parseSellerFulfillment,
} from "@/lib/orders/seller-fulfillment";

function stripSb(id: string) {
  return id.startsWith("sb-") ? id.slice(3) : id;
}

/**
 * POST /api/dashboard/marketplace-orders/[orderId]/delay-review
 * Registra solicitud de revisión por demora (con texto y URLs de prueba).
 */
export async function POST(
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

    const body = (await request.json()) as { reason?: string; proof_urls?: string[] };
    const reason = (body.reason ?? "").trim();
    if (reason.length < 10) {
      return NextResponse.json({ error: "Indicá el motivo (mínimo 10 caracteres)" }, { status: 400 });
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

    const r = row as { seller_id?: string; shipping_address?: unknown; status?: string };
    if (r.seller_id !== sellerUuid) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const delay = computeDispatchDelay({
      mpStatus: String(r.status ?? ""),
      shipping_address: r.shipping_address,
    });
    if (!delay.isDispatchLate) {
      return NextResponse.json(
        { error: "Solo podés pedir revisión si el envío está demorado (24 h desde el pago sin despacho)." },
        { status: 409 }
      );
    }

    const prev = parseSellerFulfillment(r.shipping_address);
    if (prev.delay_review?.requested_at) {
      return NextResponse.json({ error: "Ya registramos una solicitud de revisión para este pedido." }, { status: 409 });
    }

    const review = {
      requested_at: new Date().toISOString(),
      reason,
      proof_urls: Array.isArray(body.proof_urls) ? body.proof_urls.filter((u) => typeof u === "string") : [],
    };

    const nextShip = mergeSellerFulfillmentIntoShipping(r.shipping_address, {
      delay_review: review,
    });

    const { error: upErr } = await supabaseService
      .from("orders")
      .update({ shipping_address: nextShip, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (upErr) {
      console.error("delay-review update:", upErr);
      return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, delay_review: review });
  } catch (e) {
    console.error("POST delay-review:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
