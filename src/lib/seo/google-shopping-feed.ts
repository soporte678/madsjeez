import { prisma } from "@/lib/prisma";
import { primaryImageUrlFromRows, hasValidProductImageUrl } from "@/lib/productVisibility";
import { SITE_URL } from "@/lib/seo/site";

const FEED_LIMIT = 5000;

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

/** Feed RSS 2.0 + namespace Google Merchant para Merchant Center. */
export async function buildGoogleShoppingFeedXml(): Promise<string> {
  const brand = process.env.GOOGLE_MERCHANT_BRAND || "MadsJeez Marketplace";

  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      images: { some: {} },
    },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      category: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: FEED_LIMIT,
  });

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
