export type GoogleMerchantConfig = {
  merchantId: string;
  brand: string;
  contentLanguage: string;
  targetCountry: string;
  channel: "online";
  siteUrl: string;
};

export type GoogleMerchantConfigStatus = {
  configured: boolean;
  authMode: "oauth_refresh" | "service_account" | null;
  missing: string[];
  merchantId: string | null;
  contentLanguage: string;
  targetCountry: string;
};

const CONTENT_SCOPE = "https://www.googleapis.com/auth/content";

export function googleMerchantContentScope(): string {
  return CONTENT_SCOPE;
}

export function getGoogleMerchantConfig(): GoogleMerchantConfig | null {
  const merchantId = process.env.GOOGLE_MERCHANT_CENTER_ID?.trim();
  if (!merchantId) return null;

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "https://www.madsjeez.com.ar";

  return {
    merchantId,
    brand: process.env.GOOGLE_MERCHANT_BRAND?.trim() || "MadsJeez Marketplace",
    contentLanguage: process.env.GOOGLE_MERCHANT_CONTENT_LANGUAGE?.trim() || "es",
    targetCountry: process.env.GOOGLE_MERCHANT_TARGET_COUNTRY?.trim() || "AR",
    channel: "online",
    siteUrl,
  };
}

export function getGoogleMerchantConfigStatus(): GoogleMerchantConfigStatus {
  const missing: string[] = [];
  const merchantId = process.env.GOOGLE_MERCHANT_CENTER_ID?.trim() || null;

  if (!merchantId) missing.push("GOOGLE_MERCHANT_CENTER_ID");

  const hasOAuth =
    Boolean(process.env.GOOGLE_MERCHANT_CLIENT_ID?.trim()) &&
    Boolean(process.env.GOOGLE_MERCHANT_CLIENT_SECRET?.trim()) &&
    Boolean(process.env.GOOGLE_MERCHANT_REFRESH_TOKEN?.trim());

  const hasServiceAccount = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim());

  let authMode: GoogleMerchantConfigStatus["authMode"] = null;
  if (hasOAuth) authMode = "oauth_refresh";
  else if (hasServiceAccount) authMode = "service_account";
  else {
    missing.push(
      "GOOGLE_MERCHANT_CLIENT_ID + GOOGLE_MERCHANT_CLIENT_SECRET + GOOGLE_MERCHANT_REFRESH_TOKEN (recomendado) o GOOGLE_APPLICATION_CREDENTIALS_JSON con acceso a Merchant Center"
    );
  }

  return {
    configured: missing.length === 0 && authMode !== null,
    authMode,
    missing,
    merchantId,
    contentLanguage: process.env.GOOGLE_MERCHANT_CONTENT_LANGUAGE?.trim() || "es",
    targetCountry: process.env.GOOGLE_MERCHANT_TARGET_COUNTRY?.trim() || "AR",
  };
}
