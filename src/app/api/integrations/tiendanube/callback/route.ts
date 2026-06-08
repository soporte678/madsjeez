/**
 * GET /api/integrations/tiendanube/callback?code=...
 *
 * Callback OAuth de Tienda Nube: intercambia el code por access_token + store_id
 * y guarda la conexión cifrada. Luego redirige al dashboard.
 *
 * Requiere TIENDANUBE_APP_ID + TIENDANUBE_CLIENT_SECRET.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";
import { encryptJSON } from "@/lib/integrations/crypto";
import { SITE_URL } from "@/lib/seo/site";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const base = SITE_URL || "https://www.madsjeez.com.ar";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(`${base}/auth/login`);
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${base}/dashboard/importar?tn_error=missing_code`);
  }

  const appId = process.env.TIENDANUBE_APP_ID;
  const clientSecret = process.env.TIENDANUBE_CLIENT_SECRET;
  if (!appId || !clientSecret) {
    return NextResponse.redirect(`${base}/dashboard/importar?tn_error=not_configured`);
  }

  try {
    const tokenRes = await fetch("https://www.tiendanube.com/apps/authorize/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: appId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
      }),
    });
    if (!tokenRes.ok) {
      return NextResponse.redirect(`${base}/dashboard/importar?tn_error=token`);
    }
    const data = (await tokenRes.json()) as {
      access_token?: string;
      user_id?: number | string;
    };
    if (!data.access_token || !data.user_id) {
      return NextResponse.redirect(`${base}/dashboard/importar?tn_error=token_invalid`);
    }

    await supabaseService.from("seller_store_integrations").upsert(
      {
        id: randomUUID(),
        seller_id: session.user.id,
        platform: "tiendanube",
        store_ref: String(data.user_id),
        credentials: encryptJSON({
          storeId: String(data.user_id),
          accessToken: data.access_token,
        }),
        status: "connected",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "seller_id,platform" },
    );

    return NextResponse.redirect(`${base}/dashboard/importar?tn_connected=1`);
  } catch {
    return NextResponse.redirect(`${base}/dashboard/importar?tn_error=server`);
  }
}
