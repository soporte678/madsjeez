/**
 * POST/GET /api/cron/check-alerts
 *
 * Evalúa las alertas de producto (baja de precio / vuelve stock) y crea
 * notificaciones para los compradores. Pensado para un cron (Railway/cron-job).
 *
 * Auth: secreto interno (x-internal-secret / Bearer = ADMIN_SETUP_SECRET o
 * CRON_SECRET). No es público.
 */

import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET || process.env.INTERNAL_API_SECRET;
  if (!secret) return false;
  const provided =
    req.headers.get("x-internal-secret") ||
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return provided === secret;
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { data, error } = await supabaseService.rpc("process_product_alerts");
  if (error) {
    console.error("check-alerts:", error);
    return NextResponse.json({ error: "Error procesando alertas" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, notificationsCreated: data ?? 0 });
}

export async function POST(req: Request) {
  return run(req);
}
export async function GET(req: Request) {
  return run(req);
}
