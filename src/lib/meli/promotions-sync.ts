import { CampaignStatus, CampaignType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { meliGetSellerPromotions } from "./api";

type MeliPromotionRow = {
  id?: string;
  type?: string;
  status?: string;
  name?: string;
  start_date?: string;
  finish_date?: string;
  benefits?: { meli_percentage?: number; percentage?: number };
  original_price?: number;
};

function mapCampaignType(mlType?: string): CampaignType {
  const t = (mlType || "").toUpperCase();
  if (t.includes("LIGHTNING") || t === "DEAL") return CampaignType.FLASH_SALE;
  if (t.includes("DOD") || t.includes("DAY")) return CampaignType.DAILY_DEAL;
  if (t.includes("VOLUME")) return CampaignType.QUANTITY_DISCOUNT;
  if (t.includes("COUPON")) return CampaignType.COUPON;
  return CampaignType.PRICE_AGREEMENT;
}

function mapCampaignStatus(mlStatus?: string): CampaignStatus {
  const s = (mlStatus || "").toLowerCase();
  if (s === "started" || s === "active") return CampaignStatus.ACTIVE;
  if (s === "pending") return CampaignStatus.PENDING_APPROVAL;
  if (s === "finished" || s === "ended") return CampaignStatus.ENDED;
  if (s === "cancelled") return CampaignStatus.CANCELLED;
  return CampaignStatus.DRAFT;
}

export async function syncMeliPromotionsForUser(
  prismaUserId: string,
  accessToken: string,
  meliUserId: string
): Promise<{ created: number; updated: number; rawCount: number }> {
  const res = await meliGetSellerPromotions(accessToken, meliUserId);
  if (!res.ok) {
    throw new Error(`seller-promotions HTTP ${res.status}`);
  }

  const root = res.data as Record<string, unknown>;
  const rows = Array.isArray(root.results)
    ? (root.results as MeliPromotionRow[])
    : Array.isArray(root.promotions)
      ? (root.promotions as MeliPromotionRow[])
      : Array.isArray(root.data)
        ? (root.data as MeliPromotionRow[])
        : [];

  let created = 0;
  let updated = 0;

  for (const p of rows) {
    const promoId = p.id;
    if (!promoId) continue;

    const name =
      p.name ||
      `Promo Mercado Libre ${p.type || ""}`.trim().slice(0, 120) ||
      `Promo ML ${promoId}`;
    const start = p.start_date ? new Date(p.start_date) : new Date();
    const end = p.finish_date ? new Date(p.finish_date) : new Date(start.getTime() + 7 * 86400000);
    const discountPct =
      p.benefits?.meli_percentage ??
      p.benefits?.percentage ??
      (typeof p.original_price === "number" ? 10 : 10);

    const existing = await prisma.campaign.findFirst({
      where: { sellerId: prismaUserId, meliPromotionId: promoId },
    });

    const data = {
      name,
      description: `Sincronizada desde Mercado Libre. Tipo: ${p.type || "n/d"}. Estado ML: ${p.status || "n/d"}.`,
      type: mapCampaignType(p.type),
      status: mapCampaignStatus(p.status),
      startDate: start,
      endDate: end,
      discountType: "percentage",
      discountValue: Number(discountPct) || 10,
      meliPromotionId: promoId,
    };

    if (existing) {
      await prisma.campaign.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          status: data.status,
          startDate: data.startDate,
          endDate: data.endDate,
          discountType: data.discountType,
          discountValue: data.discountValue,
        },
      });
      updated++;
    } else {
      await prisma.campaign.create({
        data: {
          sellerId: prismaUserId,
          ...data,
        },
      });
      created++;
    }
  }

  return { created, updated, rawCount: rows.length };
}
