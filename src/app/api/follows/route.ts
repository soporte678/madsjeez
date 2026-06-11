/**
 * /api/follows — seguir / dejar de seguir tiendas (vendedores).
 *   GET                → lista de tiendas que sigue el usuario (con datos públicos).
 *   POST { sellerId }  → seguir.
 *   DELETE ?sellerId=  → dejar de seguir.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: follows, error } = await supabaseService
    .from("store_follows")
    .select("seller_id, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Error" }, { status: 500 });

  const ids = (follows ?? []).map((f) => f.seller_id);
  let stores: Record<string, unknown>[] = [];
  if (ids.length) {
    const { data: sellers } = await supabaseService
      .from("users")
      .select('id, name, "sellerName", store_slug, image, reputation_color')
      .in("id", ids);
    // conteo de productos activos por seller
    const { data: counts } = await supabaseService
      .from("products")
      .select("seller_id")
      .in("seller_id", ids)
      .eq("is_active", true)
      .gt("stock", 0);
    const countMap = new Map<string, number>();
    for (const c of counts ?? []) countMap.set(c.seller_id, (countMap.get(c.seller_id) ?? 0) + 1);
    stores = (sellers ?? []).map((s) => ({
      id: s.id,
      name: s.sellerName || s.name,
      storeSlug: s.store_slug,
      image: s.image,
      reputation: s.reputation_color,
      productCount: countMap.get(s.id) ?? 0,
    }));
  }
  return NextResponse.json({ follows: stores });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let sellerId: string;
  try {
    ({ sellerId } = await req.json());
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!sellerId || sellerId === session.user.id) {
    return NextResponse.json({ error: "sellerId inválido" }, { status: 400 });
  }

  const { error } = await supabaseService
    .from("store_follows")
    .upsert({ user_id: session.user.id, seller_id: sellerId }, { onConflict: "user_id,seller_id" });
  if (error) return NextResponse.json({ error: "No se pudo seguir" }, { status: 500 });
  return NextResponse.json({ ok: true, following: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const sellerId = new URL(req.url).searchParams.get("sellerId");
  if (!sellerId) return NextResponse.json({ error: "Falta sellerId" }, { status: 400 });

  const { error } = await supabaseService
    .from("store_follows")
    .delete()
    .eq("user_id", session.user.id)
    .eq("seller_id", sellerId);
  if (error) return NextResponse.json({ error: "No se pudo dejar de seguir" }, { status: 500 });
  return NextResponse.json({ ok: true, following: false });
}
