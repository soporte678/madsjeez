/**
 * POST /api/partsvision/admin/hotspots
 * Guarda (reemplaza) el set completo de hotspots de un diagrama.
 * Body: { diagramId, hotspots: [{ partId?, calloutNumber?, shapeType, x, y, width?, height?, polygonPoints?, tooltipText? }] }
 *
 * Coords normalizadas 0-1 (resolución-independiente).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const SHAPES = ["circle", "rect", "polygon"];

export async function POST(req: NextRequest) {
  const admin = await requireAdminRequest(req);
  if (admin instanceof NextResponse) return admin;

  let b: { diagramId?: string; hotspots?: Record<string, unknown>[] };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const diagramId = b.diagramId;
  if (!diagramId || !Array.isArray(b.hotspots)) {
    return NextResponse.json({ error: "Falta diagramId o hotspots" }, { status: 400 });
  }

  const rows = b.hotspots
    .filter((h) => SHAPES.includes(String(h.shapeType)))
    .map((h, i) => ({
      diagram_id: diagramId,
      part_id: h.partId || null,
      fitment_id: h.fitmentId || null,
      callout_number: h.calloutNumber != null ? String(h.calloutNumber).slice(0, 12) : null,
      shape_type: String(h.shapeType),
      x: clamp01(h.x),
      y: clamp01(h.y),
      width: h.width != null ? clamp01(h.width) : null,
      height: h.height != null ? clamp01(h.height) : null,
      polygon_points: Array.isArray(h.polygonPoints) ? h.polygonPoints : null,
      sort_order: i,
      tooltip_text: h.tooltipText ? String(h.tooltipText).slice(0, 300) : null,
    }));

  // Reemplazo atómico-ish: borrar + insertar.
  const del = await supabaseService.from("pv_diagram_hotspots").delete().eq("diagram_id", diagramId);
  if (del.error) return NextResponse.json({ error: "No se pudo limpiar" }, { status: 500 });
  if (rows.length) {
    const ins = await supabaseService.from("pv_diagram_hotspots").insert(rows);
    if (ins.error) return NextResponse.json({ error: "No se pudieron guardar los hotspots" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, saved: rows.length });
}

function clamp01(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
