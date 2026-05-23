import { NextRequest } from "next/server";
import { adminJson, requireAdminRequest } from "@/lib/admin-api";
import { buildMerchantOAuthAuthorizeUrl } from "@/lib/google-merchant/auth";

/**
 * Genera URL de consentimiento OAuth para obtener refresh_token (uso único en setup).
 * redirect_uri debe coincidir con la URI autorizada en Google Cloud Console.
 */
export async function GET(request: NextRequest) {
  const ctx = await requireAdminRequest(request);
  if (ctx instanceof Response) return ctx;

  const url = new URL(request.url);
  const redirectUri =
    url.searchParams.get("redirect_uri")?.trim() ||
    process.env.GOOGLE_MERCHANT_OAUTH_REDIRECT_URI?.trim();

  if (!redirectUri) {
    return adminJson(
      ctx,
      {
        error:
          "Indicá redirect_uri en query o definí GOOGLE_MERCHANT_OAUTH_REDIRECT_URI (ej. https://www.madsjeez.com.ar/api/admin/google-merchant/oauth/callback)",
      },
      { status: 400 }
    );
  }

  try {
    const authorizeUrl = buildMerchantOAuthAuthorizeUrl(redirectUri);
    return adminJson(ctx, { authorizeUrl, redirectUri, scope: "https://www.googleapis.com/auth/content" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "No se pudo generar la URL OAuth";
    return adminJson(ctx, { error: message }, { status: 400 });
  }
}
