import { GoogleAuth, OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { getGoogleMerchantConfigStatus, googleMerchantContentScope } from "./config";

export type ContentApiClient = ReturnType<typeof google.content>;

export async function getGoogleMerchantContentClient(): Promise<ContentApiClient> {
  const status = getGoogleMerchantConfigStatus();
  if (!status.configured) {
    throw new Error(`Google Merchant no configurado: faltan ${status.missing.join(", ")}`);
  }

  const scope = googleMerchantContentScope();

  if (status.authMode === "oauth_refresh") {
    const clientId = process.env.GOOGLE_MERCHANT_CLIENT_ID!.trim();
    const clientSecret = process.env.GOOGLE_MERCHANT_CLIENT_SECRET!.trim();
    const refreshToken = process.env.GOOGLE_MERCHANT_REFRESH_TOKEN!.trim();

    const oauth2 = new OAuth2Client(clientId, clientSecret);
    oauth2.setCredentials({ refresh_token: refreshToken });
    await oauth2.getAccessToken();

    return google.content({ version: "v2.1", auth: oauth2 });
  }

  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!.trim();
  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON no es JSON válido");
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: [scope],
  });

  return google.content({ version: "v2.1", auth });
}

export function buildMerchantOAuthAuthorizeUrl(redirectUri: string): string {
  const clientId = process.env.GOOGLE_MERCHANT_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_MERCHANT_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Faltan GOOGLE_MERCHANT_CLIENT_ID y GOOGLE_MERCHANT_CLIENT_SECRET");
  }

  const oauth2 = new OAuth2Client(clientId, clientSecret, redirectUri);
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [googleMerchantContentScope()],
  });
}

export async function exchangeMerchantOAuthCode(
  code: string,
  redirectUri: string
): Promise<{ refreshToken: string | null; accessToken: string | null }> {
  const clientId = process.env.GOOGLE_MERCHANT_CLIENT_ID!.trim();
  const clientSecret = process.env.GOOGLE_MERCHANT_CLIENT_SECRET!.trim();
  const oauth2 = new OAuth2Client(clientId, clientSecret, redirectUri);
  const { tokens } = await oauth2.getToken(code);
  return {
    refreshToken: tokens.refresh_token ?? null,
    accessToken: tokens.access_token ?? null,
  };
}
