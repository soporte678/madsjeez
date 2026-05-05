/**
 * Best-effort in-memory rate limit (per server instance).
 * For production at scale, use Redis or edge rate limiting.
 */
const buckets = new Map<string, number[]>();

export function simpleRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  let stamps = buckets.get(key) ?? [];
  stamps = stamps.filter((t) => now - t < windowMs);
  if (stamps.length >= maxRequests) {
    const oldest = stamps[0]!;
    return { ok: false, retryAfterMs: windowMs - (now - oldest) };
  }
  stamps.push(now);
  buckets.set(key, stamps);
  return { ok: true };
}
