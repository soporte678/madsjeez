/**
 * /api/partsvision/admin/parts — piezas técnicas (para vincular en el editor).
 *   GET ?q=         → busca piezas por nombre.
 *   POST { canonicalName, partType?, oemNumber?, brandId? }
 *        → crea una pieza técnica (draft) + opcionalmente su primer OEM.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

export async function GET(req: NextRequest) {
  const admin = await requireAdminRequest(req);
  if (admin instanceof NextResponse) return admin;
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";

  let query = supabaseService
    .from("pv_technical_parts")
    .select("id, canonical_name, part_type, status")
    .order("canonical_name")
    .limit(30);
  if (q) query = query.ilike("canonical_name", `%${q}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Error" }, { status: 500 });
  return NextResponse.json({ parts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminRequest(req);
  if (admin instanceof NextResponse) return admin;

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const canonicalName = String(b.canonicalName || "").trim();
  if (!canonicalName) return NextResponse.json({ error: "Falta nombre de la pieza" }, { status: 400 });

  const { data: part, error } = await supabaseService
    .from("pv_technical_parts")
    .insert({
      canonical_name: canonicalName.slice(0, 200),
      normalized_name: normalize(canonicalName).slice(0, 200),
      part_type: (b.partType as string) || null,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !part) return NextResponse.json({ error: "No se pudo crear la pieza" }, { status: 500 });

  // OEM opcional
  if (b.oemNumber && String(b.oemNumber).trim()) {
    const oem = String(b.oemNumber).trim();
    await supabaseService.from("pv_oem_part_numbers").insert({
      part_id: part.id,
      brand_id: b.brandId || null,
      oem_number: oem.slice(0, 60),
      normalized_oem: normalize(oem).replace(/[^a-z0-9]/g, "").slice(0, 60),
      verified: false,
    });
  }
  return NextResponse.json({ ok: true, id: part.id });
}
