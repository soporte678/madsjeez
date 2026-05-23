import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { exchangeMerchantOAuthCode } from "@/lib/google-merchant/auth";

/**
 * Callback OAuth admin: intercambia `code` por tokens.
 * Guardá refresh_token en Railway como GOOGLE_MERCHANT_REFRESH_TOKEN (no se persiste en DB).
 */
export async function GET(request: NextRequest) {
  const ctx = await requireAdminRequest(request);
  if (ctx instanceof Response) return ctx;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectUri =
    url.searchParams.get("redirect_uri")?.trim() ||
    process.env.GOOGLE_MERCHANT_OAUTH_REDIRECT_URI?.trim();

  if (!code || !redirectUri) {
    return NextResponse.json(
      { error: "Faltan code o redirect_uri" },
      { status: 400 }
    );
  }

  try {
    const tokens = await exchangeMerchantOAuthCode(code, redirectUri);
    return NextResponse.json({
      ok: true,
      message:
        "Copiá refresh_token en Railway → GOOGLE_MERCHANT_REFRESH_TOKEN. No compartas este valor en chats.",
      refresh_token: tokens.refreshToken,
      has_access_token: Boolean(tokens.accessToken),
    });
  } catch (e) {
    console.error("[google-merchant/oauth/callback]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error OAuth" },
      { status: 502 }
    );
  }
}
