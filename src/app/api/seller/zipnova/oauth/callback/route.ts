import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeZipnovaAuthorizationCode } from "@/lib/zipnova/oauth-marketplace";
import { fetchZipnovaFirstAccountId } from "@/lib/zipnova/quote-cart";

const STATE_COOKIE = "zipnova_oauth_state";

const DEFAULT_SCOPES =
  "shipments.quote shipments.create shipments.show orders.create orders.view accounts.show";

function appBaseUrl(req: Request): string {
  const env = process.env.NEXTAUTH_URL?.trim().replace(/\/$/, "");
  if (env) return env;
  return new URL(req.url).origin;
}

function redirectTo(req: Request, path: string) {
  return NextResponse.redirect(new URL(path, appBaseUrl(req)).toString());
}

/**
 * GET /api/seller/zipnova/oauth/callback?code=...&state=...
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirectTo(req, "/auth/login");
  }

  if (!session.user.isSeller) {
    const res = redirectTo(req, "/dashboard?error=zipnova_not_seller");
    res.cookies.delete(STATE_COOKIE);
    return res;
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const err = searchParams.get("error");

  const jar = await cookies();
  const cookieState = jar.get(STATE_COOKIE)?.value;

  const fail = (reason: string) => {
    const r = redirectTo(req, `/dashboard/publicaciones?zipnova_error=${encodeURIComponent(reason)}`);
    r.cookies.delete(STATE_COOKIE);
    return r;
  };

  if (err) {
    return fail(err);
  }
  if (!code || !state) {
    return fail("missing_code");
  }
  if (!cookieState || cookieState !== state) {
    return fail("invalid_state");
  }

  try {
    const tokens = await exchangeZipnovaAuthorizationCode(code);
    const expiresAt = new Date(Date.now() + Math.max(60, tokens.expires_in) * 1000);

    const baseUrl = (process.env.ZIPNOVA_API_BASE_URL || "https://api.zipnova.com.ar/v2").replace(/\/$/, "");
    let zipnovaAccountId: number | null = null;
    try {
      zipnovaAccountId = await fetchZipnovaFirstAccountId(baseUrl, tokens.access_token);
    } catch {
      zipnovaAccountId = null;
    }

    await prisma.sellerZipnovaOAuth.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt,
        scope: DEFAULT_SCOPES,
        zipnovaAccountId,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt,
        scope: DEFAULT_SCOPES,
        ...(zipnovaAccountId != null ? { zipnovaAccountId } : {}),
      },
    });

    const ok = redirectTo(req, "/dashboard/publicaciones?zipnova=connected");
    ok.cookies.delete(STATE_COOKIE);
    return ok;
  } catch (e) {
    console.error("zipnova oauth callback:", e);
    const msg = e instanceof Error ? e.message : "token_exchange_failed";
    return fail(msg);
  }
}
