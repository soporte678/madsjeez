/**
 * Fixed-window in-memory rate limiter for API routes (single Node process).
 * For multi-instance production, prefer Redis/edge limits; this still blocks casual abuse.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

const MAX_KEYS = 5000;

function prune(now: number) {
  if (store.size <= MAX_KEYS) return;
  for (const [k, b] of store) {
    if (b.resetAt <= now) store.delete(k);
    if (store.size <= MAX_KEYS * 0.8) break;
  }
}

export function clientIpFromRequest(req: { headers: Headers }): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 128);
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 128);
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf.slice(0, 128);
  return "unknown";
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

/**
 * @param key stable id (e.g. `ip:1.2.3.4` or `user:cuid`)
 */
export function checkRateLimit(
  key: string,
  opts: { max: number; windowMs: number; now?: number }
): RateLimitResult {
  const now = opts.now ?? Date.now();
  prune(now);

  let b = store.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 1, resetAt: now + opts.windowMs };
    store.set(key, b);
    return { ok: true };
  }

  b.count += 1;
  if (b.count > opts.max) {
    const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
    return { ok: false, retryAfterSec };
  }
  return { ok: true };
}
