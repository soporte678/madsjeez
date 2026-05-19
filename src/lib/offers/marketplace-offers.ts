import { CampaignType, type Campaign, type Product, type User, type Category, type ProductImage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { firstProductImageUrl, hasValidProductImageUrl } from "@/lib/productVisibility";
import {
  getActiveSeasonalEvents,
  matchSeasonalEventForText,
  type SeasonalEvent,
  type SeasonalEventSlug,
} from "@/lib/offers/seasonal-events";
import { isValidFlashSaleWindow } from "@/lib/offers/flash-sales";

export type MarketplaceOfferDto = {
  id: string;
  title: string;
  price: number;
  original_price: number;
  discount_percentage: number;
  badge: string;
  badge_color: string;
  image: string;
  seller: {
    id: string;
    full_name: string;
    reputation: string;
  };
  category: {
    name: string;
    slug: string;
  };
  shipping: string;
  rating: number;
  reviews_count: number;
  installments: string;
  promotion_source: "seller_campaign" | "seller_discount" | "seasonal";
  promotion_name: string | null;
  campaign_id: string | null;
  campaign_type: string | null;
  seasonal_event: SeasonalEventSlug | null;
  ends_at: string | null;
  starts_at: string | null;
  is_flash_sale: boolean;
  isDemo: false;
};

type ProductWithRelations = Product & {
  images: ProductImage[];
  category: Category;
  seller: Pick<User, "id" | "sellerName" | "name" | "reputationColor">;
  reviews: { rating: number }[];
};

type CampaignWithProducts = Campaign & {
  products: {
    discountOverride: number | null;
    product: ProductWithRelations;
  }[];
};

export type GetMarketplaceOffersOptions = {
  search?: string | null;
  category?: string | null;
  event?: string | null;
  minDiscount?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  freeShipping?: boolean;
  flash?: boolean;
  /** Solo ofertas relámpago de vendedores (FLASH_SALE activas en ventana corta). */
  flashRelampagoOnly?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
};

function avgRating(reviews: { rating: number }[]): number {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

function resolveListAndSalePrice(
  product: Product,
  discountType: string,
  discountValue: number,
  discountOverride?: number | null
): { list: number; sale: number } {
  const baseList =
    product.comparePrice && product.comparePrice > 0
      ? product.comparePrice
      : product.originalPrice && product.originalPrice > 0
        ? product.originalPrice
        : product.price;

  const pct = discountOverride ?? discountValue;

  if (product.comparePrice && product.comparePrice > product.price) {
    return { list: product.comparePrice, sale: product.price };
  }

  if (discountType === "fixed") {
    const sale = Math.max(0, baseList - pct);
    return { list: baseList, sale };
  }

  const sale = Math.round(baseList * (1 - pct / 100));
  return { list: baseList, sale: Math.min(sale, baseList - 1) };
}

function badgeForCampaignType(type: CampaignType): { badge: string; color: string } {
  switch (type) {
    case CampaignType.FLASH_SALE:
      return { badge: "OFERTA RELÁMPAGO", color: "flash" };
    case CampaignType.DAILY_DEAL:
      return { badge: "DESTACADO HOY", color: "day" };
    case CampaignType.QUANTITY_DISCOUNT:
      return { badge: "POR CANTIDAD", color: "top" };
    case CampaignType.COUPON:
      return { badge: "CUPÓN VENDEDOR", color: "day" };
    default:
      return { badge: "PROMO VENDEDOR", color: "hot" };
  }
}

function applySeasonalBadge(
  offer: Pick<MarketplaceOfferDto, "badge" | "badge_color" | "seasonal_event" | "promotion_name">,
  campaignName: string | null,
  discountPct: number,
  activeSeasonal: SeasonalEvent[]
): void {
  const fromText = campaignName ? matchSeasonalEventForText(campaignName) : null;
  const primary = fromText ?? activeSeasonal[0] ?? null;

  if (primary && discountPct >= 15) {
    offer.badge = primary.badge;
    offer.badge_color = primary.badgeColor;
    offer.seasonal_event = primary.slug;
    if (!offer.promotion_name) offer.promotion_name = primary.name;
  }
}

function mapProductToOffer(
  product: ProductWithRelations,
  pricing: { list: number; sale: number },
  meta: {
    promotion_source: MarketplaceOfferDto["promotion_source"];
    promotion_name: string | null;
    campaign_id: string | null;
    campaign_type: string | null;
    ends_at: Date | null;
    starts_at: Date | null;
    badge: string;
    badge_color: string;
    seasonal_event: SeasonalEventSlug | null;
  }
): MarketplaceOfferDto | null {
  const image = firstProductImageUrl(product);
  if (!hasValidProductImageUrl(image)) return null;
  if (pricing.list <= pricing.sale || pricing.sale <= 0) return null;

  const discountPct = Math.round(((pricing.list - pricing.sale) / pricing.list) * 100);

  return {
    id: product.id,
    title: product.title,
    price: pricing.sale,
    original_price: pricing.list,
    discount_percentage: discountPct,
    badge: meta.badge,
    badge_color: meta.badge_color,
    image: image!,
    seller: {
      id: product.seller.id,
      full_name: product.seller.sellerName || product.seller.name || "Vendedor",
      reputation: product.seller.reputationColor || "silver",
    },
    category: {
      name: product.category.name,
      slug: product.category.slug,
    },
    shipping: product.freeShipping ? "free" : "paid",
    rating: Math.round(avgRating(product.reviews) * 10) / 10,
    reviews_count: product.reviews.length,
    installments: `6 cuotas de $${Math.round(pricing.sale / 6).toLocaleString("es-AR")}`,
    promotion_source: meta.promotion_source,
    promotion_name: meta.promotion_name,
    campaign_id: meta.campaign_id,
    campaign_type: meta.campaign_type,
    seasonal_event: meta.seasonal_event,
    ends_at: meta.ends_at?.toISOString() ?? null,
    starts_at: meta.starts_at?.toISOString() ?? null,
    is_flash_sale: meta.campaign_type === CampaignType.FLASH_SALE,
    isDemo: false,
  };
}

export async function getMarketplaceOffers(options: GetMarketplaceOffersOptions = {}) {
  const now = new Date();
  const activeSeasonal = getActiveSeasonalEvents(now);
  const minDiscount = options.minDiscount ?? 5;
  const page = options.page ?? 1;
  const limit = options.limit ?? 12;

  const offerMap = new Map<string, MarketplaceOfferDto>();

  const campaigns = (await prisma.campaign.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      products: {
        include: {
          product: {
            include: {
              images: { orderBy: { order: "asc" } },
              category: true,
              seller: {
                select: { id: true, sellerName: true, name: true, reputationColor: true },
              },
              reviews: { select: { rating: true }, take: 100 },
            },
          },
        },
      },
    },
  })) as CampaignWithProducts[];

  for (const campaign of campaigns) {
    if (options.flashRelampagoOnly) {
      if (!isValidFlashSaleWindow(campaign, now)) continue;
    } else if (options.flash && campaign.type !== CampaignType.FLASH_SALE) {
      continue;
    }

    const eventFilter = options.event;
    if (eventFilter && eventFilter !== "flash" && eventFilter !== "all") {
      const seasonal = matchSeasonalEventForText(`${campaign.name} ${campaign.description ?? ""}`);
      if (seasonal?.slug !== eventFilter) continue;
    }

    const typeBadge = badgeForCampaignType(campaign.type);

    for (const row of campaign.products) {
      const product = row.product;
      if (!product.isActive || product.stock <= 0) continue;
      if (options.category && product.category.slug !== options.category) continue;
      if (options.freeShipping && !product.freeShipping) continue;
      if (options.search) {
        const q = options.search.toLowerCase();
        if (
          !product.title.toLowerCase().includes(q) &&
          !product.description.toLowerCase().includes(q)
        ) {
          continue;
        }
      }

      const pricing = resolveListAndSalePrice(
        product,
        campaign.discountType,
        campaign.discountValue,
        row.discountOverride
      );

      if (options.minPrice != null && pricing.sale < options.minPrice) continue;
      if (options.maxPrice != null && pricing.sale > options.maxPrice) continue;

      const offer = mapProductToOffer(product, pricing, {
        promotion_source: "seller_campaign",
        promotion_name: campaign.name,
        campaign_id: campaign.id,
        campaign_type: campaign.type,
        ends_at: campaign.endDate,
        starts_at: campaign.startDate,
        badge: typeBadge.badge,
        badge_color: typeBadge.color,
        seasonal_event: null,
      });

      if (!offer || offer.discount_percentage < minDiscount) continue;

      if (!options.flashRelampagoOnly) {
        applySeasonalBadge(offer, campaign.name, offer.discount_percentage, activeSeasonal);
      }
      offerMap.set(product.id, offer);
    }
  }

  if (options.flashRelampagoOnly) {
    let flashOffers = Array.from(offerMap.values());
    flashOffers.sort((a, b) => {
      const ea = a.ends_at ? new Date(a.ends_at).getTime() : 0;
      const eb = b.ends_at ? new Date(b.ends_at).getTime() : 0;
      return ea - eb;
    });

    const total = flashOffers.length;
    const start = (page - 1) * limit;
    const pageOffers = flashOffers.slice(start, start + limit);

    const categoriesMap = new Map<string, { name: string; slug: string; count: number }>();
    for (const o of flashOffers) {
      const cur = categoriesMap.get(o.category.slug);
      if (cur) cur.count += 1;
      else categoriesMap.set(o.category.slug, { name: o.category.name, slug: o.category.slug, count: 1 });
    }

    return {
      offers: pageOffers,
      total,
      categories: Array.from(categoriesMap.values()),
      activeSeasonalEvents: [],
      stats: {
        total_offers: total,
        flash_relampago: total,
        seller_campaigns: total,
        seller_discounts: 0,
        seasonal_active: [],
        has_real_offers: total > 0,
      },
    };
  }

  const discountedProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      OR: [
        { comparePrice: { not: null } },
        { originalPrice: { not: null } },
      ],
    },
    include: {
      images: { orderBy: { order: "asc" } },
      category: true,
      seller: {
        select: { id: true, sellerName: true, name: true, reputationColor: true },
      },
      reviews: { select: { rating: true }, take: 100 },
    },
  });

  for (const product of discountedProducts as ProductWithRelations[]) {
    if (offerMap.has(product.id)) continue;

    const list = product.comparePrice ?? product.originalPrice ?? 0;
    if (list <= product.price) continue;

    if (options.flash) continue;
    if (options.category && product.category.slug !== options.category) continue;
    if (options.freeShipping && !product.freeShipping) continue;
    if (options.search) {
      const q = options.search.toLowerCase();
      if (
        !product.title.toLowerCase().includes(q) &&
        !product.description.toLowerCase().includes(q)
      ) {
        continue;
      }
    }

    const pricing = { list, sale: product.price };
    if (options.minPrice != null && pricing.sale < options.minPrice) continue;
    if (options.maxPrice != null && pricing.sale > options.maxPrice) continue;

    const offer = mapProductToOffer(product, pricing, {
      promotion_source: "seller_discount",
      promotion_name: "Descuento del vendedor",
      campaign_id: null,
      campaign_type: null,
      ends_at: null,
      starts_at: null,
      badge: pricing.sale / list <= 0.5 ? "SUPER OFERTA" : "OFERTA VENDEDOR",
      badge_color: pricing.sale / list <= 0.5 ? "hot" : "day",
      seasonal_event: null,
    });

    if (!offer || offer.discount_percentage < minDiscount) continue;

    applySeasonalBadge(offer, product.title, offer.discount_percentage, activeSeasonal);

    if (options.event && options.event !== "all" && options.event !== "flash") {
      if (offer.seasonal_event !== options.event) continue;
    }

    offerMap.set(product.id, offer);
  }

  let offers = Array.from(offerMap.values());

  switch (options.sort) {
    case "price_asc":
      offers.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      offers.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      break;
    case "popular":
      offers.sort((a, b) => b.reviews_count - a.reviews_count);
      break;
    case "discount_desc":
    default:
      offers.sort((a, b) => b.discount_percentage - a.discount_percentage);
  }

  const total = offers.length;
  const start = (page - 1) * limit;
  const pageOffers = offers.slice(start, start + limit);

  const categoriesMap = new Map<string, { name: string; slug: string; count: number }>();
  for (const o of offers) {
    const cur = categoriesMap.get(o.category.slug);
    if (cur) cur.count += 1;
    else categoriesMap.set(o.category.slug, { name: o.category.name, slug: o.category.slug, count: 1 });
  }

  return {
    offers: pageOffers,
    total,
    categories: Array.from(categoriesMap.values()),
    activeSeasonalEvents: activeSeasonal.map((e) => ({
      slug: e.slug,
      name: e.name,
      badge: e.badge,
      badgeColor: e.badgeColor,
    })),
    stats: {
      total_offers: total,
      seller_campaigns: offers.filter((o) => o.promotion_source === "seller_campaign").length,
      seller_discounts: offers.filter((o) => o.promotion_source === "seller_discount").length,
      seasonal_active: activeSeasonal.map((e) => e.slug),
      has_real_offers: total > 0,
    },
  };
}
