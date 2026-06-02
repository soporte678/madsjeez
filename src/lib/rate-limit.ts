/**
 * Rate-limiting en memoria para API routes (single Node process).
 *
 * Para producción multi-instancia, migrar a Redis/edge limits. Esto bloquea
 * abuso casual y es suficiente para el deploy actual.
 *
 * Exporta tres APIs históricas, todas respaldadas por el mismo Map:
 *  - `rateLimit(id, max, windowMs)` → `{ allowed, retryAfter }` (legacy)
 *  - `checkRateLimit(key, opts)`    → `{ ok } | { ok:false, retryAfterSec }`
 *  - `simpleRateLimit(key, max, win)` → `{ ok } | { ok:false, retryAfterMs }`
 *
 * Más utilidades:
 *  - `clientIpFromRequest(req)` extrae la IP del cliente honrando proxies.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const MAX_KEYS = 5000;

function prune(now: number) {
  if (rateLimitMap.size <= MAX_KEYS) return;
  for (const [k, b] of rateLimitMap) {
    if (b.resetTime <= now) rateLimitMap.delete(k);
    if (rateLimitMap.size <= MAX_KEYS * 0.8) break;
  }
}

// ─── Legacy API ──────────────────────────────────────────────────────────────

export function rateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 60 * 1000
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  prune(now);
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

// ─── checkRateLimit API (ex rate-limit-memory.ts) ────────────────────────────

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export function checkRateLimit(
  key: string,
  opts: { max: number; windowMs: number; now?: number }
): RateLimitResult {
  const now = opts.now ?? Date.now();
  prune(now);

  let b = rateLimitMap.get(key);
  if (!b || now >= b.resetTime) {
    b = { count: 1, resetTime: now + opts.windowMs };
    rateLimitMap.set(key, b);
    return { ok: true };
  }

  b.count += 1;
  if (b.count > opts.max) {
    const retryAfterSec = Math.max(1, Math.ceil((b.resetTime - now) / 1000));
    return { ok: false, retryAfterSec };
  }
  return { ok: true };
}

// ─── simpleRateLimit API (ex simple-rate-limit.ts) ───────────────────────────

export function simpleRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterMs: number } {
  const result = checkRateLimit(key, { max: maxRequests, windowMs });
  if (result.ok) return { ok: true };
  return { ok: false, retryAfterMs: result.retryAfterSec * 1000 };
}

// ─── IP helper ───────────────────────────────────────────────────────────────

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

// Limpieza periódica cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);
