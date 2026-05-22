import { prisma } from "@/lib/prisma";
import type { MeliItemDetail } from "./types";
import { meliGetItem, meliGetItemDescription } from "./api";
import {
  collectMeliItemIds,
  resolveMeliScrollMaxPages,
  runPool,
  type MeliCollectItemsResult,
} from "./import-scroll";
import { ensureFallbackCategory, resolveCategoryForMeliId } from "./category-map";
import { persistMeliImageBatch } from "./image-import";
import {
  checkImportDuplicate,
  createSellerDedupeIndex,
  registerProductInDedupeIndex,
  type SellerDedupeIndex,
} from "./dedupe";
import {
  aggregateStockFromMeliItem,
  buildDescriptionFromMeliItem,
  extractSellerSku,
  mapCondition,
  mapMeliItemToProductCore,
  primaryPriceFromMeliItem,
} from "./item-mapper";
import { isMeliCatalogListing, type MeliListingKind } from "./listing-kind";

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
  action: "create" | "update" | "skip";
  skipReason?: string;
  meliCategoryId: string | null;
  hasVariations: boolean;
  isCatalogListing: boolean;
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
  options: { persistImages: boolean; listingKind: MeliListingKind },
  dedupe: SellerDedupeIndex
): Promise<{ kind: "imported" | "updated" | "skipped" }> {
  const itemRes = await meliGetItem(accessToken, itemId);
  if (!itemRes.ok || !(itemRes.data as MeliItemDetail)?.id) {
    const msg = `Publicación HTTP ${itemRes.status}`;
    errors.push(`${itemId}: ${msg}`);
    itemResults.push({ itemId, ok: false, error: msg });
    return { kind: "skipped" };
  }
  const item = itemRes.data as MeliItemDetail;

  if (options.listingKind === "standard" && isMeliCatalogListing(item)) {
    const msg = "Publicación de catálogo ML (omitida; solo estándar)";
    errors.push(`${itemId}: ${msg}`);
    itemResults.push({ itemId: item.id, ok: false, error: msg });
    return { kind: "skipped" };
  }
  if (options.listingKind === "catalog" && !isMeliCatalogListing(item)) {
    const msg = "Publicación estándar (omitida; solo catálogo ML)";
    errors.push(`${itemId}: ${msg}`);
    itemResults.push({ itemId: item.id, ok: false, error: msg });
    return { kind: "skipped" };
  }

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
      const dupOnUpdate = checkImportDuplicate(
        dedupe,
        core.title,
        core.sku,
        existing.id
      );
      if (dupOnUpdate.duplicate) {
        const msg = dupOnUpdate.reason;
        errors.push(`${itemId}: ${msg}`);
        itemResults.push({ itemId: item.id, ok: false, error: msg });
        return { kind: "skipped" };
      }

      await prisma.product.update({
        where: { id: existing.id },
        data: productData,
      });
      productId = existing.id;
      registerProductInDedupeIndex(dedupe, productId, core.title, core.sku);
      await syncProductImages(productId, core.pictureUrls, core.title, options.persistImages);
      await syncProductAttributes(productId, item);
      await syncProductVariations(productId, item);
      itemResults.push({ itemId: item.id, ok: true, productId });
      return { kind: "updated" };
    }

    const dup = checkImportDuplicate(dedupe, core.title, core.sku);
    if (dup.duplicate) {
      const msg = dup.reason;
      errors.push(`${itemId}: ${msg}`);
      itemResults.push({ itemId: item.id, ok: false, error: msg });
      return { kind: "skipped" };
    }

    const created = await prisma.product.create({
      data: {
        sellerId: prismaUserId,
        meliItemId: item.id,
        ...productData,
      },
    });
    productId = created.id;
    registerProductInDedupeIndex(dedupe, productId, core.title, core.sku);
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

const MELI_IMPORT_CONCURRENCY = 4;

function tallyImportResult(
  r: { kind: "imported" | "updated" | "skipped" },
  counts: { imported: number; updated: number; skipped: number }
): void {
  if (r.kind === "imported") counts.imported++;
  if (r.kind === "updated") counts.updated++;
  if (r.kind === "skipped") counts.skipped++;
}

