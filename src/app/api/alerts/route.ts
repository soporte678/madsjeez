/**
 * /api/alerts — alertas de producto (baja de precio / vuelve stock).
 *   GET                                   → alertas activas del usuario.
 *   POST { productId, kind, targetPrice } → crear.
 *   DELETE ?id=                           → eliminar.
 *
 * kind: 'price_drop' (avisar cuando baje de targetPrice) | 'back_in_stock'.
 * La entrega de la notificación la hace un job aparte (Wave B.2): compara
 * last_price/stock actual vs alerta y dispara push/email. Acá solo persistimos.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const KINDS = ["price_drop", "back_in_stock"] as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data, error } = await supabaseService
    .from("product_alerts")
    .select("id, product_id, kind, target_price, last_price, active, created_at")
    .eq("user_id", session.user.id)
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Error" }, { status: 500 });
  return NextResponse.json({ alerts: data ?? [] });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const productId = String(b.productId || "");
  const kind = String(b.kind || "");
  if (!productId) return NextResponse.json({ error: "Falta productId" }, { status: 400 });
  if (!KINDS.includes(kind as (typeof KINDS)[number])) {
    return NextResponse.json({ error: "kind inválido" }, { status: 400 });
  }

  // Snapshot del precio actual (para comparar luego)
  const { data: prod } = await supabaseService
    .from("products")
    .select("price")
    .eq("id", productId)
    .maybeSingle();
  if (!prod) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  const targetPrice =
    kind === "price_drop" && b.targetPrice != null ? Number(b.targetPrice) : null;

  const { error } = await supabaseService.from("product_alerts").upsert(
    {
      user_id: session.user.id,
      product_id: productId,
      kind,
      target_price: targetPrice,
      last_price: prod.price,
      active: true,
      notified_at: null,
    },
    { onConflict: "user_id,product_id,kind" },
  );
  if (error) return NextResponse.json({ error: "No se pudo crear la alerta" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const { error } = await supabaseService
    .from("product_alerts")
    .delete()
    .eq("user_id", session.user.id)
    .eq("id", id);
  if (error) return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
