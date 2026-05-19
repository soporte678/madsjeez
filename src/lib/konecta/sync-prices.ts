import { prisma } from "@/lib/prisma";
import catalogData from "@/data/konecta-catalog-abril-2026.json";
import {
  buildCatalogIndexes,
  findCatalogMatch,
  salePriceFromCost,
  type KonectaCatalogItem,
} from "@/lib/konecta/catalog";

const SELLER_EMAIL = "vianferreteria@gmail.com";

export type KonectaPriceSyncResult = {
  seller: string;
  catalogItems: number;
  productsTotal: number;
  updated: number;
  skipped: number;
  markup: number;
  dryRun: boolean;
  unmatched: { id: string; title: string; sku: string | null }[];
};

export async function syncKonectaPrices(options?: {
  dryRun?: boolean;
  markup?: number;
  catalog?: KonectaCatalogItem[];
}): Promise<KonectaPriceSyncResult> {
  const dryRun = options?.dryRun ?? false;
  const markup = options?.markup ?? 1.5;
  const catalog = options?.catalog ?? (catalogData as KonectaCatalogItem[]);
  const indexes = buildCatalogIndexes(catalog);

  const seller = await prisma.user.findUnique({
    where: { email: SELLER_EMAIL },
    select: { id: true },
  });
  if (!seller) {
    throw new Error(`Vendedor no encontrado: ${SELLER_EMAIL}`);
  }

  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    select: {
      id: true,
      title: true,
      sku: true,
      price: true,
      description: true,
      attributes: { select: { name: true, value: true } },
    },
  });

  let updated = 0;
  let skipped = 0;
  const unmatched: KonectaPriceSyncResult["unmatched"] = [];

  for (const product of products) {
    const attrText = product.attributes.map((a) => `${a.name} ${a.value}`).join(" ");
    const match = findCatalogMatch(
      {
        title: product.title,
        sku: product.sku,
        description: product.description,
        attrText,
      },
      catalog,
      indexes
    );

    if (!match) {
      skipped++;
      unmatched.push({ id: product.id, title: product.title, sku: product.sku });
      continue;
    }

    const newPrice = salePriceFromCost(match.cost, markup);
    const newCompare = match.cost;

    if (!dryRun) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          price: newPrice,
          comparePrice: newCompare,
          originalPrice: newCompare,
        },
      });
    }
    updated++;
  }

  return {
    seller: SELLER_EMAIL,
    catalogItems: catalog.length,
    productsTotal: products.length,
    updated,
    skipped,
    markup,
    dryRun,
    unmatched: unmatched.slice(0, 200),
  };
}
