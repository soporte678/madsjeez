/**
 * /api/partsvision/admin/review — cola de revisión (admin).
 *   GET  → vínculos producto↔pieza pendientes + fitments pendientes.
 *   POST { kind:'link'|'fitment', id, action:'approve'|'reject' }
 *        → aprueba/rechaza. Aprobar un link lo hace visible en el visor público.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest, adminActorId } from "@/lib/admin-api";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdminRequest(req);
  if (admin instanceof NextResponse) return admin;

  // Vínculos producto↔pieza pendientes (con datos del producto + pieza)
  const { data: links } = await supabaseService
    .from("pv_product_part_links")
    .select("id, product_id, part_id, compatibility_claim, seller_id, created_at, part:part_id(canonical_name)")
    .eq("link_status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  const prodIds = Array.from(new Set((links ?? []).map((l) => l.product_id)));
  const prodMap = new Map<string, { title: string; image: string | null }>();
  if (prodIds.length) {
    const { data: prods } = await supabaseService
      .from("products").select('id, title, product_images(url, "order")').in("id", prodIds);
    for (const p of prods ?? []) {
      const imgs = (p as { product_images?: { url: string; order: number }[] }).product_images ?? [];
      prodMap.set(p.id, { title: p.title, image: [...imgs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]?.url ?? null });
    }
  }

  // Fitments pendientes
  const { data: fitments } = await supabaseService
    .from("pv_part_fitments")
    .select("id, compatibility_status, part:part_id(canonical_name), model:model_id(model_name)")
    .eq("verification_status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json({
    links: (links ?? []).map((l) => ({
      ...l,
      product: prodMap.get(l.product_id) ?? { title: "(producto)", image: null },
      partName: (l as { part?: { canonical_name?: string } }).part?.canonical_name ?? null,
    })),
    fitments: fitments ?? [],
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminRequest(req);
  if (admin instanceof NextResponse) return admin;
  const actor = adminActorId(admin);

  let b: { kind?: string; id?: string; action?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const { kind, id, action } = b;
  if (!id || !["approve", "reject"].includes(String(action))) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }
  const approved = action === "approve";

  if (kind === "link") {
    const { error } = await supabaseService.from("pv_product_part_links").update({
      link_status: approved ? "approved" : "rejected",
      verification_status: approved ? "approved" : "rejected",
      reviewed_by: actor,
    }).eq("id", id);
    if (error) return NextResponse.json({ error: "Error" }, { status: 500 });
  } else if (kind === "fitment") {
    const { error } = await supabaseService.from("pv_part_fitments").update({
      verification_status: approved ? "approved" : "rejected",
      compatibility_status: approved ? "verified" : "incompatible",
      reviewed_by: actor,
    }).eq("id", id);
    if (error) return NextResponse.json({ error: "Error" }, { status: 500 });
  } else {
    return NextResponse.json({ error: "kind inválido" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
