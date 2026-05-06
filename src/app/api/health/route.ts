import { NextResponse } from "next/server";

/** Healthcheck de Railway / balanceadores: debe ser barato y siempre 200 si el proceso HTTP vive. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "madsjeez-marketplace",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}

export async function HEAD() {
  return new NextResponse(null, { status: 200, headers: { "Cache-Control": "no-store" } });
}
