import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureSellerMpAccessToken, type SellerMpRow } from "@/lib/mercadopago/seller-access-token";

export const MP_CHECKOUT_PREFERENCES_URL = "https://api.mercadopago.com/checkout/preferences";

/** Texto legible a partir del JSON de error de la API de Mercado Pago. */
export function summarizeMercadoPagoApiError(body: unknown): string {
  if (body == null || typeof body !== "object") return "";
  const o = body as Record<string, unknown>;
  if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
  if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
  if (Array.isArray(o.cause)) {
    const parts: string[] = [];
    for (const c of o.cause) {
      if (c && typeof c === "object") {
        const rec = c as { description?: string; code?: string };
        if (rec.description) parts.push(String(rec.description));
        else if (rec.code) parts.push(String(rec.code));
      }
    }
    if (parts.length) return parts.join("; ");
  }
  return "";
}

function mpResponseSuggestsInvalidSellerToken(httpStatus: number, body: unknown): boolean {
  if (httpStatus === 401 || httpStatus === 403) return true;
  const s = summarizeMercadoPagoApiError(body).toLowerCase();
  if (!s) return false;
  return /invalid[_ ]?access|invalid[_ ]?token|expired|unauthorized|forbidden|revoked|bad[_ ]?credentials/i.test(s);
}

export type MpPreferenceOk = { ok: true; data: Record<string, unknown> };
export type MpPreferenceErr = {
  ok: false;
  httpStatus: number;
  body: unknown;
  summarizedMessage: string;
};

/**
 * Crea una preferencia Checkout Pro con el Bearer del vendedor.
 * Si MP indica token inválido/expirado, intenta un refresh OAuth y repite una vez.
 */
export async function createCheckoutProPreferenceWithSellerTokenRetry(params: {
  supabase: SupabaseClient;
  mpRow: SellerMpRow;
  mpSelect: string;
  preference: Record<string, unknown>;
}): Promise<MpPreferenceOk | MpPreferenceErr> {
  const first = await ensureSellerMpAccessToken(params.supabase, params.mpRow);
  if (!first.ok) {
    const httpStatus =
      first.code === "MP_TOKEN_REFRESH_FAILED" ||
      first.code === "MP_TOKEN_PERSIST_FAILED" ||
      first.code === "MP_REFRESH_REVOKED"
        ? 502
        : 400;
    return {
      ok: false,
      httpStatus,
      body: { code: first.code, message: first.message },
      summarizedMessage: first.message,
    };
  }

  let accessToken = first.accessToken;
  const didProactiveRefresh = first.refreshed;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = await fetch(MP_CHECKOUT_PREFERENCES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params.preference),
    });

    const raw = await res.text();
    let parsed: unknown = {};
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      parsed = { parse_error: true, snippet: raw.slice(0, 400) };
    }

    if (res.ok && parsed && typeof parsed === "object") {
      return { ok: true, data: parsed as Record<string, unknown> };
    }

    const badToken = mpResponseSuggestsInvalidSellerToken(res.status, parsed);
    if (attempt === 0 && badToken && !didProactiveRefresh) {
      const { data: freshRow } = await params.supabase
        .from("seller_mercadopago")
        .select(params.mpSelect)
        .eq("seller_id", params.mpRow.seller_id)
        .eq("is_active", true)
        .maybeSingle();
      const fresh = freshRow as SellerMpRow | null;
      if (fresh?.mp_refresh_token?.trim()) {
        const forced = await ensureSellerMpAccessToken(params.supabase, fresh, { forceRefresh: true });
        if (forced.ok) {
          accessToken = forced.accessToken;
          continue;
        }
      }
    }

    return {
      ok: false,
      httpStatus: res.status,
      body: parsed,
      summarizedMessage:
        summarizeMercadoPagoApiError(parsed) || `Mercado Pago respondió HTTP ${res.status}`,
    };
  }

  return {
    ok: false,
    httpStatus: 502,
    body: { message: "preference_retry_exhausted" },
    summarizedMessage: "No se pudo crear la preferencia de pago tras reintentar.",
  };
}
