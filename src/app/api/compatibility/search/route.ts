/**
 * GET /api/compatibility/search?type=&brand=&model=&cc=
 * Productos compatibles con la máquina indicada. Solo datos cargados.
 */

import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  if (!type) return NextResponse.json({ error: "Falta tipo de máquina" }, { status: 400 });
  const cc = searchParams.get("cc");

  const { data, error } = await supabaseService.rpc("compat_search_products", {
    p_type: type,
    p_brand: searchParams.get("brand") || null,
    p_model: searchParams.get("model") || null,
    p_displacement: cc ? Number(cc) : null,
    p_limit: 60,
  });
  if (error) return NextResponse.json({ error: "Error en la búsqueda" }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}
