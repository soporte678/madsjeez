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

export async function importMeliItemsForUser(
  prismaUserId: string,
  accessToken: string,
  meliUserId: string,
  options?: { maxPages?: number }
): Promise<{ imported: number; updated: number; errors: string[] }> {
  const maxPages = Math.min(Math.max(options?.maxPages ?? 20, 1), 50);

  let defaultCategory = await prisma.category.findFirst({ where: { slug: "general" } });
  if (!defaultCategory) {
    defaultCategory = await prisma.category.create({
      data: { name: "General", slug: "general", description: "Importación / general" },
    });
  }

  const errors: string[] = [];
  let imported = 0;
  let updated = 0;
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

      try {
        const itemRes = await meliGetItem(accessToken, itemId);
        if (!itemRes.ok || !(itemRes.data as MeliItemDetail)?.id) {
          errors.push(`${itemId}: item HTTP ${itemRes.status}`);
          continue;
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
          updated++;
        } else {
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
              sku: `MELI-${item.id}`,
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
          imported++;
        }
      } catch (e) {
        errors.push(`${itemId}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    if (!scrollId || !ids.length) break;
  }

  return { imported, updated, errors };
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
  samples: Array<{
    id: string;
    title: string;
    price: number;
    status: string;
    condition: string;
    listingType: string;
    stock: number;
    sold: number;
    action: "create" | "update";
  }>;
  warnings: string[];
}> {
  const maxPages = Math.min(Math.max(options?.maxPages ?? 10, 1), 50);
  const sampleSize = Math.min(Math.max(options?.sampleSize ?? 25, 5), 100);

  let scrollId: string | undefined;
  let pages = 0;
  let totalFound = 0;
  const uniqueIds = new Set<string>();
  const warnings: string[] = [];
  const samples: Array<{
    id: string;
    title: string;
    price: number;
    status: string;
    condition: string;
    listingType: string;
    stock: number;
    sold: number;
    action: "create" | "update";
  }> = [];

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
      select: { meliItemId: true },
    });
    const existingSet = new Set(existingRows.map((r) => r.meliItemId).filter(Boolean) as string[]);

    for (const itemId of batchIds) {
      const itemRes = await meliGetItem(accessToken, itemId);
      if (!itemRes.ok || !(itemRes.data as MeliItemDetail)?.id) {
        warnings.push(`${itemId}: item HTTP ${itemRes.status}`);
        continue;
      }
      const item = itemRes.data as MeliItemDetail;
      const status = (item.status || "unknown").toLowerCase();
      const condition = mapCondition(item.condition);
      const listingType = (item.listing_type_id || "unknown").toLowerCase();

      byStatus[status] = (byStatus[status] || 0) + 1;
      byCondition[condition] = (byCondition[condition] || 0) + 1;
      byListingType[listingType] = (byListingType[listingType] || 0) + 1;

      const exists = existingSet.has(item.id);
      if (exists) {
        alreadyLinked++;
        toUpdate++;
      } else {
        toCreate++;
      }

      if (samples.length < sampleSize) {
        samples.push({
          id: item.id,
          title: item.title,
          price: Number(item.price) || 0,
          status,
          condition,
          listingType,
          stock: Math.max(0, item.available_quantity ?? 0),
          sold: Math.max(0, item.sold_quantity ?? 0),
          action: exists ? "update" : "create",
        });
      }
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
    samples,
    warnings,
  };
}
