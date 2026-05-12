import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getMeliEnv } from "./config";
import { meliRefreshToken } from "./token";

export async function getMeliAccessTokenForUser(
  prismaUserId: string
): Promise<{ accessToken: string; meliUserId: string } | null> {
  let row;
  try {
    row = await prisma.sellerMeliOAuth.findUnique({
      where: { userId: prismaUserId },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022") {
      console.warn(
        "[meli] seller_meli_oauth: columna faltante en DB (ej. last_catalog_import_at). Ejecutá prisma migrate deploy."
      );
      return null;
    }
    throw e;
  }
  if (!row) return null;

  const now = Date.now();
  const bufferMs = 5 * 60 * 1000;
  /** Token aún usable para APIs ML sin necesidad de credenciales de app en este request. */
  if (row.expiresAt.getTime() - bufferMs > now) {
    return { accessToken: row.accessToken, meliUserId: row.meliUserId };
  }

  if (!row.refreshToken) {
    return { accessToken: row.accessToken, meliUserId: row.meliUserId };
  }

  const cfg = getMeliEnv();
  if (!cfg) {
    // Sin MELI_* no podemos refrescar; devolvemos el último access token (puede fallar en ML si ya expiró).
    return { accessToken: row.accessToken, meliUserId: row.meliUserId };
  }

  try {
    const refreshed = await meliRefreshToken(cfg, row.refreshToken);
    const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
    await prisma.sellerMeliOAuth.update({
      where: { userId: prismaUserId },
      data: {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token ?? row.refreshToken,
        expiresAt,
      },
    });
    return { accessToken: refreshed.access_token, meliUserId: row.meliUserId };
  } catch {
    return { accessToken: row.accessToken, meliUserId: row.meliUserId };
  }
}
