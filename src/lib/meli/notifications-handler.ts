import { prisma } from "@/lib/prisma";
import { getMeliAccessTokenForAccount } from "./prisma-session";
import { applyMeliItemStockToLocal } from "./stock-sync";

type MeliNotificationBody = {
  topic?: string;
  resource?: string;
  user_id?: number | string;
};

function extractItemId(resource: string): string | null {
  const m = resource.match(/\/items\/(ML[A-Z]\d+)/i);
  return m?.[1] ?? null;
}

export async function processMeliNotification(payload: MeliNotificationBody): Promise<void> {
  const topic = (payload.topic || "").toLowerCase();
  const resource = payload.resource || "";

  if (topic !== "items" || !resource) return;

  const meliItemId = extractItemId(resource);
  if (!meliItemId) return;

  const product = await prisma.product.findUnique({
    where: { meliItemId },
    select: { meliOAuthAccountId: true, meliStockSyncEnabled: true },
  });

  if (!product?.meliStockSyncEnabled) return;

  let accountId = product.meliOAuthAccountId;
  if (!accountId && payload.user_id != null) {
    const acc = await prisma.sellerMeliOAuth.findFirst({
      where: { meliUserId: String(payload.user_id) },
      select: { id: true },
    });
    accountId = acc?.id ?? null;
  }

  if (!accountId) return;

  const tok = await getMeliAccessTokenForAccount(accountId);
  if (!tok) return;

  await applyMeliItemStockToLocal(meliItemId, tok.accessToken);
}
