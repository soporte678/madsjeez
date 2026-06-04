/**
 * Token cache + auto-refresh para la cuenta marketplace owner (Madsjeez).
 *
 * Problema: MERCADOPAGO_ACCESS_TOKEN seteado a mano en Railway caduca
 * cuando se revoca o cuando se generó vía OAuth client_credentials
 * (6h de vida). Cuando expira, el cobro de suscripciones se rompe sin aviso.
 *
 * Solución: usamos client_id + client_secret (estos NO caducan) para
 * pedir tokens nuevos a MP en cada expiración. Cacheamos en memoria por
 * 5h (margen de seguridad sobre los 6h de TTL real).
 *
 * Si el ENV `MERCADOPAGO_ACCESS_TOKEN` está seteado, lo usamos primero
 * (caso "panel token long-lived"). Si falla con 401, hacemos refresh
 * automático via client_credentials.
 */

type CachedToken = {
  accessToken: string;
  expiresAt: number; // epoch ms
};

let cache: CachedToken | null = null;

const TOKEN_URL = "https://api.mercadopago.com/oauth/token";
const SAFETY_MARGIN_MS = 60 * 60 * 1000; // refrescar 1h antes de caducar

async function fetchFreshToken(): Promise<CachedToken> {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "MP client_id/client_secret faltantes — no podemos refrescar token",
    );
  }
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`MP token refresh falló (${res.status}): ${txt}`);
  }
  const j = (await res.json()) as { access_token: string; expires_in: number };
  return {
    accessToken: j.access_token,
    expiresAt: Date.now() + j.expires_in * 1000,
  };
}

/**
 * Devuelve el access token del marketplace. Self-healing: si el de env
 * está caducado/revocado, regenera vía OAuth client_credentials.
 *
 * `force=true` ignora cache y env var; pide uno fresco. Usar en webhook
 * branches que vieron 401 / invalid_token.
 */
export async function getMarketplaceAccessToken(opts?: {
  force?: boolean;
}): Promise<string> {
  const force = opts?.force === true;

  // 1) Cache válido (todavía no expirado)
  if (!force && cache && Date.now() < cache.expiresAt - SAFETY_MARGIN_MS) {
    return cache.accessToken;
  }

  // 2) Env var seteado (panel token long-lived). Lo usamos en cold start
  //    o si no hay cache. Si MP devuelve 401, el caller debería llamar
  //    con force=true.
  if (!force && cache == null) {
    const env = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (env && env.startsWith("APP_USR-")) {
      // Asumimos vida útil corta (6h) por seguridad — si es panel-generated
      // y dura más, igual el cache lo va a refrescar antes y todo sigue OK.
      cache = {
        accessToken: env,
        expiresAt: Date.now() + 6 * 60 * 60 * 1000,
      };
      return cache.accessToken;
    }
  }

  // 3) Refresh via OAuth client_credentials
  cache = await fetchFreshToken();
  return cache.accessToken;
}

/** Invalida el cache. Llamar tras recibir 401 desde MP. */
export function invalidateMarketplaceAccessToken(): void {
  cache = null;
}
