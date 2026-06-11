/**
 * GET /api/compatibility/options?level=type|brand|model&type=&brand=
 * Devuelve valores reales para los selectores en cascada del buscador
 * "¿para qué máquina necesitás el repuesto?". Solo datos cargados (no inventa).
 */

import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level") || "type";
  if (!["type", "brand", "model"].includes(level)) {
    return NextResponse.json({ error: "level inválido" }, { status: 400 });
  }
  const { data, error } = await supabaseService.rpc("compat_options", {
    p_level: level,
    p_type: searchParams.get("type") || null,
    p_brand: searchParams.get("brand") || null,
  });
  if (error) return NextResponse.json({ error: "Error" }, { status: 500 });
  return NextResponse.json({ options: (data ?? []).map((r: { value: string }) => r.value) });
}
