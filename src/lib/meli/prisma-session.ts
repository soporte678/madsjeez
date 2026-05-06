import { prisma } from "@/lib/prisma";
import { getMeliEnv } from "./config";
import { meliRefreshToken } from "./token";

export async function getMeliAccessTokenForUser(
  prismaUserId: string
): Promise<{ accessToken: string; meliUserId: string } | null> {
  const row = await prisma.sellerMeliOAuth.findUnique({
    where: { userId: prismaUserId },
  });
  if (!row) return null;

  const cfg = getMeliEnv();
  if (!cfg) return null;

  const now = Date.now();
  const bufferMs = 5 * 60 * 1000;
  if (row.expiresAt.getTime() - bufferMs > now) {
    return { accessToken: row.accessToken, meliUserId: row.meliUserId };
  }

  if (!row.refreshToken) {
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