export async function listMeliItemIdsForUser(
  accessToken: string,
  meliUserId: string,
  options?: { maxPages?: number; listingKind?: MeliListingKind; importAll?: boolean }
): Promise<MeliCollectItemsResult & { listingKind: MeliListingKind }> {
  const listingKind = options?.listingKind ?? "standard";
  const maxPages = resolveMeliScrollMaxPages(options?.maxPages, { importAll: options?.importAll });
  const collected = await collectMeliItemIds(accessToken, meliUserId, listingKind, maxPages);
  return { ...collected, listingKind };
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
    /** standard = solo tradicionales (catalog_listing=false en ML) */
    listingKind?: MeliListingKind;
    importAll?: boolean;
    concurrency?: number;
  }
): Promise<{
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
  itemResults: MeliImportItemResult[];
  totalListed?: number;
  pagesScanned?: number;
}> {
  const persistImages = options?.persistImages !== false;
  const listingKind = options?.listingKind ?? "all";
  const concurrency = Math.min(Math.max(options?.concurrency ?? MELI_IMPORT_CONCURRENCY, 1), 8);

  const sellerProducts = await prisma.product.findMany({
    where: { sellerId: prismaUserId },
    select: { id: true, title: true, sku: true },
  });
  const dedupe = createSellerDedupeIndex(sellerProducts);

  const errors: string[] = [];
  const itemResults: MeliImportItemResult[] = [];
  const counts = { imported: 0, updated: 0, skipped: 0 };

  let idsToImport = options?.itemIds?.length
    ? [...new Set(options.itemIds.map((x) => String(x).trim()).filter(Boolean))]
    : null;

  let pagesScanned: number | undefined;
  let totalListed: number | undefined;

  if (!idsToImport?.length) {
    const maxPages = resolveMeliScrollMaxPages(options?.maxPages, { importAll: options?.importAll });
    const collected = await collectMeliItemIds(accessToken, meliUserId, listingKind, maxPages);
    pagesScanned = collected.pages;
    totalListed = collected.ids.length;
    errors.push(...collected.warnings);
    idsToImport = collected.ids;
  }

  if (!idsToImport.length) {
    return { ...counts, errors, itemResults, totalListed: 0, pagesScanned };
  }

  const results = await runPool(idsToImport, concurrency, (itemId) =>
    importSingleMeliItem(
      prismaUserId,
      meliOAuthAccountId,
      accessToken,
      itemId,
      errors,
      itemResults,
      { persistImages, listingKind },
      dedupe
    )
  );

  for (const r of results) tallyImportResult(r, counts);

  return { ...counts, errors, itemResults, totalListed, pagesScanned };
}

async function countLinkedMeliIds(
  prismaUserId: string,
  meliIds: string[]
): Promise<{ alreadyLinked: number; existingMap: Map<string, { id: string; meliItemId: string | null; price: number; stock: number; sku: string | null; title: string }> }> {
  const existingMap = new Map<
    string,
    { id: string; meliItemId: string | null; price: number; stock: number; sku: string | null; title: string }
  >();
  const CHUNK = 400;
  for (let i = 0; i < meliIds.length; i += CHUNK) {
    const chunk = meliIds.slice(i, i + CHUNK);
    const rows = await prisma.product.findMany({
      where: { sellerId: prismaUserId, meliItemId: { in: chunk } },
      select: { id: true, meliItemId: true, price: true, stock: true, sku: true, title: true },
    });
    for (const r of rows) {
      if (r.meliItemId) existingMap.set(r.meliItemId, r);
    }
  }
  return { alreadyLinked: existingMap.size, existingMap };
}

