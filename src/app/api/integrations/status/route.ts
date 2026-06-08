/**
 * GET /api/integrations/status
 * Lista las tiendas conectadas del seller (sin exponer credenciales).
 *
 * DELETE /api/integrations/status?platform=woocommerce
 * Desconecta una tienda.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabaseService
    .from("seller_store_integrations")
    .select("platform, store_label, store_ref, status, last_sync_at, last_sync_count, created_at")
    .eq("seller_id", session.user.id);

  if (error) {
    return NextResponse.json({ error: "Error consultando conexiones" }, { status: 500 });
  }

  return NextResponse.json({ connections: data || [] });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  if (!platform) {
    return NextResponse.json({ error: "Falta platform" }, { status: 400 });
  }

  const { error } = await supabaseService
    .from("seller_store_integrations")
    .delete()
    .eq("seller_id", session.user.id)
    .eq("platform", platform);

  if (error) {
    return NextResponse.json({ error: "No se pudo desconectar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
