import { prisma } from "@/lib/prisma";
import { getMeliAccessTokenForAccount } from "./prisma-session";
import { meliGetItem, meliPutItem } from "./api";
import type { MeliItemDetail } from "./types";
import { aggregateStockFromMeliItem } from "./item-mapper";

/** ML es referencia: lee ítem y actualiza stock local (y variaciones). */
export async function applyMeliItemStockToLocal(
  meliItemId: string,
  accessToken: string
): Promise<{ ok: boolean; productId?: string; error?: string }> {
  const itemRes = await meliGetItem(accessToken, meliItemId);
  if (!itemRes.ok) {
    return { ok: false, error: `HTTP ${itemRes.status} al leer ${meliItemId}` };
  }

  const item = itemRes.data as MeliItemDetail;
  const stock = aggregateStockFromMeliItem(item);

  const product = await prisma.product.findUnique({
    where: { meliItemId },
    select: { id: true, meliStockSyncEnabled: true },
  });

  if (!product) return { ok: false, error: "Producto local no vinculado" };
  if (!product.meliStockSyncEnabled) return { ok: true, productId: product.id };

  const price = Number(item.price);
  await prisma.product.update({
    where: { id: product.id },
    data: {
      stock,
      ...(Number.isFinite(price) && price > 0 ? { price } : {}),
      meliStatus: item.status || undefined,
      meliPayload: item as object,
      meliLastSyncedAt: new Date(),
      isActive: stock > 0 || (item.status || "").toLowerCase() === "active",
    },
  });

  if (item.variations?.length) {
    for (const v of item.variations) {
      const vid = String(v.id);
      await prisma.productVariation.updateMany({
        where: { productId: product.id, meliVariationId: vid },
        data: {
          stock: Math.max(0, v.available_quantity ?? 0),
          price: Number(v.price) || undefined,
        },
      });
    }
  }

  return { ok: true, productId: product.id };
}

export async function pushLocalStockToMeli(productId: string): Promise<{ ok: boolean; error?: string }> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      meliItemId: true,
      meliOAuthAccountId: true,
      meliStockSyncEnabled: true,
      price: true,
      stock: true,
      sellerId: true,
      variations: {
        where: { meliVariationId: { not: null } },
        select: { meliVariationId: true, stock: true, price: true },
      },
    },
  });

  if (!product?.meliItemId || !product.meliStockSyncEnabled) return { ok: true };

  const accountRow =
    product.meliOAuthAccountId != null
      ? { id: product.meliOAuthAccountId }
      : await prisma.sellerMeliOAuth.findFirst({
          where: { userId: product.sellerId },
          orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
          select: { id: true },
        });

  if (!accountRow?.id) return { ok: false, error: "Sin cuenta ML conectada" };

  const tok = await getMeliAccessTokenForAccount(accountRow.id);
  if (!tok) return { ok: false, error: "Token ML no disponible" };

  const body: Record<string, unknown> = {
    available_quantity: product.stock,
    price: product.price,
  };

  if (product.variations.length) {
    body.variations = product.variations.map((v) => ({
      id: Number(v.meliVariationId),
      available_quantity: v.stock,
      price: v.price,
    }));
  }

  const put = await meliPutItem(tok.accessToken, product.meliItemId, body);
  if (!put.ok) {
    const err = put.data as { message?: string };
    return { ok: false, error: err?.message || `ML HTTP ${put.status}` };
  }

  await prisma.product.update({
    where: { id: productId },
    data: { meliLastSyncedAt: new Date() },
  });

  return { ok: true };
}

export async function pushStockToMeliForProductIds(productIds: string[]): Promise<void> {
  const unique = [...new Set(productIds.filter(Boolean))];
  for (const id of unique) {
    try {
      await pushLocalStockToMeli(id);
    } catch (e) {
      console.warn("[meli stock-sync] push failed", id, e);
    }
  }
}
