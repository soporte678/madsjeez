import type { MeliPublicConfig } from "./config";

export type MeliTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

export async function meliExchangeCode(
  cfg: MeliPublicConfig,
  code: string
): Promise<MeliTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    code,
    redirect_uri: cfg.redirectUri,
  });
  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.message === "string" ? data.message : "Token exchange failed");
  }
  return data as MeliTokenResponse;
}

export async function meliRefreshToken(
  cfg: MeliPublicConfig,
  refreshToken: string
): Promise<MeliTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: refreshToken,
  });
  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.message === "string" ? data.message : "Refresh failed");
  }
  return data as MeliTokenResponse;
}
