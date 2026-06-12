/**
 * /api/seller/partsvision/links — el vendedor vincula su producto a una pieza técnica.
 *   GET  ?productId=  → vínculos actuales del producto (del vendedor).
 *   POST { productId, partId, claim }  → crea vínculo (queda pending de revisión).
 *   DELETE ?id=       → elimina un vínculo propio.
 *
 * claim: original | alternative | used | seller_claimed.
 * Gateado por feature flag partsvision_seller_fitments_enabled.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";
import { isFeatureEnabled } from "@/lib/partsvision/feature-flags";

export const dynamic = "force-dynamic";

const CLAIMS = ["original", "alternative", "used", "seller_claimed"];

async function ownsProduct(sellerId: string, productId: string): Promise<boolean> {
  const { data } = await supabaseService.from("products").select("seller_id").eq("id", productId).maybeSingle();
  return data?.seller_id === sellerId;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "Falta productId" }, { status: 400 });

  const { data, error } = await supabaseService
    .from("pv_product_part_links")
    .select("id, part_id, compatibility_claim, link_status, part:part_id(canonical_name)")
    .eq("product_id", productId)
    .eq("seller_id", session.user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Error" }, { status: 500 });
  return NextResponse.json({ links: data ?? [] });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!session.user.isSeller) return NextResponse.json({ error: "Solo vendedores" }, { status: 403 });
  if (!(await isFeatureEnabled("partsvision_seller_fitments_enabled"))) {
    return NextResponse.json({ error: "Función no disponible aún" }, { status: 403 });
  }

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const productId = String(b.productId || "");
  const partId = String(b.partId || "");
  const claim = CLAIMS.includes(String(b.claim)) ? String(b.claim) : "seller_claimed";
  if (!productId || !partId) return NextResponse.json({ error: "Faltan productId y partId" }, { status: 400 });
  if (!(await ownsProduct(session.user.id, productId))) {
    return NextResponse.json({ error: "El producto no es tuyo" }, { status: 403 });
  }

  const { error } = await supabaseService.from("pv_product_part_links").upsert(
    {
      product_id: productId,
      part_id: partId,
      seller_id: session.user.id,
      compatibility_claim: claim,
      link_status: "pending",       // requiere revisión admin
      verification_status: "pending",
    },
    { onConflict: "product_id,part_id" },
  );
  if (error) return NextResponse.json({ error: "No se pudo vincular" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const { error } = await supabaseService
    .from("pv_product_part_links")
    .delete()
    .eq("id", id)
    .eq("seller_id", session.user.id);
  if (error) return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
