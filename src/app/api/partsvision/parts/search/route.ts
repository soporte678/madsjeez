/**
 * GET /api/partsvision/parts/search?q=
 * Busca piezas técnicas PUBLICADAS por nombre o por código OEM.
 * Público (lo usa el vendedor para vincular su producto). Solo published.
 */

import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (q.length < 2) return NextResponse.json({ parts: [] });

  // Por nombre
  const { data: byName } = await supabaseService
    .from("pv_technical_parts")
    .select("id, canonical_name, part_type")
    .eq("status", "published")
    .ilike("canonical_name", `%${q}%`)
    .limit(15);

  // Por OEM (normalizado)
  const normOem = q.toLowerCase().replace(/[^a-z0-9]/g, "");
  const { data: byOem } = await supabaseService
    .from("pv_oem_part_numbers")
    .select("part_id, oem_number")
    .ilike("normalized_oem", `%${normOem}%`)
    .limit(15);

  const oemPartIds = Array.from(new Set((byOem ?? []).map((o) => o.part_id)));
  let oemParts: { id: string; canonical_name: string; part_type: string | null }[] = [];
  if (oemPartIds.length) {
    const { data } = await supabaseService
      .from("pv_technical_parts")
      .select("id, canonical_name, part_type")
      .in("id", oemPartIds)
      .eq("status", "published");
    oemParts = data ?? [];
  }

  // Merge único por id
  const map = new Map<string, { id: string; canonical_name: string; part_type: string | null }>();
  for (const p of [...(byName ?? []), ...oemParts]) map.set(p.id, p);

  return NextResponse.json({ parts: Array.from(map.values()).slice(0, 20) });
}
