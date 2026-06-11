/**
 * /api/seller/compatibility — el vendedor declara para qué máquinas sirve un producto.
 *   GET  ?productId=  → compatibilidades del producto (del vendedor).
 *   POST { productId, machineType, brand, model, displacementCc, sourceDetail }
 *        → crea la máquina (si no existe) + el vínculo status='declared'.
 *   DELETE ?id=       → elimina un vínculo propio.
 *
 * El admin luego confirma (status='confirmed'). Nada se publica como
 * "confirmado" sin revisión; el vendedor solo declara.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[áàäâ]/g, "a").replace(/[éèëê]/g, "e").replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o").replace(/[úùüû]/g, "u").replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function ownsProduct(sellerId: string, productId: string): Promise<boolean> {
  const { data } = await supabaseService
    .from("products")
    .select("seller_id")
    .eq("id", productId)
    .maybeSingle();
  return data?.seller_id === sellerId;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "Falta productId" }, { status: 400 });

  const { data, error } = await supabaseService
    .from("compatibility_links")
    .select("id, status, source, source_detail, machine:machine_id(machine_type, brand, model, displacement_cc)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Error" }, { status: 500 });
  return NextResponse.json({ links: data ?? [] });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!session.user.isSeller) return NextResponse.json({ error: "Solo vendedores" }, { status: 403 });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const productId = String(b.productId || "");
  const machineType = String(b.machineType || "").trim();
  if (!productId || !machineType) {
    return NextResponse.json({ error: "Faltan productId y tipo de máquina" }, { status: 400 });
  }
  if (!(await ownsProduct(session.user.id, productId))) {
    return NextResponse.json({ error: "El producto no es tuyo" }, { status: 403 });
  }

  const brand = b.brand ? String(b.brand).trim() : null;
  const model = b.model ? String(b.model).trim() : null;
  const cc = b.displacementCc != null && b.displacementCc !== "" ? Math.round(Number(b.displacementCc)) : null;
  const slug = slugify([machineType, brand, model, cc ? `${cc}cc` : ""].filter(Boolean).join("-"));

  // máquina (upsert por slug)
  const { data: machine, error: e1 } = await supabaseService
    .from("compatibility_machines")
    .upsert(
      { machine_type: machineType, brand, model, displacement_cc: cc, slug },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (e1 || !machine) return NextResponse.json({ error: "No se pudo registrar la máquina" }, { status: 500 });

  // vínculo declarado
  const { error: e2 } = await supabaseService.from("compatibility_links").upsert(
    {
      product_id: productId,
      machine_id: machine.id,
      status: "declared",
      source: "seller",
      source_detail: b.sourceDetail ? String(b.sourceDetail).slice(0, 300) : null,
      created_by: session.user.id,
    },
    { onConflict: "product_id,machine_id" },
  );
  if (e2) return NextResponse.json({ error: "No se pudo guardar la compatibilidad" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  // Solo puede borrar vínculos que creó él
  const { error } = await supabaseService
    .from("compatibility_links")
    .delete()
    .eq("id", id)
    .eq("created_by", session.user.id);
  if (error) return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
