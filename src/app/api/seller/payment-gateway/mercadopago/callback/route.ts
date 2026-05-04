import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface MercadoPagoTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope: string;
  user_id?: number;
}

interface MercadoPagoUserInfo {
  id: number;
  email: string;
  nickname?: string;
}

/**
 * GET /api/seller/payment-gateway/mercadopago/callback
 * 
 * Callback de OAuth de MercadoPago. Intercambia el código por tokens y guarda en DB.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Redirigir al dashboard con error si el usuario canceló
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar"}/dashboard?mp_error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar"}/dashboard?mp_error=missing_params`
      );
    }

    // Decodificar el estado para obtener el user_id
    const sellerId = Buffer.from(state, "base64").toString("utf-8");

    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
    const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Variables de MercadoPago no configuradas");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar"}/dashboard?mp_error=config_error`
      );
    }

    // Intercambiar código por tokens
    const tokenResponse = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Error obteniendo tokens de MercadoPago:", errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar"}/dashboard?mp_error=token_error`
      );
    }

    const tokenData: MercadoPagoTokenResponse = await tokenResponse.json();

    // Obtener información del usuario de MercadoPago
    const userInfoResponse = await fetch("https://api.mercadopago.com/users/me", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
      },
    });

    let userInfo: MercadoPagoUserInfo | null = null;
    if (userInfoResponse.ok) {
      userInfo = await userInfoResponse.json();
    }

    // Guardar en la base de datos
    const supabase = await createClient();

    // Calcular fecha de expiración
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const { error: dbError } = await supabase
      .from("seller_mercadopago")
      .upsert({
        seller_id: sellerId,
        mp_access_token: tokenData.access_token,
        mp_refresh_token: tokenData.refresh_token || null,
        mp_token_expires_at: expiresAt,
        mp_user_id: userInfo?.id?.toString() || null,
        mp_email: userInfo?.email || null,
        mp_nickname: userInfo?.nickname || null,
        is_connected: true,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "seller_id"
      });

    if (dbError) {
      console.error("Error guardando credenciales:", dbError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar"}/dashboard?mp_error=db_error`
      );
    }

    // Redirigir al dashboard con éxito
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar"}/dashboard?mp_success=connected`
    );

  } catch (error) {
    console.error("Error en callback de MercadoPago:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar"}/dashboard?mp_error=server_error`
    );
  }
}
