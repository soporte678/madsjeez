import { createHash } from "crypto";

/**
 * SHA-256 hash a string for Meta CAPI user_data (em, fn, ln, ct, st, zp, country, external_id).
 * Lowercases + trims first per Meta spec.
 * Returns null for empty/invalid inputs (caller can spread-skip).
 */
export function hashForMeta(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Hash a phone number for Meta CAPI user_data.ph.
 * Meta expects digits only, no plus sign or punctuation, then SHA-256.
 */
export function hashPhoneForMeta(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digitsOnly = String(phone).replace(/\D+/g, "");
  if (!digitsOnly) return null;
  return createHash("sha256").update(digitsOnly).digest("hex");
}