export async function previewMeliItemsForUser(
  prismaUserId: string,
  accessToken: string,
  meliUserId: string,
  options?: {
    maxPages?: number;
    sampleSize?: number;
    listingKind?: MeliListingKind;
    importAll?: boolean;
  }
): Promise<{
  totalFound: number;
  uniqueFound: number;
  pagingTotal: number | null;
  pagesScanned: number;
  alreadyLinked: number;
  toCreate: number;
  toUpdate: number;
  skippedDuplicates: number;
  breakdown: {
    byStatus: Record<string, number>;
    byCondition: Record<string, number>;
    byListingType: Record<string, number>;
  };
  rows: MeliImportPreviewRow[];
  samples: MeliImportPreviewRow[];
  warnings: string[];
  allItemIds?: string[];
}> {
  const maxPages = resolveMeliScrollMaxPages(options?.maxPages, { importAll: options?.importAll });
  const sampleCap = Math.min(Math.max(options?.sampleSize ?? 80, 5), 500);
  const listingKind = options?.listingKind ?? "all";

  const warnings: string[] = [];
  const rows: MeliImportPreviewRow[] = [];

  const byStatus: Record<string, number> = {};
  const byCondition: Record<string, number> = {};
  const byListingType: Record<string, number> = {};
  let skippedDuplicates = 0;

  const sellerProducts = await prisma.product.findMany({
    where: { sellerId: prismaUserId },
    select: { id: true, title: true, sku: true },
  });
  const dedupe = createSellerDedupeIndex(sellerProducts);

  const collected = await collectMeliItemIds(accessToken, meliUserId, listingKind, maxPages);
  warnings.push(...collected.warnings);

  const uniqueIds = collected.ids;
  const totalFound = uniqueIds.length;
  const { alreadyLinked, existingMap } = await countLinkedMeliIds(prismaUserId, uniqueIds);
  let toCreate = Math.max(0, uniqueIds.length - alreadyLinked);
  let toUpdate = alreadyLinked;

  const sampleIds = uniqueIds.slice(0, sampleCap);

  for (const itemId of sampleIds) {
      const itemRes = await meliGetItem(accessToken, itemId);
      if (!itemRes.ok || !(itemRes.data as MeliItemDetail)?.id) {
        warnings.push(`${itemId}: publicación HTTP ${itemRes.status}`);
        continue;
      }
      const item = itemRes.data as MeliItemDetail;
      const catalogListing = isMeliCatalogListing(item);
      if (listingKind === "standard" && catalogListing) {
        skippedDuplicates++;
        continue;
      }
      if (listingKind === "catalog" && !catalogListing) {
        skippedDuplicates++;
        continue;
      }
      const status = (item.status || "unknown").toLowerCase();
      const condition = mapCondition(item.condition);
      const listingType = (item.listing_type_id || "unknown").toLowerCase();

      byStatus[status] = (byStatus[status] || 0) + 1;
      byCondition[condition] = (byCondition[condition] || 0) + 1;
      byListingType[listingType] = (byListingType[listingType] || 0) + 1;

      const exists = existingMap.has(item.id);
      const local = existingMap.get(item.id);
      const sellerSku = extractSellerSku(item) || local?.sku || null;
      const existingProductId = local?.id;

      let action: MeliImportPreviewRow["action"] = exists ? "update" : "create";
      let skipReason: string | undefined;

      if (exists) {
        const dupOnUpdate = checkImportDuplicate(
          dedupe,
          item.title,
          sellerSku,
          existingProductId
        );
        if (dupOnUpdate.duplicate) {
          action = "skip";
          skipReason = dupOnUpdate.reason;
          skippedDuplicates++;
        } else if (existingProductId) {
          registerProductInDedupeIndex(dedupe, existingProductId, item.title, sellerSku);
        }
      } else {
        const dup = checkImportDuplicate(dedupe, item.title, sellerSku);
        if (dup.duplicate) {
          action = "skip";
          skipReason = dup.reason;
          skippedDuplicates++;
        } else {
          registerProductInDedupeIndex(dedupe, `preview-${item.id}`, item.title, sellerSku);
        }
      }

      const pics = item.pictures || [];
      const thumb = pics[0]?.secure_url || pics[0]?.url || null;

      rows.push({
        id: item.id,
        title: item.title,
        thumbnailUrl: thumb,
        meliPrice: primaryPriceFromMeliItem(item),
        meliStock: aggregateStockFromMeliItem(item),
        localPrice: local ? local.price : null,
        localStock: local ? local.stock : null,
        sellerSku,
        status,
        condition,
        listingType,
        sold: Math.max(0, item.sold_quantity ?? 0),
        action,
        skipReason,
        meliCategoryId: item.category_id || null,
        hasVariations: Boolean(item.variations?.length),
        isCatalogListing: catalogListing,
      });
    }

  if (toCreate > 0 && skippedDuplicates > 0) {
    toCreate = Math.max(0, toCreate - skippedDuplicates);
  }

  return {
    totalFound,
    uniqueFound: uniqueIds.length,
    pagingTotal: collected.pagingTotal,
    pagesScanned: collected.pages,
    alreadyLinked,
    toCreate,
    toUpdate,
    skippedDuplicates,
    breakdown: { byStatus, byCondition, byListingType },
    rows,
    samples: rows,
    warnings,
    allItemIds: uniqueIds,
  };
}
