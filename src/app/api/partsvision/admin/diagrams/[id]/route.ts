/**
 * /api/partsvision/admin/diagrams/[id]
 *   GET    → diagrama + sus hotspots (para el editor).
 *   PATCH  → actualizar (título, publication_status, copyright_status).
 *   DELETE → borrar diagrama (cascade hotspots).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const PUB = ["draft", "pending_review", "approved", "published", "rejected", "archived"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminRequest(req);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const { data: diagram } = await supabaseService
    .from("pv_diagrams")
    .select("id, title, image_url, diagram_type, publication_status, copyright_status, model_id, assembly_id, width, height")
    .eq("id", id)
    .maybeSingle();
  if (!diagram) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const { data: hotspots } = await supabaseService
    .from("pv_diagram_hotspots")
    .select("id, part_id, fitment_id, callout_number, shape_type, x, y, width, height, polygon_points, sort_order, tooltip_text")
    .eq("diagram_id", id)
    .order("sort_order");

  return NextResponse.json({ diagram, hotspots: hotspots ?? [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminRequest(req);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const patch: Record<string, unknown> = {};
  if (typeof b.title === "string") patch.title = b.title.trim().slice(0, 200);
  if (typeof b.publicationStatus === "string" && PUB.includes(b.publicationStatus)) {
    // No se publica un diagrama sin permiso de copyright resuelto.
    if (b.publicationStatus === "published") {
      const { data: d } = await supabaseService.from("pv_diagrams").select("copyright_status").eq("id", id).maybeSingle();
      const ok = ["owned", "licensed", "public_domain"].includes(String(d?.copyright_status));
      if (!ok) return NextResponse.json({ error: "No se puede publicar: copyright sin resolver (owned/licensed/public_domain)" }, { status: 422 });
    }
    patch.publication_status = b.publicationStatus;
  }
  if (typeof b.copyrightStatus === "string") patch.copyright_status = b.copyrightStatus;
  if (b.width != null) patch.width = Number(b.width);
  if (b.height != null) patch.height = Number(b.height);

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });

  const { error } = await supabaseService.from("pv_diagrams").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminRequest(req);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const { error } = await supabaseService.from("pv_diagrams").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
