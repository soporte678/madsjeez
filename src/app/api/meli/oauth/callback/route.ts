import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMeliEnv } from "@/lib/meli/config";
import { meliExchangeCode } from "@/lib/meli/token";
import { meliGetMe } from "@/lib/meli/api";
import { verifyMeliOAuthState } from "@/lib/meli/oauth-state";

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/** Panel ML incrustado en /dashboard (Ventas → Mercado Libre). Evita depender de la ruta /dashboard/meli en prod. */
function meliDashboardReturn(search: Record<string, string>) {
  const q = new URLSearchParams(search).toString();
  const path = q ? `/dashboard?${q}` : `/dashboard`;
  return `${appBaseUrl()}${path}#meli-sync`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const meliError = url.searchParams.get("error");

  if (meliError) {
    return NextResponse.redirect(meliDashboardReturn({ error: meliError }));
  }

  const userId = verifyMeliOAuthState(state || "");
  if (!code || !userId) {
    return NextResponse.redirect(meliDashboardReturn({ error: "invalid_state" }));
  }

  const cfg = getMeliEnv();
  if (!cfg) {
    return NextResponse.redirect(meliDashboardReturn({ error: "meli_not_configured" }));
  }

  try {
    const tokens = await meliExchangeCode(cfg, code);
    const me = await meliGetMe(tokens.access_token);
    if (!me.ok) {
      return NextResponse.redirect(meliDashboardReturn({ error: "users_me_failed" }));
    }
    const meliUserId = String((me.data as { id?: string | number }).id ?? "");
    if (!meliUserId) {
      return NextResponse.redirect(meliDashboardReturn({ error: "no_meli_user" }));
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.sellerMeliOAuth.upsert({
      where: { userId },
      create: {
        userId,
        meliUserId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt,
      },
      update: {
        meliUserId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt,
      },
    });

    return NextResponse.redirect(meliDashboardReturn({ connected: "1" }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "oauth_error";
    return NextResponse.redirect(meliDashboardReturn({ error: msg.slice(0, 200) }));
  }
}
