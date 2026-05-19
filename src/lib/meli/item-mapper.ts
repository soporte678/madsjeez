import type { MeliItemDetail } from "./types";

export function mapCondition(raw?: string): string {
  const c = (raw || "").toLowerCase();
  if (c.includes("used") || c === "used") return "used";
  if (c.includes("refurbished") || c.includes("reacondicion")) return "refurbished";
  return "new";
}

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

function attrText(attrs?: MeliItemDetail["attributes"]): string {
  if (!attrs?.length) return "";
  return attrs
    .filter((a) => a.value_name)
    .slice(0, 60)
    .map((a) => `${a.name || a.id}: ${a.value_name}`)
    .join("\n");
}

export function buildDescriptionFromMeliItem(item: MeliItemDetail, plainText?: string): string {
  const fromApi = (plainText || "").trim();
  if (fromApi) return fromApi;
  const fromAttrs = attrText(item.attributes);
  if (fromAttrs) return fromAttrs;
  return item.title;
}

export function pictureUrlsFromMeliItem(item: MeliItemDetail): string[] {
  const pics = item.pictures || [];
  return pics.map((p) => p.secure_url || p.url).filter((u): u is string => Boolean(u));
}

export function aggregateStockFromMeliItem(item: MeliItemDetail): number {
  if (item.variations?.length) {
    return item.variations.reduce((sum, v) => sum + Math.max(0, v.available_quantity ?? 0), 0);
  }
  return Math.max(0, item.available_quantity ?? 0);
}

export function primaryPriceFromMeliItem(item: MeliItemDetail): number {
  if (item.variations?.length) {
    const prices = item.variations
      .map((v) => Number(v.price))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (prices.length) return Math.min(...prices);
  }
  return Number(item.price) || 0;
}

export function meliItemIsActive(item: MeliItemDetail): boolean {
  const status = (item.status || "").toLowerCase();
  if (status === "closed" || status === "inactive") return false;
  const st = aggregateStockFromMeliItem(item);
  return st > 0 || status === "active" || status === "paused";
}

export function mapMeliItemToProductCore(item: MeliItemDetail, description: string) {
  const sellerSku = extractSellerSku(item);
  const stock = aggregateStockFromMeliItem(item);
  const original =
    item.original_price != null && Number(item.original_price) > 0 ? Number(item.original_price) : null;

  return {
    title: item.title,
    description,
    price: primaryPriceFromMeliItem(item),
    stock,
    sales: Math.max(0, item.sold_quantity ?? 0),
    condition: mapCondition(item.condition),
    freeShipping: Boolean(item.shipping?.free_shipping),
    originalPrice: original,
    sku: sellerSku || `MELI-${item.id}`,
    meliCategoryId: item.category_id || null,
    meliListingTypeId: item.listing_type_id || null,
    meliStatus: item.status || null,
    meliPermalink: item.permalink || null,
    meliCurrencyId: item.currency_id || "ARS",
    meliPayload: item as object,
    isActive: meliItemIsActive(item),
    hasVideo: Boolean(item.video_id),
    pictureUrls: pictureUrlsFromMeliItem(item),
  };
}
