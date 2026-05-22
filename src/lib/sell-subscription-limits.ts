import type { SubscriptionTier } from "@prisma/client";

/**
 * Límites de publicación en /sell (API + UI).
 * Deben coincidir con `subscription_tiers.max_images_per_product` (supabase/migrations/004_seed_data.sql).
 */
const MAX_IMAGES_BY_TIER: Record<SubscriptionTier, number> = {
  FREE: 5,
  PLATA: 10,
  GOLD: 15,
  PLATINUM: 20,
};

export function sellMaxImagesForTier(tier: SubscriptionTier): number {
  return MAX_IMAGES_BY_TIER[tier] ?? MAX_IMAGES_BY_TIER.FREE;
}
