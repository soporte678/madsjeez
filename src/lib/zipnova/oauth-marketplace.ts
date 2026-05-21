/**
 * OAuth2 Zipnova para marketplaces (múltiples cuentas de vendedores).
 * @see https://docs.zipnova.com/envios/principios/autorizacion-con-oauth.md
 * @see https://docs.zipnova.com/envios/principios/urls-y-autenticacion.md
 */

const DEFAULT_SCOPES = [
  "shipments.quote",
  "shipments.create",
  "shipments.show",
  "orders.create",
  "orders.view",
  "accounts.show",
].join(" ");

function getOAuthBaseUrl(): string {
  const raw =
    process.env.ZIPNOVA_OAUTH_BASE_URL ||
    process.env.ZIPNOVA_API_BASE_URL?.replace(/\/v2\/?$/i, "") ||
    "https://api.zipnova.com.ar";
  return raw.replace(/\/$/, "");
}

export function getZipnovaMarketplaceOAuthConfig(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  oauthBase: string;
} | null {
  const clientId = process.env.ZIPNOVA_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.ZIPNOVA_OAUTH_CLIENT_SECRET?.trim();
  const redirectUri = process.env.ZIPNOVA_OAUTH_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri, oauthBase: getOAuthBaseUrl() };
}

export function buildZipnovaAuthorizeUrl(params: {
  state: string;
  scope?: string;
}): string | null {
  const cfg = getZipnovaMarketplaceOAuthConfig();
  if (!cfg) return null;
  const u = new URL(`${cfg.oauthBase}/oauth/authorize`);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", cfg.clientId);
  u.searchParams.set("redirect_uri", cfg.redirectUri);
  u.searchParams.set("scope", params.scope ?? DEFAULT_SCOPES);
  u.searchParams.set("state", params.state);
  return u.toString();
}

export type ZipnovaTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

export async function exchangeZipnovaAuthorizationCode(code: string): Promise<ZipnovaTokenResponse> {
  const cfg = getZipnovaMarketplaceOAuthConfig();
  if (!cfg) {
    throw new Error("ZIPNOVA_OAUTH_* no configurado");
  }
  const res = await fetch(`${cfg.oauthBase}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof json.error_description === "string"
        ? json.error_description
        : typeof json.message === "string"
          ? json.message
          : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const access_token = json.access_token as string | undefined;
  const expires_in = Number(json.expires_in ?? 0);
  if (!access_token || !Number.isFinite(expires_in)) {
    throw new Error("Respuesta OAuth inválida");
  }
  return {
    access_token,
    refresh_token: typeof json.refresh_token === "string" ? json.refresh_token : undefined,
    expires_in,
    token_type: typeof json.token_type === "string" ? json.token_type : "Bearer",
  };
}

export async function refreshZipnovaAccessToken(refreshToken: string): Promise<ZipnovaTokenResponse> {
  const cfg = getZipnovaMarketplaceOAuthConfig();
  if (!cfg) {
    throw new Error("ZIPNOVA_OAUTH_* no configurado");
  }
  const res = await fetch(`${cfg.oauthBase}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof json.error_description === "string"
        ? json.error_description
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const access_token = json.access_token as string | undefined;
  const expires_in = Number(json.expires_in ?? 0);
  if (!access_token || !Number.isFinite(expires_in)) {
    throw new Error("Respuesta refresh OAuth inválida");
  }
  return {
    access_token,
    refresh_token: typeof json.refresh_token === "string" ? json.refresh_token : refreshToken,
    expires_in,
    token_type: typeof json.token_type === "string" ? json.token_type : "Bearer",
  };
}
