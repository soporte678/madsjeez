import type { Prisma } from "@prisma/client";
import type { GoogleMerchantConfig } from "./config";
import { primaryImageUrlFromRows, hasValidProductImageUrl } from "@/lib/productVisibility";

const productInclude = {
  images: { orderBy: { order: "asc" as const }, take: 1 },
  category: { select: { name: true } },
} satisfies Prisma.ProductInclude;

export type MerchantCatalogProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export function merchantProductId(
  offerId: string,
  config: Pick<GoogleMerchantConfig, "channel" | "contentLanguage" | "targetCountry">
): string {
  return `${config.channel}:${config.contentLanguage}:${config.targetCountry}:${offerId}`;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function conditionGoogle(condition: string): string {
  if (condition === "used") return "used";
  if (condition === "refurbished") return "refurbished";
  return "new";
}

export function mapProductToGoogleContent(
  p: MerchantCatalogProduct,
  config: GoogleMerchantConfig
): Record<string, unknown> | null {
  const imageLink = primaryImageUrlFromRows(p.images);
  if (!hasValidProductImageUrl(imageLink)) return null;

  const description =
    stripHtml(p.description || "").slice(0, 5000) ||
    `Comprá ${p.title} en MadsJeez Marketplace Argentina.`;

  const product: Record<string, unknown> = {
    offerId: p.id,
    title: p.title.slice(0, 150),
    description,
    link: `${config.siteUrl}/product/${p.id}`,
    imageLink: imageLink!,
    contentLanguage: config.contentLanguage,
    targetCountry: config.targetCountry,
    channel: config.channel,
    availability: p.stock > 0 ? "in stock" : "out of stock",
    condition: conditionGoogle(p.condition),
    price: {
      value: p.price.toFixed(2),
      currency: "ARS",
    },
    brand: config.brand,
    googleProductCategory: p.category?.name || "Otros",
  };

  if (p.sku?.trim()) {
    product.mpn = p.sku.trim().slice(0, 70);
  }

  return product;
}

export { productInclude };
