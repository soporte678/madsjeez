import { prisma } from "@/lib/prisma";
import type { MeliItemDetail } from "./types";
import { meliGetItem, meliGetItemDescription, meliSearchUserItems } from "./api";
import { ensureFallbackCategory, resolveCategoryForMeliId } from "./category-map";
import { persistMeliImageBatch } from "./image-import";
import {
  aggregateStockFromMeliItem,
  buildDescriptionFromMeliItem,
  extractSellerSku,
  mapCondition,
  mapMeliItemToProductCore,
  primaryPriceFromMeliItem,
} from "./item-mapper";

export { extractSellerSku };

export type MeliImportPreviewRow = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  meliPrice: number;
  meliStock: number;
  localPrice: number | null;
  localStock: number | null;
  sellerSku: string | null;
  status: string;
  condition: string;
  listingType: string;
  sold: number;
  action: "create" | "update";
  meliCategoryId: string | null;
  hasVariations: boolean;
};

export type MeliImportItemResult = {
  itemId: string;
  ok: boolean;
  productId?: string;
  error?: string;
};

async function syncProductAttributes(productId: string, item: MeliItemDetail): Promise<void> {
  const attrs = item.attributes?.filter((a) => a.value_name) || [];
  await prisma.productAttribute.deleteMany({ where: { productId } });
  if (!attrs.length) return;
  await prisma.productAttribute.createMany({
    data: attrs.slice(0, 80).map((a) => ({
      productId,
      name: (a.name || a.id || "Atributo").slice(0, 200),
      value: String(a.value_name).slice(0, 500),
    })),
  });
}

async function syncProductVariations(productId: string, item: MeliItemDetail): Promise<void> {
  await prisma.productVariation.deleteMany({ where: { productId } });
  if (!item.variations?.length) return;

  for (const v of item.variations) {
    const attrs: Record<string, string> = {};
    for (const ac of v.attribute_combinations || []) {
      const key = (ac.name || ac.id || "attr").slice(0, 80);
      attrs[key] = String(ac.value_name || "");
    }
    const picIds = v.picture_ids || [];
    const urls =
      picIds
        .map((pid) => item.pictures?.find((p) => String(p.id) === String(pid)))
        .filter(Boolean)
        .map((p) => p!.secure_url || p!.url)
        .filter((u): u is string => Boolean(u)) || [];

    await prisma.productVariation.create({
      data: {
        productId,
        meliVariationId: String(v.id),
        sku: null,
        attributes: attrs,
        price: Number(v.price) || Number(item.price) || 0,
        stock: Math.max(0, v.available_quantity ?? 0),
        images: urls,
        isActive: (v.available_quantity ?? 0) > 0,
      },
    });
  }
}

async function syncProductImages(
  productId: string,
  urls: string[],
  title: string,
  persistImages: boolean
): Promise<void> {
  await prisma.productImage.deleteMany({ where: { productId } });
  const finalUrls = persistImages ? await persistMeliImageBatch(urls, productId) : urls;
  for (let i = 0; i < finalUrls.length; i++) {
    await prisma.productImage.create({
      data: {
        productId,
        url: finalUrls[i],
        alt: title,
        order: i,
      },
    });
  }
}

