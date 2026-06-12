/**
 * GET /api/partsvision/flags — flags públicos de PartsVision para el cliente.
 * Solo expone los flags partsvision_* (no secretos).
 */

import { NextResponse } from "next/server";
import { getFeatureFlags } from "@/lib/partsvision/feature-flags";

export const dynamic = "force-dynamic";

export async function GET() {
  const flags = await getFeatureFlags();
  const pv: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(flags)) {
    if (k.startsWith("partsvision_")) pv[k] = v;
  }
  return NextResponse.json(pv);
}
