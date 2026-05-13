import type { SupabaseClient } from "@supabase/supabase-js";

/** Renovar antes del vencimiento para evitar 401 en checkout. */
const MP_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

export function mpSellerAccessTokenNeedsRefresh(expiresAtIso: string | null | undefined): boolean {
  if (expiresAtIso == null || expiresAtIso === "") return true;
  const t = new Date(expiresAtIso).getTime();
  if (!Number.isFinite(t)) return true;
  return t < Date.now() + MP_EXPIRY_BUFFER_MS;
}

type MpOAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

export async function exchangeMercadoPagoRefreshToken(refreshToken: string): Promise<MpOAuthTokenResponse> {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID?.trim();
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("MERCADOPAGO_CLIENT_ID o MERCADOPAGO_CLIENT_SECRET no configurados");
  }

  const res = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const access_token = data.access_token;
  if (typeof access_token !== "string" || !access_token) {
    throw new Error("Respuesta OAuth inválida (sin access_token)");
  }

  return {
    access_token,
    refresh_token: typeof data.refresh_token === "string" ? data.refresh_token : undefined,
    expires_in: typeof data.expires_in === "number" ? data.expires_in : undefined,
  };
}

export type SellerMpRow = {
  seller_id: string;
  mp_access_token: string | null;
  mp_refresh_token: string | null;
  mp_token_expires_at: string | null;
};

/**
 * Devuelve un access_token válido para la API de MP, renovando con refresh_token si hace falta
 * y persistiendo en `seller_mercadopago`.
 */
export async function ensureSellerMpAccessToken(
  supabase: SupabaseClient,
  row: SellerMpRow,
  opts?: { forceRefresh?: boolean }
): Promise<{ ok: true; accessToken: string } | { ok: false; code: string; message: string }> {
  if (!row.mp_access_token?.trim()) {
    return {
      ok: false,
      code: "SELLER_MP_NOT_CONNECTED",
      message: "El vendedor no tiene Mercado Pago conectado.",
    };
  }

  const hasRefresh = Boolean(row.mp_refresh_token?.trim());
  const needsRefresh =
    Boolean(opts?.forceRefresh) ||
    (mpSellerAccessTokenNeedsRefresh(row.mp_token_expires_at) && hasRefresh);

  if (!needsRefresh) {
    if (mpSellerAccessTokenNeedsRefresh(row.mp_token_expires_at) && !hasRefresh) {
      return {
        ok: false,
        code: "MP_TOKEN_EXPIRED",
        message:
          "El token de Mercado Pago del vendedor expiró. Debe volver a conectar Mercado Pago desde el panel (Perfil).",
      };
    }
    return { ok: true, accessToken: row.mp_access_token };
  }

  if (!hasRefresh) {
    return {
      ok: false,
      code: "MP_TOKEN_EXPIRED",
      message:
        "El token de Mercado Pago del vendedor expiró. Debe volver a conectar Mercado Pago desde el panel (Perfil).",
    };
  }

  try {
    const t = await exchangeMercadoPagoRefreshToken(row.mp_refresh_token!.trim());
    const expiresAt =
      t.expires_in != null && Number.isFinite(t.expires_in)
        ? new Date(Date.now() + Math.max(60, t.expires_in) * 1000).toISOString()
        : null;
    const nextRefresh = (t.refresh_token ?? row.mp_refresh_token)?.trim() || null;

    const { error: upErr } = await supabase
      .from("seller_mercadopago")
      .update({
        mp_access_token: t.access_token,
        mp_refresh_token: nextRefresh,
        mp_token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("seller_id", row.seller_id);

    if (upErr) {
      console.error("seller_mercadopago token refresh persist:", upErr);
    }

    return { ok: true, accessToken: t.access_token };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al renovar token de Mercado Pago";
    console.error("Mercado Pago refresh_token:", e);
    return {
      ok: false,
      code: "MP_TOKEN_REFRESH_FAILED",
      message: `${msg}. El vendedor puede reconectar Mercado Pago desde el panel.`,
    };
  }
}