async function importSingleMeliItem(
  prismaUserId: string,
  meliOAuthAccountId: string,
  accessToken: string,
  itemId: string,
  errors: string[],
  itemResults: MeliImportItemResult[],
  options: { persistImages: boolean }
): Promise<{ kind: "imported" | "updated" | "skipped" }> {
  const itemRes = await meliGetItem(accessToken, itemId);
  if (!itemRes.ok || !(itemRes.data as MeliItemDetail)?.id) {
    const msg = `Publicación HTTP ${itemRes.status}`;
    errors.push(`${itemId}: ${msg}`);
    itemResults.push({ itemId, ok: false, error: msg });
    return { kind: "skipped" };
  }
  const item = itemRes.data as MeliItemDetail;

  let plainDescription = "";
  const descRes = await meliGetItemDescription(accessToken, itemId);
  if (descRes.ok) {
    const d = descRes.data as { plain_text?: string; text?: string };
    plainDescription = (d.plain_text || d.text || "").trim();
  }

  const description = buildDescriptionFromMeliItem(item, plainDescription);
  const core = mapMeliItemToProductCore(item, description);

  let categoryId: string;
  try {
    categoryId = item.category_id
      ? await resolveCategoryForMeliId(item.category_id, accessToken)
      : await ensureFallbackCategory();
  } catch {
    categoryId = await ensureFallbackCategory();
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { meliItemId: item.id },
    });

    const productData = {
      title: core.title,
      description: core.description,
      price: core.price,
      stock: core.stock,
      sales: core.sales,
      condition: core.condition,
      freeShipping: core.freeShipping,
      originalPrice: core.originalPrice ?? undefined,
      isActive: core.isActive,
      sku: core.sku,
      categoryId,
      meliOAuthAccountId,
      meliCategoryId: core.meliCategoryId,
      meliListingTypeId: core.meliListingTypeId,
      meliStatus: core.meliStatus,
      meliPermalink: core.meliPermalink,
      meliCurrencyId: core.meliCurrencyId,
      meliPayload: core.meliPayload,
      meliLastSyncedAt: new Date(),
      meliStockSyncEnabled: true,
      hasVideo: core.hasVideo,
    };

    let productId: string;

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: productData,
      });
      productId = existing.id;
      await syncProductImages(productId, core.pictureUrls, core.title, options.persistImages);
      await syncProductAttributes(productId, item);
      await syncProductVariations(productId, item);
      itemResults.push({ itemId: item.id, ok: true, productId });
      return { kind: "updated" };
    }

    const created = await prisma.product.create({
      data: {
        sellerId: prismaUserId,
        meliItemId: item.id,
        ...productData,
      },
    });
    productId = created.id;
    await syncProductImages(productId, core.pictureUrls, core.title, options.persistImages);
    await syncProductAttributes(productId, item);
    await syncProductVariations(productId, item);
    itemResults.push({ itemId: item.id, ok: true, productId });
    return { kind: "imported" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`${itemId}: ${msg}`);
    itemResults.push({ itemId: item.id, ok: false, error: msg });
    return { kind: "skipped" };
  }
}

export async function importMeliItemsForUser(
  prismaUserId: string,
  meliOAuthAccountId: string,
  accessToken: string,
  meliUserId: string,
  options?: {
    maxPages?: number;
    itemIds?: string[];
    persistImages?: boolean;
  }
): Promise<{
  imported: number;
  updated: number;
  errors: string[];
  itemResults: MeliImportItemResult[];
}> {
  const maxPages = Math.min(Math.max(options?.maxPages ?? 50, 1), 100);
  const persistImages = options?.persistImages !== false;
  const filterIds = options?.itemIds?.length
    ? [...new Set(options.itemIds.map((x) => String(x).trim()).filter(Boolean))]
    : null;

  const errors: string[] = [];
  const itemResults: MeliImportItemResult[] = [];
  let imported = 0;
  let updated = 0;

  if (filterIds?.length) {
    for (const itemId of filterIds) {
      const r = await importSingleMeliItem(
        prismaUserId,
        meliOAuthAccountId,
        accessToken,
        itemId,
        errors,
        itemResults,
        { persistImages }
      );
      if (r.kind === "imported") imported++;
      if (r.kind === "updated") updated++;
    }
    return { imported, updated, errors, itemResults };
  }

  let scrollId: string | undefined;
  let pages = 0;
  const seenIds = new Set<string>();

  while (pages < maxPages) {
    const search = await meliSearchUserItems(accessToken, meliUserId, scrollId);
    if (!search.ok) {
      errors.push(`items/search HTTP ${search.status}`);
      break;
    }

    const payload = search.data as { results?: string[]; scroll_id?: string };
    const ids = payload.results || [];
    scrollId = payload.scroll_id;
    pages++;

    if (!ids.length) break;

    for (const itemId of ids) {
      if (seenIds.has(itemId)) continue;
      seenIds.add(itemId);

      const r = await importSingleMeliItem(
        prismaUserId,
        meliOAuthAccountId,
        accessToken,
        itemId,
        errors,
        itemResults,
        { persistImages }
      );
      if (r.kind === "imported") imported++;
      if (r.kind === "updated") updated++;
    }

    if (!scrollId) break;
  }

  return { imported, updated, errors, itemResults };
}

