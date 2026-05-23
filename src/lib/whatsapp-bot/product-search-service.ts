import { prisma } from "@/lib/prisma";
import {
  catalogProductSelect,
  mapProductRowToHit,
  type CatalogProductHit,
  type SellerStoreMeta,
} from "./catalog-product-map";

export type { CatalogProductHit };

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 8);
}

export async function getSellerStoreMeta(sellerId: string, appBase: string): Promise<SellerStoreMeta> {
  const user = await prisma.user.findUnique({
    where: { id: sellerId },
    select: {
      sellerName: true,
      name: true,
      storeSlug: true,
      sellerDescription: true,
      image: true,
    },
  });
  const base = appBase.replace(/\/$/, "");
  const storeSlug = user?.storeSlug ?? null;
  return {
    sellerName: user?.sellerName || user?.name || "la tienda",
    storeSlug,
    storeUrl: storeSlug ? `${base}/tienda/${storeSlug}` : null,
    sellerImageUrl: user?.image ?? null,
    description: user?.sellerDescription ?? null,
  };
}

/** Todas las publicaciones activas del vendedor en el marketplace (sin límite artificial). */
export async function listAllActiveSellerProducts(
  sellerId: string,
  appBase: string
): Promise<CatalogProductHit[]> {
  const rows = await prisma.product.findMany({
    where: { sellerId, isActive: true },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    select: catalogProductSelect,
  });
  return rows.map((row) => mapProductRowToHit(row, appBase));
}

export async function searchSellerProducts(
  sellerId: string,
  customerMessage: string,
  appBase: string,
  limit = 12
): Promise<CatalogProductHit[]> {
  const terms = tokenize(customerMessage);
  const whereBase = {
    sellerId,
    isActive: true,
  };

  if (terms.length === 0) {
    const recent = await prisma.product.findMany({
      where: whereBase,
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: catalogProductSelect,
    });
    return recent.map((row) => mapProductRowToHit(row, appBase));
  }

  const or = terms.flatMap((t) => [
    { title: { contains: t, mode: "insensitive" as const } },
    { sku: { contains: t, mode: "insensitive" as const } },
    { description: { contains: t, mode: "insensitive" as const } },
  ]);

  const products = await prisma.product.findMany({
    where: { ...whereBase, OR: or },
    take: Math.max(limit * 3, 30),
    select: catalogProductSelect,
  });

  const scored = products
    .map((p) => {
      const title = p.title.toLowerCase();
      const desc = p.description.toLowerCase();
      const sku = (p.sku ?? "").toLowerCase();
      const kw = (p.attributes[0]?.value ?? "").toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (title.includes(t)) score += 3;
        if (sku.includes(t)) score += 4;
        if (desc.includes(t)) score += 1;
        if (kw.includes(t)) score += 5;
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const list = scored.length > 0 ? scored.map((s) => s.p) : products.slice(0, limit);

  return list.map((row) => mapProductRowToHit(row, appBase));
}
