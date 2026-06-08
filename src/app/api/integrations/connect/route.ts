/**
 * POST /api/integrations/connect
 *
 * Guarda (cifradas) las credenciales de una tienda externa para conexión
 * directa. Valida la conexión haciendo un fetch real antes de persistir.
 *
 * Body: { platform, credentials: {...}, storeLabel? }
 *   - woocommerce: { storeUrl, consumerKey, consumerSecret }
 *   - shopify:     { storeDomain, adminToken }
 *   - tiendanube:  { storeId, accessToken }   (normalmente via OAuth callback)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";
import { encryptJSON } from "@/lib/integrations/crypto";
import {
  fetchProductsFromStore,
  type ConnectorPlatform,
  type StoreCredentials,
} from "@/lib/integrations/connectors";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VALID: ConnectorPlatform[] = ["woocommerce", "shopify", "tiendanube"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.isSeller) {
    return NextResponse.json({ error: "Solo vendedores" }, { status: 403 });
  }

  let body: { platform?: string; credentials?: StoreCredentials; storeLabel?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const platform = body.platform as ConnectorPlatform;
  if (!platform || !VALID.includes(platform)) {
    return NextResponse.json({ error: "Plataforma inválida" }, { status: 400 });
  }
  const creds = body.credentials || {};

  // Validar credenciales haciendo un fetch real (1 página)
  let sampleCount = 0;
  try {
    const sample = await fetchProductsFromStore(platform, creds);
    sampleCount = sample.length;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo conectar";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const storeRef =
    creds.storeDomain || creds.storeUrl || creds.storeId || null;

  const { error } = await supabaseService.from("seller_store_integrations").upsert(
    {
      id: randomUUID(),
      seller_id: session.user.id,
      platform,
      store_label: body.storeLabel || null,
      store_ref: storeRef,
      credentials: encryptJSON(creds),
      status: "connected",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "seller_id,platform" },
  );

  if (error) {
    console.error("integrations/connect:", error);
    return NextResponse.json({ error: "No se pudo guardar la conexión" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, platform, productsFound: sampleCount });
}
