/**
 * Cliente PayPal REST API con token cache + auto-refresh.
 *
 * PayPal usa OAuth2 client_credentials para apps de partners.
 * El access token vive 9 horas (32400s). Lo cacheamos en memoria y
 * regeneramos cuando faltan menos de 5min para expirar.
 *
 * ENV requeridas:
 *  PAYPAL_CLIENT_ID
 *  PAYPAL_CLIENT_SECRET
 *  PAYPAL_MODE              = "live" | "sandbox" (default "sandbox")
 *  PAYPAL_WEBHOOK_ID         = ID del webhook configurado en developer panel
 */

const SANDBOX_BASE = "https://api-m.sandbox.paypal.com";
const LIVE_BASE = "https://api-m.paypal.com";

export function paypalBaseUrl(): string {
  const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();
  return mode === "live" ? LIVE_BASE : SANDBOX_BASE;
}

export function paypalClientCreds(): { id: string; secret: string } {
  const id = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!id || !secret) {
    throw new Error("PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET requeridos");
  }
  return { id, secret };
}

let cache: { token: string; expiresAt: number } | null = null;
const SAFETY_MARGIN_MS = 5 * 60 * 1000;

export async function getPaypalAccessToken(opts?: { force?: boolean }): Promise<string> {
  if (!opts?.force && cache && Date.now() < cache.expiresAt - SAFETY_MARGIN_MS) {
    return cache.token;
  }
  const { id, secret } = paypalClientCreds();
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");

  const res = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`PayPal OAuth falló (${res.status}): ${txt}`);
  }
  const j = (await res.json()) as { access_token: string; expires_in: number };
  cache = {
    token: j.access_token,
    expiresAt: Date.now() + j.expires_in * 1000,
  };
  return cache.token;
}

export function invalidatePaypalAccessToken(): void {
  cache = null;
}

/** Fetch authenticado contra la API de PayPal con auto-refresh en 401. */
export async function paypalFetch(
  path: string,
  init: RequestInit & { retry?: boolean } = {},
): Promise<Response> {
  const token = await getPaypalAccessToken();
  const url = path.startsWith("http") ? path : `${paypalBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401 && !init.retry) {
    invalidatePaypalAccessToken();
    return paypalFetch(path, { ...init, retry: true });
  }
  return res;
}