export async function previewMeliItemsForUser(
  accessToken: string,
  meliUserId: string,
  options?: { maxPages?: number; sampleSize?: number }
): Promise<{
  totalFound: number;
  uniqueFound: number;
  alreadyLinked: number;
  toCreate: number;
  toUpdate: number;
  breakdown: {
    byStatus: Record<string, number>;
    byCondition: Record<string, number>;
    byListingType: Record<string, number>;
  };
  rows: MeliImportPreviewRow[];
  samples: MeliImportPreviewRow[];
  warnings: string[];
}> {
  const maxPages = Math.min(Math.max(options?.maxPages ?? 30, 1), 100);
  const sampleCap = Math.min(Math.max(options?.sampleSize ?? 25, 5), 2000);

  let scrollId: string | undefined;
  let pages = 0;
  let totalFound = 0;
  const uniqueIds = new Set<string>();
  const warnings: string[] = [];
  const rows: MeliImportPreviewRow[] = [];

  const byStatus: Record<string, number> = {};
  const byCondition: Record<string, number> = {};
  const byListingType: Record<string, number> = {};
  let alreadyLinked = 0;
  let toCreate = 0;
  let toUpdate = 0;

  while (pages < maxPages) {
    const search = await meliSearchUserItems(accessToken, meliUserId, scrollId);
    if (!search.ok) {
      warnings.push(`items/search HTTP ${search.status}`);
      break;
    }

    const payload = search.data as { results?: string[]; scroll_id?: string };
    const ids = payload.results || [];
    scrollId = payload.scroll_id;
    pages++;
    if (!ids.length) break;

    totalFound += ids.length;
    const batchIds: string[] = [];
    for (const id of ids) {
      if (uniqueIds.has(id)) continue;
      uniqueIds.add(id);
      batchIds.push(id);
    }
    if (!batchIds.length) continue;

    const existingRows = await prisma.product.findMany({
      where: { meliItemId: { in: batchIds } },
      select: { meliItemId: true, price: true, stock: true, sku: true },
    });
    const existingMap = new Map(
      existingRows.filter((r) => r.meliItemId).map((r) => [r.meliItemId as string, r])
    );

    for (const itemId of batchIds) {
      const itemRes = await meliGetItem(accessToken, itemId);
      if (!itemRes.ok || !(itemRes.data as MeliItemDetail)?.id) {
        warnings.push(`${itemId}: publicación HTTP ${itemRes.status}`);
        continue;
      }
      const item = itemRes.data as MeliItemDetail;
      const status = (item.status || "unknown").toLowerCase();
      const condition = mapCondition(item.condition);
      const listingType = (item.listing_type_id || "unknown").toLowerCase();

      byStatus[status] = (byStatus[status] || 0) + 1;
      byCondition[condition] = (byCondition[condition] || 0) + 1;
      byListingType[listingType] = (byListingType[listingType] || 0) + 1;

      const exists = existingMap.has(item.id);
      if (exists) {
        alreadyLinked++;
        toUpdate++;
      } else {
        toCreate++;
      }

      const pics = item.pictures || [];
      const thumb = pics[0]?.secure_url || pics[0]?.url || null;
      const local = existingMap.get(item.id);

      rows.push({
        id: item.id,
        title: item.title,
        thumbnailUrl: thumb,
        meliPrice: primaryPriceFromMeliItem(item),
        meliStock: aggregateStockFromMeliItem(item),
        localPrice: local ? local.price : null,
        localStock: local ? local.stock : null,
        sellerSku: extractSellerSku(item) || local?.sku || null,
        status,
        condition,
        listingType,
        sold: Math.max(0, item.sold_quantity ?? 0),
        action: exists ? "update" : "create",
        meliCategoryId: item.category_id || null,
        hasVariations: Boolean(item.variations?.length),
      });
    }

    if (!scrollId) break;
  }

  return {
    totalFound,
    uniqueFound: uniqueIds.size,
    alreadyLinked,
    toCreate,
    toUpdate,
    breakdown: { byStatus, byCondition, byListingType },
    rows,
    samples: rows.slice(0, sampleCap),
    warnings,
  };
}
