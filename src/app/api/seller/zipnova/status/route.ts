import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getZipnovaMarketplaceOAuthConfig } from "@/lib/zipnova/oauth-marketplace";

/** GET /api/seller/zipnova/status — si el vendedor conectó Zipnova OAuth y si el marketplace tiene app OAuth. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!session.user.isSeller) {
    return NextResponse.json({ error: "Solo vendedores" }, { status: 403 });
  }

  const oauthAppConfigured = getZipnovaMarketplaceOAuthConfig() != null;

  const row = await prisma.sellerZipnovaOAuth.findUnique({
    where: { userId: session.user.id },
    select: { expiresAt: true, scope: true, zipnovaAccountId: true, updatedAt: true },
  });

  return NextResponse.json({
    oauthAppConfigured,
    connected: !!row,
    expiresAt: row?.expiresAt?.toISOString() ?? null,
    scope: row?.scope ?? null,
    zipnovaAccountId: row?.zipnovaAccountId ?? null,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  });
}
