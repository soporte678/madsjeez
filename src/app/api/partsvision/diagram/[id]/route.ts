/**
 * GET /api/partsvision/diagram/[id]  (público)
 * Diagrama PUBLICADO + hotspots + pieza de cada hotspot (OEM) + publicaciones
 * (productos) vinculadas y aprobadas. Solo contenido aprobado/publicado (RLS-safe).
 */

import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { isPartsVisionEnabled } from "@/lib/partsvision/feature-flags";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isPartsVisionEnabled())) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }
  const { id } = await params;

  const { data: diagram } = await supabaseService
    .from("pv_diagrams")
    .select("id, title, image_url, diagram_type, width, height, model_id, assembly_id")
    .eq("id", id)
    .eq("publication_status", "published")
    .maybeSingle();
  if (!diagram) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { data: hotspots } = await supabaseService
    .from("pv_diagram_hotspots")
    .select("id, part_id, callout_number, shape_type, x, y, width, height, polygon_points, tooltip_text")
    .eq("diagram_id", id)
    .order("sort_order");

  const partIds = Array.from(new Set((hotspots ?? []).map((h) => h.part_id).filter(Boolean))) as string[];

  // Piezas (solo publicadas) + OEM + productos vinculados aprobados
  const partsMap: Record<string, unknown> = {};
  if (partIds.length) {
    const { data: parts } = await supabaseService
      .from("pv_technical_parts")
      .select("id, canonical_name, part_type, image_url")
      .in("id", partIds)
      .eq("status", "published");
    const { data: oems } = await supabaseService
      .from("pv_oem_part_numbers")
      .select("part_id, oem_number")
      .in("part_id", partIds);
    const { data: links } = await supabaseService
      .from("pv_product_part_links")
      .select("part_id, product_id, compatibility_claim")
      .in("part_id", partIds)
      .eq("link_status", "approved");

    const prodIds = Array.from(new Set((links ?? []).map((l) => l.product_id)));
    const prodMap = new Map<string, unknown>();
    if (prodIds.length) {
      const { data: prods } = await supabaseService
        .from("products")
        .select('id, title, price, stock, seller_id, product_images(url, "order")')
        .in("id", prodIds)
        .eq("is_active", true);
      for (const p of prods ?? []) {
        const imgs = (p as { product_images?: { url: string; order: number }[] }).product_images ?? [];
        const img = [...imgs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]?.url ?? null;
        prodMap.set(p.id, { id: p.id, title: p.title, price: p.price, stock: p.stock, image: img });
      }
    }

    for (const part of parts ?? []) {
      const partOems = (oems ?? []).filter((o) => o.part_id === part.id).map((o) => o.oem_number);
      const partProducts = (links ?? [])
        .filter((l) => l.part_id === part.id && prodMap.has(l.product_id))
        .map((l) => ({ ...(prodMap.get(l.product_id) as object), claim: l.compatibility_claim }));
      partsMap[part.id] = { ...part, oems: partOems, products: partProducts };
    }
  }

  return NextResponse.json({ diagram, hotspots: hotspots ?? [], parts: partsMap });
}
