import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaSchemaMissingError } from "@/lib/prisma/known-errors";
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

  let row: {
    expiresAt: Date;
    scope: string | null;
    zipnovaAccountId: number | null;
    updatedAt: Date;
  } | null = null;
  let schemaMissing = false;
  try {
    row = await prisma.sellerZipnovaOAuth.findUnique({
      where: { userId: session.user.id },
      select: { expiresAt: true, scope: true, zipnovaAccountId: true, updatedAt: true },
    });
  } catch (e) {
    if (isPrismaSchemaMissingError(e)) {
      schemaMissing = true;
    } else {
      throw e;
    }
  }

  return NextResponse.json({
    oauthAppConfigured,
    connected: !!row,
    schemaMissing,
    expiresAt: row?.expiresAt?.toISOString() ?? null,
    scope: row?.scope ?? null,
    zipnovaAccountId: row?.zipnovaAccountId ?? null,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  });
}
