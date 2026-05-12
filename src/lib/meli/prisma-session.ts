import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getMeliEnv } from "./config";
import { meliRefreshToken } from "./token";

/** Columnas mínimas para ML; sirve si Prisma falla (P2022) por columnas nuevas aún no migradas en DB. */
type MeliOAuthCoreRow = {
  meliUserId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
};

async function fetchMeliOAuthCoreRaw(userId: string): Promise<MeliOAuthCoreRow | null> {
  try {
    const rows = await prisma.$queryRaw<MeliOAuthCoreRow[]>(Prisma.sql`
      SELECT
        meli_user_id AS "meliUserId",
        access_token AS "accessToken",
        refresh_token AS "refreshToken",
        expires_at AS "expiresAt"
      FROM seller_meli_oauth
      WHERE user_id = ${userId}
      LIMIT 1
    `);
    return rows[0] ?? null;
  } catch (err) {
    console.warn("[meli] raw fallback seller_meli_oauth:", err);
    return null;
  }
}

async function resolveAccessFromCore(
  prismaUserId: string,
  row: MeliOAuthCoreRow
): Promise<{ accessToken: string; meliUserId: string }> {
  const now = Date.now();
  const bufferMs = 5 * 60 * 1000;
  if (row.expiresAt.getTime() - bufferMs > now) {
    return { accessToken: row.accessToken, meliUserId: row.meliUserId };
  }

  if (!row.refreshToken) {
    return { accessToken: row.accessToken, meliUserId: row.meliUserId };
  }

  const cfg = getMeliEnv();
  if (!cfg) {
    return { accessToken: row.accessToken, meliUserId: row.meliUserId };
  }

  try {
    const refreshed = await meliRefreshToken(cfg, row.refreshToken);
    const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
    try {
      await prisma.sellerMeliOAuth.update({
        where: { userId: prismaUserId },
        data: {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? row.refreshToken,
          expiresAt,
        },
      });
    } catch (persist) {
      console.warn(
        "[meli] no se pudo persistir refresh en DB (p. ej. columnas desalineadas); el token nuevo sigue válido en esta respuesta.",
        persist
      );
    }
    return { accessToken: refreshed.access_token, meliUserId: row.meliUserId };
  } catch {
    return { accessToken: row.accessToken, meliUserId: row.meliUserId };
  }
}

export async function getMeliAccessTokenForUser(
  prismaUserId: string
): Promise<{ accessToken: string; meliUserId: string } | null> {
  let row;
  try {
    row = await prisma.sellerMeliOAuth.findUnique({
      where: { userId: prismaUserId },
    });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022") {
      console.warn(
        "[meli] seller_meli_oauth: esquema Prisma vs DB desalineado (P2022). Intentando lectura SQL mínima. Ejecutá prisma migrate deploy cuando puedas."
      );
      const raw = await fetchMeliOAuthCoreRaw(prismaUserId);
      if (!raw) return null;
      return resolveAccessFromCore(prismaUserId, raw);
    }
    throw e;
  }

  if (!row) return null;

  return resolveAccessFromCore(prismaUserId, {
    meliUserId: row.meliUserId,
    accessToken: row.accessToken,
    refreshToken: row.refreshToken,
    expiresAt: row.expiresAt,
  });
}
