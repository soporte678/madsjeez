import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { primaryImageUrlFromRows, hasValidProductImageUrl } from "@/lib/productVisibility";
import { SITE_URL } from "@/lib/seo/site";

const FEED_LIMIT = 5000;

const feedInclude = {
  images: { orderBy: { order: "asc" as const }, take: 1 },
  category: { select: { name: true } },
} satisfies Prisma.ProductInclude;

type FeedProductRow = Prisma.ProductGetPayload<{ include: typeof feedInclude }>;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function conditionGoogle(condition: string): string {
  if (condition === "used") return "used";
  if (condition === "refurbished") return "refurbished";
  return "new";
}

function emptyGoogleShoppingFeedXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>MadsJeez Marketplace — Productos</title>
    <link>${SITE_URL}</link>
    <description>Catálogo MadsJeez para Google Shopping y Merchant Center</description>
  </channel>
</rss>`;
}

/** Railway/Docker: `next build` no tiene DB; evita Prisma (P1001 en host "base"). */
function shouldSkipFeedDb(): boolean {
  if (process.env.NEXT_PHASE === "phase-production-build") return true;
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url) return true;
  return /@base(?::|\/|$)/i.test(url);
}

/** Feed RSS 2.0 + namespace Google Merchant para Merchant Center. */
export async function buildGoogleShoppingFeedXml(): Promise<string> {
  const brand = process.env.GOOGLE_MERCHANT_BRAND || "MadsJeez Marketplace";
  if (shouldSkipFeedDb()) return emptyGoogleShoppingFeedXml();

  let rows: FeedProductRow[] = [];
  try {
    rows = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        images: { some: {} },
      },
      include: feedInclude,
      orderBy: { updatedAt: "desc" },
      take: FEED_LIMIT,
    });
  } catch (err) {
    console.warn("[google-shopping-feed] DB no disponible:", err);
  }

  const items = rows
    .map((p) => {
      const imageLink = primaryImageUrlFromRows(p.images);
      if (!hasValidProductImageUrl(imageLink)) return null;
      const price = `${p.price.toFixed(2)} ARS`;
      const desc =
        p.description?.replace(/<[^>]+>/g, " ").trim().slice(0, 5000) ||
        `Comprá ${p.title} en MadsJeez Marketplace Argentina.`;
      return `
    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.title.slice(0, 150))}</g:title>
      <g:description>${escapeXml(desc)}</g:description>
      <g:link>${escapeXml(`${SITE_URL}/product/${p.id}`)}</g:link>
      <g:image_link>${escapeXml(imageLink!)}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${price}</g:price>
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:condition>${conditionGoogle(p.condition)}</g:condition>
      <g:google_product_category>${escapeXml(p.category?.name || "Otros")}</g:google_product_category>
      ${p.sku ? `<g:mpn>${escapeXml(p.sku)}</g:mpn>` : ""}
    </item>`;
    })
    .filter(Boolean)
    .join("");

  if (items.length === 0) return emptyGoogleShoppingFeedXml();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>MadsJeez Marketplace — Productos</title>
    <link>${SITE_URL}</link>
    <description>Catálogo MadsJeez para Google Shopping y Merchant Center</description>
    ${items}
  </channel>
</rss>`;
}
