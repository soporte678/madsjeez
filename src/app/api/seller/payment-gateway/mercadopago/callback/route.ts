import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { verifyMpOAuthState } from "@/lib/mp-oauth-state";

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

function appBase(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * GET /api/seller/payment-gateway/mercadopago/callback
 *
 * Callback OAuth MercadoPago: valida `state` firmado y anti-replay de nonce.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${appBase()}/dashboard?mp_error=${encodeURIComponent(error)}#perfil`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${appBase()}/dashboard?mp_error=missing_params#perfil`
      );
    }

    const stateSecret = process.env.MP_OAUTH_STATE_SECRET;
    if (!stateSecret || stateSecret.length < 16) {
      return NextResponse.redirect(
        `${appBase()}/dashboard?mp_error=oauth_config#perfil`
      );
    }

    const payload = verifyMpOAuthState(state, stateSecret);
    if (!payload) {
      return NextResponse.redirect(
        `${appBase()}/dashboard?mp_error=invalid_state#perfil`
      );
    }

    const { error: nonceErr } = await supabaseService
      .from("mp_oauth_used_nonces")
      .insert({ nonce: payload.nonce });

    if (nonceErr) {
      console.warn("MP OAuth nonce replay or DB error:", nonceErr);
      return NextResponse.redirect(
        `${appBase()}/dashboard?mp_error=replay#perfil`
      );
    }

    const sellerId = payload.sellerUserId;

    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
    const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Variables de MercadoPago no configuradas");
      return NextResponse.redirect(
        `${appBase()}/dashboard?mp_error=config_error#perfil`
      );
    }

    const tokenResponse = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
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
        `${appBase()}/dashboard?mp_error=token_error#perfil`
      );
    }

    const tokenData: MercadoPagoTokenResponse = await tokenResponse.json();

    const userInfoResponse = await fetch("https://api.mercadopago.com/users/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    let userInfo: MercadoPagoUserInfo | null = null;
    if (userInfoResponse.ok) {
      userInfo = await userInfoResponse.json();
    }

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const { error: dbError } = await supabaseService.from("seller_mercadopago").upsert(
      {
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
      },
      {
        onConflict: "seller_id",
      }
    );

    if (dbError) {
      console.error("Error guardando credenciales:", dbError);
      return NextResponse.redirect(
        `${appBase()}/dashboard?mp_error=db_error#perfil`
      );
    }

    return NextResponse.redirect(
      `${appBase()}/dashboard?mp_success=connected#perfil`
    );
  } catch (error) {
    console.error("Error en callback de MercadoPago:", error);
    return NextResponse.redirect(
      `${appBase()}/dashboard?mp_error=server_error#perfil`
    );
  }
}
