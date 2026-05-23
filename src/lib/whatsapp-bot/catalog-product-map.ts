import type { Prisma } from "@prisma/client";

export type CatalogProductHit = {
  id: string;
  title: string;
  price: number;
  stock: number;
  freeShipping: boolean;
  sku: string | null;
  category: string | null;
  imageUrl: string | null;
  productUrl: string;
  description: string | null;
};

export type SellerStoreMeta = {
  sellerName: string;
  storeSlug: string | null;
  storeUrl: string | null;
  sellerImageUrl: string | null;
  description: string | null;
};

export const catalogProductSelect = {
  id: true,
  title: true,
  price: true,
  stock: true,
  freeShipping: true,
  sku: true,
  description: true,
  isActive: true,
  category: { select: { name: true } },
  images: { orderBy: { order: "asc" as const }, take: 1, select: { url: true } },
  attributes: {
    where: { name: "whatsapp_keywords" },
    take: 1,
    select: { value: true },
  },
} satisfies Prisma.ProductSelect;

export type CatalogProductRow = Prisma.ProductGetPayload<{ select: typeof catalogProductSelect }>;

export function productUrl(appBase: string, productId: string): string {
  return `${appBase.replace(/\/$/, "")}/product/${productId}`;
}

export function mapProductRowToHit(row: CatalogProductRow, appBase: string): CatalogProductHit {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    stock: row.stock,
    freeShipping: row.freeShipping,
    sku: row.sku,
    category: row.category?.name ?? null,
    imageUrl: row.images[0]?.url ?? null,
    productUrl: productUrl(appBase, row.id),
    description: row.description?.slice(0, 280) ?? null,
  };
}

export function formatCatalogHitLine(
  p: Pick<CatalogProductHit, "title" | "price" | "stock"> &
    Partial<Pick<CatalogProductHit, "productUrl" | "freeShipping" | "sku" | "imageUrl">>
): string {
  const stockLabel = p.stock > 0 ? `${p.stock} u.` : "sin stock";
  const ship = p.freeShipping ? "envío gratis" : "envío según pub.";
  const sku = p.sku ? `SKU:${p.sku}` : "";
  const img = p.imageUrl ? `img:${p.imageUrl}` : "";
  return `- ${p.title} | $${Math.round(p.price).toLocaleString("es-AR")} | ${stockLabel} | ${ship} | ${sku}${p.productUrl ? ` | ${p.productUrl}` : ""}${img ? ` | ${img}` : ""}`.trim();
}

export function formatCompactCatalogIndex(products: CatalogProductHit[], maxChars = 14_000): string {
  if (!products.length) return "CATÁLOGO COMPLETO: (sin publicaciones activas)";
  const header = `CATÁLOGO COMPLETO (${products.length} publicaciones activas del marketplace — usá SOLO estos datos):`;
  const lines: string[] = [header];
  let used = header.length;
  let included = 0;
  for (const p of products) {
    const line = formatCatalogHitLine(p);
    if (used + line.length + 1 > maxChars) break;
    lines.push(line);
    used += line.length + 1;
    included += 1;
  }
  if (included < products.length) {
    lines.push(
      `… y ${products.length - included} publicaciones más en la tienda. Pedí título/SKU/marca para acotar.`
    );
  }
  return lines.join("\n");
}

export function formatRelevantCatalogHits(products: CatalogProductHit[]): string {
  if (!products.length) return "COINCIDENCIAS CON EL MENSAJE: (ninguna — consultá el catálogo completo arriba)";
  return [
    "COINCIDENCIAS CON EL MENSAJE (priorizá estas si aplican):",
    ...products.map((p) => formatCatalogHitLine(p)),
  ].join("\n");
}
