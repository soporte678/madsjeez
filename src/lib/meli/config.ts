export type MeliPublicConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authSite: string;
};

export function getMeliEnv(): MeliPublicConfig | null {
  const clientId = process.env.MELI_APP_ID?.trim();
  const clientSecret = process.env.MELI_CLIENT_SECRET?.trim();
  const redirectUri = process.env.MELI_REDIRECT_URI?.trim();
  const authSite =
    process.env.MELI_AUTH_SITE?.trim() || "https://auth.mercadolibre.com.ar";
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri, authSite };
}
