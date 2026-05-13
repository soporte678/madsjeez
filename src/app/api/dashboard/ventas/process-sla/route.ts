import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseService } from "@/lib/supabase/service";
import { getProfileUuidForPrismaUserId } from "@/lib/supabase-profile-map";
import {
  computeDispatchDelay,
  mergeSellerFulfillmentIntoShipping,
  parseSellerFulfillment,
} from "@/lib/orders/seller-fulfillment";

/**
 * POST /api/dashboard/ventas/process-sla
 * Aplica impacto de demora (una vez por pedido) sobre el vendedor cuando corresponde.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sellerUuid = await getProfileUuidForPrismaUserId(session.user.id);
    if (!sellerUuid) {
      return NextResponse.json({ processed: 0, penalties: 0, message: "Sin perfil vendedor" });
    }

    const { data: rows, error } = await supabaseService
      .from("orders")
      .select("id, status, shipping_address")
      .eq("seller_id", sellerUuid)
      .limit(120);

    if (error || !rows?.length) {
      return NextResponse.json({ processed: 0, penalties: 0 });
    }

    let penalties = 0;
    for (const row of rows as Array<{ id: string; status?: string; shipping_address?: unknown }>) {
      const delay = computeDispatchDelay({
        mpStatus: String(row.status ?? ""),
        shipping_address: row.shipping_address,
      });
      const ful = parseSellerFulfillment(row.shipping_address);
      if (!delay.isDispatchLate || ful.delay_penalty_applied_at) continue;

      const nextShip = mergeSellerFulfillmentIntoShipping(row.shipping_address, {
        delay_penalty_applied_at: new Date().toISOString(),
      });
      const { error: upErr } = await supabaseService
        .from("orders")
        .update({ shipping_address: nextShip, updated_at: new Date().toISOString() })
        .eq("id", row.id);
      if (upErr) {
        console.warn("process-sla order update", row.id, upErr);
        continue;
      }
      penalties += 1;
      try {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { delayedShipments: { increment: 1 } },
        });
      } catch (e) {
        console.warn("process-sla prisma increment", e);
      }
    }

    return NextResponse.json({ processed: rows.length, penalties });
  } catch (e) {
    console.error("process-sla:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
