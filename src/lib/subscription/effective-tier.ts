/**
 * Cálculo del tier efectivo del seller con soporte de TRIAL 14 días.
 *
 * Reglas:
 * - Si trial_ends_at > now → tier efectivo = "PLATINUM" (todos los beneficios).
 * - Si subscription_expiry > now → tier almacenado.
 * - Si subscription_expiry <= now → vuelve a FREE.
 * - Trial se otorga UNA sola vez (no se renueva en cada signup).
 *
 * Esta función es la única fuente de verdad para enforcement. Cualquier
 * código que limite (publicaciones, imágenes, features) debe llamar a
 * `getEffectiveTier(user)` y NO leer `subscriptionTier` directo.
 */

import type { SubscriptionTier } from "@prisma/client";

export type UserForTier = {
  subscriptionTier: SubscriptionTier;
  subscriptionExpiry: Date | null;
  /** Snake-case porque algunos contextos vienen de Supabase. */
  trialEndsAt?: Date | string | null;
  trial_ends_at?: Date | string | null;
};

export type EffectiveTierResult = {
  tier: SubscriptionTier;
  /** true si está en trial activo (cualquier tier base + beneficios PLATINUM). */
  inTrial: boolean;
  /** ms hasta que termina el trial; null si no hay trial. */
  trialRemainingMs: number | null;
  /** Fecha exacta de fin del trial; null si no hay. */
  trialEndsAt: Date | null;
};

export const TRIAL_DAYS = 14;
export const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getEffectiveTier(user: UserForTier | null | undefined): EffectiveTierResult {
  if (!user) {
    return { tier: "FREE", inTrial: false, trialRemainingMs: null, trialEndsAt: null };
  }

  const now = Date.now();

  const trialEnd = parseDate(user.trialEndsAt ?? user.trial_ends_at);
  if (trialEnd && trialEnd.getTime() > now) {
    return {
      tier: "PLATINUM",
      inTrial: true,
      trialRemainingMs: trialEnd.getTime() - now,
      trialEndsAt: trialEnd,
    };
  }

  // Trial terminado o nunca lo tuvo. Chequear suscripción paga.
  const expiry = parseDate(user.subscriptionExpiry);
  const subActive = expiry == null || expiry.getTime() > now;
  const tier = subActive ? user.subscriptionTier : "FREE";

  return {
    tier,
    inTrial: false,
    trialRemainingMs: null,
    trialEndsAt: trialEnd,
  };
}

/** ¿Puede el seller publicar uno más, dado un count actual? */
export function canPublishMore(
  effectiveTier: SubscriptionTier,
  currentActiveListings: number,
): { allowed: boolean; max: number; remaining: number } {
  const MAX: Record<SubscriptionTier, number> = {
    FREE: 50,
    PLATA: 200,
    GOLD: 200, // legacy alias
    PLATINUM: Number.POSITIVE_INFINITY,
  };
  const max = MAX[effectiveTier] ?? 50;
  const remaining = Number.isFinite(max) ? max - currentActiveListings : Infinity;
  return {
    allowed: currentActiveListings < max,
    max,
    remaining: Math.max(0, remaining),
  };
}
