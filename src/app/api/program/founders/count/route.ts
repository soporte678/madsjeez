/**
 * GET /api/program/founders/count
 *
 * Endpoint público (sin auth) que devuelve el progreso del programa
 * Sellers Fundadores. Lee `count(*)` sobre `founder_program` con status='active'.
 *
 * Cache: ISR 60s para no martillar la DB en cada request del landing.
 */
import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/service";

export const revalidate = 60;
export const runtime = "nodejs";
export const dynamic = "force-static";

const TOTAL_SLOTS = 100;

export async function GET() {
  try {
    const sb = getSupabaseService();
    const { count, error } = await sb
      .from("founder_program")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    if (error) {
      // Tabla puede no existir todavía en algunos entornos. Devolvemos 0 sin romper el landing.
      return NextResponse.json(
        {
          taken: 0,
          total: TOTAL_SLOTS,
          slotsLeft: TOTAL_SLOTS,
          percentTaken: 0,
        },
        { status: 200, headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
      );
    }

    const taken = Math.min(count ?? 0, TOTAL_SLOTS);
    const slotsLeft = Math.max(TOTAL_SLOTS - taken, 0);
    const percentTaken = (taken / TOTAL_SLOTS) * 100;

    return NextResponse.json(
      { taken, total: TOTAL_SLOTS, slotsLeft, percentTaken },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
    );
  } catch {
    return NextResponse.json(
      { taken: 0, total: TOTAL_SLOTS, slotsLeft: TOTAL_SLOTS, percentTaken: 0 },
      { status: 200 },
    );
  }
}
