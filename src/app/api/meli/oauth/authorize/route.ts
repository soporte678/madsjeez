import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeliEnv } from "@/lib/meli/config";
import { signMeliOAuthUserId } from "@/lib/meli/oauth-state";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cfg = getMeliEnv();
  if (!cfg) {
    return NextResponse.json(
      { error: "Mercado Libre OAuth no configurado (MELI_APP_ID, MELI_CLIENT_SECRET, MELI_REDIRECT_URI)" },
      { status: 503 }
    );
  }

  const state = signMeliOAuthUserId(session.user.id);
  const url =
    `${cfg.authSite}/authorization?response_type=code` +
    `&client_id=${encodeURIComponent(cfg.clientId)}` +
    `&redirect_uri=${encodeURIComponent(cfg.redirectUri)}` +
    `&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(url);
}
