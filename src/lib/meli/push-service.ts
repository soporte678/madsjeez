import { prisma } from "@/lib/prisma";
import { getMeliAccessTokenForAccount } from "./prisma-session";
import { meliPutItem } from "./api";

export type MeliPushItemResult = {
  meliItemId: string;
  productId?: string;
  ok: boolean;
  error?: string;
};

export async function pushProductsToMeli(
  userId: string,
  meliItemIds: string[],
  options?: { accountId?: string }
): Promise<MeliPushItemResult[]> {
  const results: MeliPushItemResult[] = [];

  const products = await prisma.product.findMany({
    where: { sellerId: userId, meliItemId: { in: meliItemIds } },
    include: {
      images: { orderBy: { order: "asc" } },
      variations: true,
    },
  });

  const byMeli = new Map(products.map((p) => [p.meliItemId as string, p]));

  for (const mid of meliItemIds) {
    const p = byMeli.get(mid);
    if (!p) {
      results.push({ meliItemId: mid, ok: false, error: "No encontrado en tu catálogo local." });
      continue;
    }

    const resolvedAccountId =
      options?.accountId ||
      p.meliOAuthAccountId ||
      (
        await prisma.sellerMeliOAuth.findFirst({
          where: { userId },
          orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
          select: { id: true },
        })
      )?.id;

    if (!resolvedAccountId) {
      results.push({ meliItemId: mid, productId: p.id, ok: false, error: "Sin cuenta ML." });
      continue;
    }

    const tok = await getMeliAccessTokenForAccount(resolvedAccountId);
    if (!tok) {
      results.push({ meliItemId: mid, productId: p.id, ok: false, error: "Token ML expirado." });
      continue;
    }

    const imageUrls = p.images.map((i) => i.url).filter(Boolean);
    const pictures = imageUrls.slice(0, 12).map((url) => ({ source: url }));

    const body: Record<string, unknown> = {
      title: p.title.slice(0, 60),
      price: p.price,
      available_quantity: p.stock,
    };

    if (p.variations.length && p.variations.some((v) => v.meliVariationId)) {
      body.variations = p.variations
        .filter((v) => v.meliVariationId)
        .map((v) => ({
          id: Number(v.meliVariationId),
          price: v.price,
          available_quantity: v.stock,
        }));
    }

    if (pictures.length) body.pictures = pictures;

    const put = await meliPutItem(tok.accessToken, mid, body);
    if (!put.ok) {
      const errBody = put.data as { message?: string; error?: string };
      results.push({
        meliItemId: mid,
        productId: p.id,
        ok: false,
        error: errBody?.message || errBody?.error || `ML HTTP ${put.status}`,
      });
      continue;
    }

    await prisma.product.update({
      where: { id: p.id },
      data: { meliLastSyncedAt: new Date() },
    });

    results.push({ meliItemId: mid, productId: p.id, ok: true });
  }

  return results;
}
