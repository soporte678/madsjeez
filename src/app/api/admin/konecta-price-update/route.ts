import { NextRequest, NextResponse } from "next/server";
import { syncKonectaPrices } from "@/lib/konecta/sync-prices";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-admin-secret") || "";
  const expected = process.env.ADMIN_SETUP_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const markup = parseFloat(request.nextUrl.searchParams.get("markup") || "1.5");

  try {
    const result = await syncKonectaPrices({ dryRun, markup });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[konecta-price-update]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar precios" },
      { status: 500 }
    );
  }
}
