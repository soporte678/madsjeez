/**
 * POST /api/integrations/sync
 *
 * Trae los productos de la tienda conectada (vía API) y los importa al
 * catálogo del seller. Reutiliza la misma lógica que el importador por CSV.
 *
 * Body: { platform }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";
import { decryptJSON } from "@/lib/integrations/crypto";
import {
  fetchProductsFromStore,
  type ConnectorPlatform,
  type StoreCredentials,
} from "@/lib/integrations/connectors";
import { importNormalizedRows } from "@/lib/import/import-rows";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.isSeller) {
    return NextResponse.json({ error: "Solo vendedores" }, { status: 403 });
  }

  let platform: ConnectorPlatform;
  try {
    const body = await req.json();
    platform = body.platform;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { data: row, error } = await supabaseService
    .from("seller_store_integrations")
    .select("credentials, platform")
    .eq("seller_id", session.user.id)
    .eq("platform", platform)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "No tenés esa tienda conectada" }, { status: 404 });
  }

  const creds = decryptJSON<StoreCredentials>(row.credentials);
  if (!creds) {
    return NextResponse.json({ error: "Credenciales corruptas, reconectá la tienda" }, { status: 422 });
  }

  let rows;
  try {
    rows = await fetchProductsFromStore(platform, creds);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al traer productos";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const summary = await importNormalizedRows(session.user.id, rows);

  await supabaseService
    .from("seller_store_integrations")
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_count: summary.imported,
      status: "connected",
    })
    .eq("seller_id", session.user.id)
    .eq("platform", platform);

  return NextResponse.json({ ok: true, fetched: rows.length, ...summary });
}
