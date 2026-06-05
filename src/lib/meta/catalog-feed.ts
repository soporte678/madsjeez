import { prisma } from "@/lib/prisma";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar").replace(/\/$/, "");
const FEED_PRODUCT_LIMIT = 5000;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

type FeedProduct = {
  id: string;
  title: string;
  description: string;
  priceArs: number;
  salePriceArs: number | null;
  stock: number;
  condition: "new" | "used" | "refurbished";
  imageUrl: string | null;
  brand: string;
  category: string;
};

const conditionMap: Record<string, FeedProduct["condition"]> = {
  new: "new",
  used: "used",
  refurbished: "refurbished",
};

async function loadActiveProducts(): Promise<FeedProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
    },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      comparePrice: true,
      stock: true,
      condition: true,
      images: { select: { url: true }, orderBy: { order: "asc" }, take: 1 },
      seller: { select: { name: true, sellerName: true } },
      category: { select: { name: true } },
    },
    take: FEED_PRODUCT_LIMIT,
    orderBy: { updatedAt: "desc" },
  });

  return products.map((p) => {
    const priceArs = Number(p.price);
    const comparePrice = p.comparePrice != null ? Number(p.comparePrice) : null;
    // Meta convention: `price` is the original, `sale_price` is the discounted one.
    // Our model stores `comparePrice` as the "before" price. So sale_price = price when comparePrice > price.
    const salePriceArs = comparePrice != null && comparePrice > priceArs ? priceArs : null;
    return {
      id: p.id,
      title: (p.title || "Producto").slice(0, 150),
      description: stripHtml(p.description || p.title || "Producto").slice(0, 5000) || "Producto",
      priceArs: comparePrice != null && comparePrice > priceArs ? comparePrice : priceArs,
      salePriceArs,
      stock: p.stock,
      condition: conditionMap[p.condition] || "new",
      imageUrl: p.images[0]?.url ?? null,
      brand: (p.seller?.sellerName || p.seller?.name || "MadsJeez").slice(0, 70),
      category: (p.category?.name || "General").slice(0, 250),
    };
  });
}

function renderItem(p: FeedProduct): string {
  const link = `${APP_URL}/product/${p.id}`;
  const availability = p.stock > 0 ? "in stock" : "out of stock";

  const parts: string[] = [
    "    <item>",
    `      <g:id>${escapeXml(p.id)}</g:id>`,
    `      <g:title>${escapeXml(p.title)}</g:title>`,
    `      <g:description>${escapeXml(p.description)}</g:description>`,
    `      <g:link>${escapeXml(link)}</g:link>`,
  ];
  if (p.imageUrl) {
    parts.push(`      <g:image_link>${escapeXml(p.imageUrl)}</g:image_link>`);
  }
  parts.push(
    `      <g:availability>${availability}</g:availability>`,
    `      <g:price>${p.priceArs.toFixed(2)} ARS</g:price>`,
  );
  if (p.salePriceArs != null) {
    parts.push(`      <g:sale_price>${p.salePriceArs.toFixed(2)} ARS</g:sale_price>`);
  }
  parts.push(
    `      <g:condition>${p.condition}</g:condition>`,
    `      <g:brand>${escapeXml(p.brand)}</g:brand>`,
    `      <g:google_product_category>${escapeXml(p.category)}</g:google_product_category>`,
    `      <g:identifier_exists>false</g:identifier_exists>`,
    "    </item>",
  );
  return parts.join("\n");
}

export async function generateMetaCatalogFeed(): Promise<string> {
  const products = await loadActiveProducts();
  // Meta requires image_link — silently skip products without any image
  const items = products.filter((p) => p.imageUrl).map(renderItem).join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">`,
    `  <channel>`,
    `    <title>MadsJeez Marketplace</title>`,
    `    <link>${escapeXml(APP_URL)}</link>`,
    `    <description>Catalogo de productos del marketplace MadsJeez</description>`,
    items,
    `  </channel>`,
    `</rss>`,
  ].join("\n");
}
