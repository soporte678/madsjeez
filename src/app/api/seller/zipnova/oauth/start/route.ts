import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildZipnovaAuthorizeUrl, getZipnovaMarketplaceOAuthConfig } from "@/lib/zipnova/oauth-marketplace";

const STATE_COOKIE = "zipnova_oauth_state";

/**
 * GET /api/seller/zipnova/oauth/start
 * Redirige al vendedor logueado a Zipnova para autorizar la app marketplace.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = session.user as { isSeller?: boolean };
  if (!user.isSeller) {
    return NextResponse.json({ error: "Solo vendedores pueden conectar Zipnova" }, { status: 403 });
  }

  if (!getZipnovaMarketplaceOAuthConfig()) {
    return NextResponse.json(
      {
        error:
          "OAuth Zipnova no configurado. Definí ZIPNOVA_OAUTH_CLIENT_ID, ZIPNOVA_OAUTH_CLIENT_SECRET y ZIPNOVA_OAUTH_REDIRECT_URI.",
      },
      { status: 503 }
    );
  }

  const state = randomBytes(24).toString("base64url");
  const url = buildZipnovaAuthorizeUrl({ state });
  if (!url) {
    return NextResponse.json({ error: "No se pudo armar la URL de autorización" }, { status: 503 });
  }

  const res = NextResponse.redirect(url);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return res;
}
