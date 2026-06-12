/**
 * /api/partsvision/admin/diagrams — gestión de despieces (admin).
 *   GET            → lista de diagramas (con conteo de hotspots).
 *   POST { title, imageUrl, modelId?, assemblyId?, diagramType?, copyrightStatus? }
 *        → crea un diagrama en estado draft.
 *
 * Admin-gated. Las coords de hotspots van normalizadas (0-1) en otra ruta.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdminRequest(req);
  if (admin instanceof NextResponse) return admin;

  const { data, error } = await supabaseService
    .from("pv_diagrams")
    .select("id, title, image_url, diagram_type, publication_status, copyright_status, model_id, assembly_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: "Error" }, { status: 500 });

  // conteo de hotspots por diagrama
  const ids = (data ?? []).map((d) => d.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: hs } = await supabaseService
      .from("pv_diagram_hotspots")
      .select("diagram_id")
      .in("diagram_id", ids);
    for (const h of hs ?? []) counts.set(h.diagram_id, (counts.get(h.diagram_id) ?? 0) + 1);
  }
  return NextResponse.json({
    diagrams: (data ?? []).map((d) => ({ ...d, hotspotCount: counts.get(d.id) ?? 0 })),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminRequest(req);
  if (admin instanceof NextResponse) return admin;

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const title = String(b.title || "").trim();
  const imageUrl = String(b.imageUrl || "").trim();
  if (!title || !/^https?:\/\//i.test(imageUrl)) {
    return NextResponse.json({ error: "Falta título o imagen válida" }, { status: 400 });
  }

  const { data, error } = await supabaseService
    .from("pv_diagrams")
    .insert({
      title,
      image_url: imageUrl,
      model_id: b.modelId || null,
      assembly_id: b.assemblyId || null,
      diagram_type: (b.diagramType as string) || "exploded_view",
      copyright_status: (b.copyrightStatus as string) || "unknown",
      publication_status: "draft",
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
