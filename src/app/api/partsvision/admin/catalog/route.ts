/**
 * /api/partsvision/admin/catalog — alta básica de catálogo (admin).
 *   GET ?kind=brands|models  → lista para selects.
 *   POST { kind, ... } → crea:
 *     - brand   { name, priority? }
 *     - model   { brandId, machineTypeId?, modelName, engineCc? }
 *     - publish_part { partId }   (pasa pieza draft → published)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/[áàäâ]/g, "a").replace(/[éèëê]/g, "e").replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o").replace(/[úùüû]/g, "u").replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  const admin = await requireAdminRequest(req);
  if (admin instanceof NextResponse) return admin;
  const kind = new URL(req.url).searchParams.get("kind");

  if (kind === "brands") {
    const { data } = await supabaseService.from("pv_brands").select("id, name").order("name");
    return NextResponse.json({ items: data ?? [] });
  }
  if (kind === "types") {
    const { data } = await supabaseService.from("pv_machine_types").select("id, name").eq("active", true).order("name");
    return NextResponse.json({ items: data ?? [] });
  }
  if (kind === "models") {
    const { data } = await supabaseService.from("pv_machine_models").select("id, model_name, status, brand:brand_id(name)").order("model_name").limit(300);
    return NextResponse.json({ items: data ?? [] });
  }
  return NextResponse.json({ items: [] });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminRequest(req);
  if (admin instanceof NextResponse) return admin;

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const kind = String(b.kind);

  if (kind === "brand") {
    const name = String(b.name || "").trim();
    if (!name) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
    const { data, error } = await supabaseService.from("pv_brands")
      .insert({ name: name.slice(0, 80), slug: slugify(name), priority: Number(b.priority) || 3, active: true })
      .select("id").single();
    if (error) return NextResponse.json({ error: "No se pudo crear (¿slug duplicado?)" }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  }

  if (kind === "model") {
    const brandId = String(b.brandId || "");
    const modelName = String(b.modelName || "").trim();
    if (!brandId || !modelName) return NextResponse.json({ error: "Falta marca o modelo" }, { status: 400 });
    const { data, error } = await supabaseService.from("pv_machine_models")
      .insert({
        brand_id: brandId,
        machine_type_id: b.machineTypeId || null,
        model_name: modelName.slice(0, 120),
        normalized_model_name: slugify(modelName),
        slug: slugify(modelName),
        engine_cc: b.engineCc != null && b.engineCc !== "" ? Number(b.engineCc) : null,
        status: "current",   // visible (no draft) una vez creado por admin
      })
      .select("id").single();
    if (error) return NextResponse.json({ error: "No se pudo crear el modelo" }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  }

  if (kind === "publish_part") {
    const partId = String(b.partId || "");
    if (!partId) return NextResponse.json({ error: "Falta partId" }, { status: 400 });
    const { error } = await supabaseService.from("pv_technical_parts").update({ status: "published" }).eq("id", partId);
    if (error) return NextResponse.json({ error: "No se pudo publicar" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "kind inválido" }, { status: 400 });
}
