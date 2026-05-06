import { prisma } from "@/lib/prisma";
import type { MeliItemDetail } from "./api";
import { meliGetItem, meliGetItemDescription, meliSearchUserItems } from "./api";

function mapCondition(raw?: string): string {
  const c = (raw || "").toLowerCase();
  if (c.includes("used") || c === "used") return "used";
  if (c.includes("refurbished") || c.includes("reacondicion")) return "refurbished";
  return "new";
}

function attrText(attrs?: MeliItemDetail["attributes"]): string {
  if (!attrs?.length) return "";
  const lines = attrs
    .filter((a) => a.value_name)
    .slice(0, 40)
    .map((a) => `${a.name || a.id}: ${a.value_name}`);
  return lines.join("\n");
}

/** SKU declarado por el vendedor en ML (atributos habituales). */
export function extractSellerSku(item: MeliItemDetail): string | null {
  const attrs = item.attributes || [];
  const hit = attrs.find(
    (a) =>
      a.id === "SELLER_SKU" ||
      a.id === "SKU" ||
      (a.name || "").toLowerCase().includes("sku")
  );
  const v = hit?.value_name?.trim();
  return v || null;
}

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
};

export type MeliImportItemResult = {
  itemId: string;
  ok: boolean;
  error?: string;
};

async function ensureDefaultCategory() {
  let cat = await prisma.category.findFirst({ where: { slug: "general" } });
  if (!cat) {
    cat = await prisma.category.create({
      data: { name: "General", slug: "general", description: "Importación / general" },
    });
  }
  return cat;
}

async function importSingleMeliItem(
  prismaUserId: string,
  accessToken: string,
  itemId: string,
  errors: string[],
  itemResults: MeliImportItemResult[]
): Promise<{ kind: "imported" | "updated" | "skipped" }> {
  const itemRes = await meliGetItem(accessToken, itemId);
  if (!itemRes.ok || !(itemRes.data as MeliItemDetail)?.id) {
    const msg = `Publicación HTTP ${itemRes.status}`;
    errors.push(`${itemId}: ${msg}`);
    itemResults.push({ itemId, ok: false, error: msg });
    return { kind: "skipped" };
  }
  const item = itemRes.data as MeliItemDetail;

  let description = "";
  const descRes = await meliGetItemDescription(accessToken, itemId);
  if (descRes.ok) {
    const d = descRes.data as { plain_text?: string; text?: string };
    description = (d.plain_text || d.text || "").trim();
  }
  if (!description) {
    description = attrText(item.attributes) || item.title;
  }

  const pics = item.pictures || [];
  const urls = pics.map((p) => p.secure_url || p.url).filter(Boolean) as string[];

  const condition = mapCondition(item.condition);
  const stock = Math.max(0, item.available_quantity ?? 0);
  const soldQty = Math.max(0, item.sold_quantity ?? 0);
  const price = Number(item.price) || 0;
  const freeShipping = Boolean(item.shipping?.free_shipping);
  const sellerSku = extractSellerSku(item);

  try {
    const defaultCategory = await ensureDefaultCategory();
    const existing = await prisma.product.findUnique({
      where: { meliItemId: item.id },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          title: item.title,
          description,
          price,
          stock,
          sales: soldQty,
          condition,
          freeShipping,
          originalPrice: existing.originalPrice,
          isActive: stock > 0,
          ...(sellerSku ? { sku: sellerSku } : {}),
        },
      });
      await prisma.productImage.deleteMany({ where: { productId: existing.id } });
      for (let i = 0; i < urls.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: existing.id,
            url: urls[i],
            alt: item.title,
            order: i,
          },
        });
      }
      itemResults.push({ itemId: item.id, ok: true });
      return { kind: "updated" };
    }

    const created = await prisma.product.create({
      data: {
        sellerId: prismaUserId,
        categoryId: defaultCategory.id,
        title: item.title,
        description,
        price,
        stock,
        sales: soldQty,
        condition,
        meliItemId: item.id,
        freeShipping,
        isActive: stock > 0,
        sku: sellerSku || `MELI-${item.id}`,
      },
    });
    for (let i = 0; i < urls.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: created.id,
          url: urls[i],
          alt: item.title,
          order: i,
        },
      });
    }
    itemResults.push({ itemId: item.id, ok: true });
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
  accessToken: string,
  meliUserId: string,
  options?: { maxPages?: number; itemIds?: string[] }
): Promise<{
  imported: number;
  updated: number;
  errors: string[];
  itemResults: MeliImportItemResult[];
}> {
  const maxPages = Math.min(Math.max(options?.maxPages ?? 20, 1), 50);
  const filterIds = options?.itemIds?.length
    ? [...new Set(options.itemIds.map((x) => String(x).trim()).filter(Boolean))]
    : null;

  const errors: string[] = [];
  const itemResults: MeliImportItemResult[] = [];
  let imported = 0;
  let updated = 0;

  if (filterIds?.length) {
    for (const itemId of filterIds) {
      const r = await importSingleMeliItem(prismaUserId, accessToken, itemId, errors, itemResults);
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

    const payload = search.data as {
      results?: string[];
      scroll_id?: string;
    };
    const ids = payload.results || [];
    scrollId = payload.scroll_id;
    pages++;

    if (!ids.length) break;

    for (const itemId of ids) {
      if (seenIds.has(itemId)) continue;
      seenIds.add(itemId);

      const r = await importSingleMeliItem(prismaUserId, accessToken, itemId, errors, itemResults);
      if (r.kind === "imported") imported++;
      if (r.kind === "updated") updated++;
    }

    if (!scrollId || !ids.length) break;
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
  /** Todas las filas leídas en el barrido (para tabla paginada en UI). */
  rows: MeliImportPreviewRow[];
  /** Primeras N filas (compatibilidad). */
  samples: MeliImportPreviewRow[];
  warnings: string[];
}> {
  const maxPages = Math.min(Math.max(options?.maxPages ?? 10, 1), 50);
  const sampleCap = Math.min(Math.max(options?.sampleSize ?? 25, 5), 500);

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
      const meliPrice = Number(item.price) || 0;
      const meliStock = Math.max(0, item.available_quantity ?? 0);

      rows.push({
        id: item.id,
        title: item.title,
        thumbnailUrl: thumb,
        meliPrice,
        meliStock,
        localPrice: local ? local.price : null,
        localStock: local ? local.stock : null,
        sellerSku: extractSellerSku(item) || local?.sku || null,
        status,
        condition,
        listingType,
        sold: Math.max(0, item.sold_quantity ?? 0),
        action: exists ? "update" : "create",
      });
    }

    if (!scrollId) break;
  }

  const samples = rows.slice(0, sampleCap);

  return {
    totalFound,
    uniqueFound: uniqueIds.size,
    alreadyLinked,
    toCreate,
    toUpdate,
    breakdown: { byStatus, byCondition, byListingType },
    rows,
    samples,
    warnings,
  };
}
