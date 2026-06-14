import type { SupabaseClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { mpOAuthRefreshAdvisoryKey, withSessionAdvisoryBigintLock } from "@/lib/db/pg-advisory-lock";
import { decryptToken, encryptToken } from "@/lib/integrations/crypto";

/** Descifra los tokens de una fila (compat texto plano legacy). Muta la fila. */
function decryptSellerMpRow(row: SellerMpRow | null): SellerMpRow | null {
  if (row) {
    row.mp_access_token = decryptToken(row.mp_access_token);
    row.mp_refresh_token = decryptToken(row.mp_refresh_token);
  }
  return row;
}

/** Renovar antes del vencimiento para evitar 401 en checkout. */
const MP_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/** Serializa refresh OAuth por vendedor: MP invalida el refresh_token al usarlo; dos requests en paralelo rompen el grant. */
const mpSellerOpTail = new Map<string, Promise<unknown>>();

function runSerializedForSellerMp<T>(sellerId: string, task: () => Promise<T>): Promise<T> {
  const prev = mpSellerOpTail.get(sellerId) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(() => task());
  mpSellerOpTail.set(sellerId, next.then(() => undefined, () => undefined));
  return next;
}

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
  /** Tope de cuotas que ve el comprador. NULL = default del seller en MP. */
  installments_max?: number | null;
  /** Array JSON de payment types aceptados. NULL = todos. */
  accepted_payment_types_json?: string[] | null;
};

const MP_SELECT = "seller_id, mp_access_token, mp_refresh_token, mp_token_expires_at, is_active";

export type EnsureSellerMpOk = { ok: true; accessToken: string; refreshed: boolean };
export type EnsureSellerMpErr = { ok: false; code: string; message: string };
export type EnsureSellerMpResult = EnsureSellerMpOk | EnsureSellerMpErr;

async function ensureSellerMpAccessTokenImpl(
  supabase: SupabaseClient,
  sellerId: string,
  opts?: { forceRefresh?: boolean }
): Promise<EnsureSellerMpResult> {
  const { data: live, error: loadErr } = await supabase
    .from("seller_mercadopago")
    .select(MP_SELECT)
    .eq("seller_id", sellerId)
    .eq("is_active", true)
    .maybeSingle();

  if (loadErr) {
    console.error("seller_mercadopago load:", loadErr);
  }

  const row = decryptSellerMpRow((live as SellerMpRow | null) ?? null);
  if (!row?.mp_access_token?.trim()) {
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
    return { ok: true, accessToken: row.mp_access_token, refreshed: false };
  }

  if (!hasRefresh) {
    return {
      ok: false,
      code: "MP_TOKEN_EXPIRED",
      message:
        "El token de Mercado Pago del vendedor expiró. Debe volver a conectar Mercado Pago desde el panel (Perfil).",
    };
  }

  return withSessionAdvisoryBigintLock(prisma, mpOAuthRefreshAdvisoryKey(sellerId), async () => {
    const { data: live2, error: loadErr2 } = await supabase
      .from("seller_mercadopago")
      .select(MP_SELECT)
      .eq("seller_id", sellerId)
      .eq("is_active", true)
      .maybeSingle();

    if (loadErr2) {
      console.error("seller_mercadopago load (locked):", loadErr2);
    }

    const row2 = decryptSellerMpRow((live2 as SellerMpRow | null) ?? null);
    if (!row2?.mp_access_token?.trim()) {
      return {
        ok: false,
        code: "SELLER_MP_NOT_CONNECTED",
        message: "El vendedor no tiene Mercado Pago conectado.",
      };
    }

    const hasRef2 = Boolean(row2.mp_refresh_token?.trim());
    const needs2 =
      Boolean(opts?.forceRefresh) ||
      (mpSellerAccessTokenNeedsRefresh(row2.mp_token_expires_at) && hasRef2);

    if (!needs2) {
      if (mpSellerAccessTokenNeedsRefresh(row2.mp_token_expires_at) && !hasRef2) {
        return {
          ok: false,
          code: "MP_TOKEN_EXPIRED",
          message:
            "El token de Mercado Pago del vendedor expiró. Debe volver a conectar Mercado Pago desde el panel (Perfil).",
        };
      }
      return { ok: true, accessToken: row2.mp_access_token, refreshed: false };
    }

    if (!hasRef2) {
      return {
        ok: false,
        code: "MP_TOKEN_EXPIRED",
        message:
          "El token de Mercado Pago del vendedor expiró. Debe volver a conectar Mercado Pago desde el panel (Perfil).",
      };
    }

    try {
      const refreshTok = row2.mp_refresh_token!.trim();
      const t = await exchangeMercadoPagoRefreshToken(refreshTok);
      const expiresAt =
        t.expires_in != null && Number.isFinite(t.expires_in)
          ? new Date(Date.now() + Math.max(60, t.expires_in) * 1000).toISOString()
          : null;
      const nextRefresh = (t.refresh_token ?? row2.mp_refresh_token)?.trim() || null;

      const { error: upErr } = await supabase
        .from("seller_mercadopago")
        .update({
          mp_access_token: encryptToken(t.access_token),
          mp_refresh_token: encryptToken(nextRefresh),
          mp_token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("seller_id", row2.seller_id);

      if (upErr) {
        console.error("seller_mercadopago token refresh persist (CRITICAL):", upErr);
        return {
          ok: false,
          code: "MP_TOKEN_PERSIST_FAILED",
          message:
            "No se pudieron guardar los nuevos tokens de Mercado Pago en base de datos. Revisá permisos RLS o la tabla seller_mercadopago. El vendedor debe reconectar MP.",
        };
      }

      return { ok: true, accessToken: t.access_token, refreshed: true };
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Error al renovar token de Mercado Pago";
      console.error("Mercado Pago refresh_token:", e);
      const lower = raw.toLowerCase();
      if (lower.includes("already used") || lower.includes("invalid_grant")) {
        return {
          ok: false,
          code: "MP_REFRESH_REVOKED",
          message:
            "El enlace con Mercado Pago del vendedor ya no es válido (refresh usado o revocado). Debe volver a conectar Mercado Pago desde el panel (Perfil).",
        };
      }
      return {
        ok: false,
        code: "MP_TOKEN_REFRESH_FAILED",
        message: `${raw}. El vendedor puede reconectar Mercado Pago desde el panel.`,
      };
    }
  });
}

/**
 * Devuelve un access_token válido para la API de MP, renovando con refresh_token si hace falta
 * y persistiendo en `seller_mercadopago`. Cola in-process por vendedor + bloqueo advisory en Postgres
 * para que dos instancias (réplicas) no canjeen el mismo refresh_token a la vez.
 */
export async function ensureSellerMpAccessToken(
  supabase: SupabaseClient,
  row: SellerMpRow,
  opts?: { forceRefresh?: boolean }
): Promise<EnsureSellerMpResult> {
  const sellerId = row.seller_id?.trim();
  if (!sellerId) {
    return { ok: false, code: "SELLER_MP_NOT_CONNECTED", message: "seller_id inválido." };
  }
  return runSerializedForSellerMp(sellerId, () => ensureSellerMpAccessTokenImpl(supabase, sellerId, opts));
}
