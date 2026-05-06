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
