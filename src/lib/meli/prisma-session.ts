import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getMeliEnv } from "./config";
import { meliRefreshToken } from "./token";

export type MeliTokenCtx = {
  accessToken: string;
  meliUserId: string;
  accountId: string;
};

type MeliOAuthCoreRow = {
  id: string;
  meliUserId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
};

async function fetchMeliOAuthCoreRaw(accountId: string): Promise<MeliOAuthCoreRow | null> {
  try {
    const rows = await prisma.$queryRaw<MeliOAuthCoreRow[]>(Prisma.sql`
      SELECT
        id,
        meli_user_id AS "meliUserId",
        access_token AS "accessToken",
        refresh_token AS "refreshToken",
        expires_at AS "expiresAt"
      FROM seller_meli_oauth
      WHERE id = ${accountId}
      LIMIT 1
    `);
    return rows[0] ?? null;
  } catch (err) {
    console.warn("[meli] raw fallback seller_meli_oauth:", err);
    return null;
  }
}

async function resolveAccessFromCore(accountId: string, row: MeliOAuthCoreRow): Promise<MeliTokenCtx> {
  const now = Date.now();
  const bufferMs = 5 * 60 * 1000;
  if (row.expiresAt.getTime() - bufferMs > now) {
    return { accessToken: row.accessToken, meliUserId: row.meliUserId, accountId };
  }

  if (!row.refreshToken) {
    return { accessToken: row.accessToken, meliUserId: row.meliUserId, accountId };
  }

  const cfg = getMeliEnv();
  if (!cfg) {
    return { accessToken: row.accessToken, meliUserId: row.meliUserId, accountId };
  }

  try {
    const refreshed = await meliRefreshToken(cfg, row.refreshToken);
    const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
    try {
      await prisma.sellerMeliOAuth.update({
        where: { id: accountId },
        data: {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? row.refreshToken,
          expiresAt,
        },
      });
    } catch (persist) {
      console.warn("[meli] no se pudo persistir refresh en DB", persist);
    }
    return { accessToken: refreshed.access_token, meliUserId: row.meliUserId, accountId };
  } catch {
    return { accessToken: row.accessToken, meliUserId: row.meliUserId, accountId };
  }
}

export async function getMeliAccessTokenForAccount(accountId: string): Promise<MeliTokenCtx | null> {
  let row;
  try {
    row = await prisma.sellerMeliOAuth.findUnique({ where: { id: accountId } });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022") {
      const raw = await fetchMeliOAuthCoreRaw(accountId);
      if (!raw) return null;
      return resolveAccessFromCore(accountId, raw);
    }
    throw e;
  }

  if (!row) return null;

  return resolveAccessFromCore(accountId, {
    id: row.id,
    meliUserId: row.meliUserId,
    accessToken: row.accessToken,
    refreshToken: row.refreshToken,
    expiresAt: row.expiresAt,
  });
}

/** Token ML para el vendedor: cuenta elegida o la marcada como principal. */
export async function getMeliAccessTokenForUser(
  prismaUserId: string,
  accountId?: string
): Promise<MeliTokenCtx | null> {
  if (accountId) {
    const owned = await prisma.sellerMeliOAuth.findFirst({
      where: { id: accountId, userId: prismaUserId },
      select: { id: true },
    });
    if (!owned) return null;
    return getMeliAccessTokenForAccount(accountId);
  }

  const primary = await prisma.sellerMeliOAuth.findFirst({
    where: { userId: prismaUserId, isPrimary: true },
    select: { id: true },
  });
  if (primary) return getMeliAccessTokenForAccount(primary.id);

  const anyAcc = await prisma.sellerMeliOAuth.findFirst({
    where: { userId: prismaUserId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (!anyAcc) return null;
  return getMeliAccessTokenForAccount(anyAcc.id);
}
