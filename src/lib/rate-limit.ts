/**
 * Rate-limiting con soporte Redis (Upstash) + fallback en memoria.
 *
 * Si UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN están configurados,
 * usa Redis (funciona en multi-instancia / Railway con autoscaling).
 * Si no, usa un Map en memoria (suficiente para instancia única).
 *
 * Para activar Redis:
 *   1. Crear DB en https://console.upstash.com
 *   2. Setear en Railway:
 *      UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
 *      UPSTASH_REDIS_REST_TOKEN=xxx
 */

// ─── Redis client (lazy, solo si están las vars) ─────────────────────────────

let _redisClient: import("@upstash/redis").Redis | null | undefined = undefined;

function getRedis(): import("@upstash/redis").Redis | null {
  if (_redisClient !== undefined) return _redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    _redisClient = null;
    return null;
  }
  try {
    const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
    _redisClient = new Redis({ url, token });
    return _redisClient;
  } catch {
    _redisClient = null;
    return null;
  }
}

// ─── In-memory fallback ───────────────────────────────────────────────────────

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

function inMemoryCheck(
  key: string,
  max: number,
  windowMs: number,
  now: number
): { ok: boolean; retryAfterSec: number } {
  prune(now);
  let b = rateLimitMap.get(key);
  if (!b || now >= b.resetTime) {
    b = { count: 1, resetTime: now + windowMs };
    rateLimitMap.set(key, b);
    return { ok: true, retryAfterSec: 0 };
  }
  b.count += 1;
  if (b.count > max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((b.resetTime - now) / 1000)) };
  }
  return { ok: true, retryAfterSec: 0 };
}

// ─── Redis-backed check ───────────────────────────────────────────────────────

async function redisCheck(
  redis: import("@upstash/redis").Redis,
  key: string,
  max: number,
  windowMs: number
): Promise<{ ok: boolean; retryAfterSec: number }> {
  const windowSec = Math.ceil(windowMs / 1000);
  const redisKey = `rl:${key}`;
  const pipeline = redis.pipeline();
  pipeline.incr(redisKey);
  pipeline.expire(redisKey, windowSec, "NX");
  const [count] = (await pipeline.exec()) as [number, number];
  if (count > max) {
    const ttl = await redis.ttl(redisKey);
    return { ok: false, retryAfterSec: Math.max(1, ttl) };
  }
  return { ok: true, retryAfterSec: 0 };
}

// ─── Unified check ───────────────────────────────────────────────────────────

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export async function checkRateLimitAsync(
  key: string,
  opts: { max: number; windowMs: number }
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (redis) {
    try {
      return await redisCheck(redis, key, opts.max, opts.windowMs);
    } catch {
      // Redis falló — fallback in-memory
    }
  }
  const r = inMemoryCheck(key, opts.max, opts.windowMs, Date.now());
  return r.ok ? { ok: true } : { ok: false, retryAfterSec: r.retryAfterSec };
}

// ─── APIs síncronas (backwards-compat, usan in-memory) ───────────────────────

export function rateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 60 * 1000
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const r = inMemoryCheck(identifier, maxRequests, windowMs, now);
  return { allowed: r.ok, retryAfter: r.retryAfterSec };
}

export function checkRateLimit(
  key: string,
  opts: { max: number; windowMs: number; now?: number }
): RateLimitResult {
  const now = opts.now ?? Date.now();
  const r = inMemoryCheck(key, opts.max, opts.windowMs, now);
  return r.ok ? { ok: true } : { ok: false, retryAfterSec: r.retryAfterSec };
}

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
    const first = forwarded.split(",").at(-1)?.trim();
    if (first) return first.slice(0, 128);
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 128);
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf.slice(0, 128);
  return "unknown";
}

// Limpieza in-memory periódica
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) rateLimitMap.delete(key);
  }
}, 10 * 60 * 1000);
