import type { SubscriptionTier } from "@prisma/client";

export const SELL_DEFAULT_MAX_IMAGES = 5;
/**
 * Política Madsjeez: el marketplace NO cobra comisión sobre ventas.
 * Este valor existe sólo por compatibilidad con campos legacy de DB
 * (marketplace_settings.commission_*). Si querés modelar un cobro futuro,
 * cambialo acá y en /admin/configuracion.
 */
export const SELL_DEFAULT_COMMISSION_PCT = 0;

type CommissionConfig = {
  commissionFree: number;
  commissionPlata: number;
  commissionGold: number;
  commissionPlatinum: number;
} | null;

const MAX_IMAGES_BY_TIER: Record<SubscriptionTier, number> = {
  FREE: 5,
  PLATA: 8,
  GOLD: 12,
  PLATINUM: 20,
};

export function sellMaxImagesForTier(tier: SubscriptionTier): number {
  return MAX_IMAGES_BY_TIER[tier] ?? SELL_DEFAULT_MAX_IMAGES;
}

/**
 * Tope de publicaciones activas que el seller puede tener al mismo tiempo.
 * Política Madsjeez:
 *   FREE     →  50  publicaciones (BÁSICO gratis)
 *   PLATA    → 200  publicaciones (PRO $2.999/mes)
 *   GOLD     → 200  publicaciones (legacy alias = PRO)
 *   PLATINUM → Infinity (ULTRA $4.999/mes — ilimitadas)
 */
const MAX_LISTINGS_BY_TIER: Record<SubscriptionTier, number> = {
  FREE: 50,
  PLATA: 200,
  GOLD: 200,
  PLATINUM: Number.POSITIVE_INFINITY,
};

export function sellMaxListingsForTier(tier: SubscriptionTier): number {
  return MAX_LISTINGS_BY_TIER[tier] ?? 50;
}

export function isUnlimitedListings(tier: SubscriptionTier): boolean {
  return !Number.isFinite(MAX_LISTINGS_BY_TIER[tier]);
}

export function sellCommissionPercentForTier(
  tier: SubscriptionTier,
  config: CommissionConfig
): number {
  if (!config) return SELL_DEFAULT_COMMISSION_PCT;
  const f = (n: number) => Math.round(n * 10000) / 100;
  switch (tier) {
    case "PLATA":
      return f(config.commissionPlata);
    case "GOLD":
      return f(config.commissionGold);
    case "PLATINUM":
      return f(config.commissionPlatinum);
    default:
      return f(config.commissionFree);
  }
}
