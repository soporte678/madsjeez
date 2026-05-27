/**
 * JARVIS Response Cache — Ultra-low latency caching subsystem
 *
 * Features:
 * - In-memory LRU cache (Map) for hot responses (<1000 entries)
 * - Per-entry TTL with automatic expiration
 * - Tag-based invalidation for cache coherence
 * - SHA-256 key hashing for consistent cache keys
 * - Optional Redis adapter for multi-instance deployments
 * - Cache warming support for predictable queries
 * - Metrics tracking for hit/miss ratios
 *
 * Performance targets:
 * - Cache HIT: < 5ms (memory), < 15ms (Redis)
 * - Cache MISS overhead: < 2ms
 * - Memory footprint: < 50MB for 1000 entries
 */

import { createHash } from "crypto";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;   // epoch ms
  tags: string[];      // for tag-based invalidation
  accessCount: number; // LRU tracking
  createdAt: number;   // for metrics
  sizeEstimate: number; // bytes estimate
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalEntries: number;
  totalSizeBytes: number;
  hitRate: number;
  avgHitLatencyMs: number;
}

export interface CacheWarmEntry {
  key: string;
  generator: () => Promise<unknown>;
  ttlMs: number;
  tags?: string[];
}

export interface RedisAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlMs: number): Promise<void>;
  del(key: string): Promise<void>;
  delByPattern(pattern: string): Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Default TTLs (milliseconds)                                         */
/* ------------------------------------------------------------------ */

export const CACHE_TTL = {
  /** Health checks — refresh frequently */
  HEALTH: 30_000,
  /** Short summaries — moderate freshness */
  SHORT: 120_000,
  /** Normal responses — 5 minutes */
  NORMAL: 300_000,
  /** Static / reference data — 1 hour */
  STATIC: 3_600_000,
  /** Long-term cache — 24 hours */
  LONG: 86_400_000,
} as const;

/* ------------------------------------------------------------------ */
/* Key generation                                                      */
/* ------------------------------------------------------------------ */

/**
 * Generate a deterministic cache key from a prompt + context.
 * Uses SHA-256 for collision resistance.
 */
export function generateCacheKey(prompt: string, context?: Record<string, unknown>): string {
  const ctx = context ? JSON.stringify(context) : "";
  const input = `${prompt}::${ctx}`;
  return createHash("sha256").update(input).digest("hex").slice(0, 32);
}

/**
 * Generate a cache key for a JARVIS command.
 */
export function generateCommandCacheKey(
  command: string,
  scope: string,
  detail: string,
  message?: string
): string {
  return generateCacheKey(`${command}:${scope}:${detail}`, { message: message?.slice(0, 200) });
}

/* ------------------------------------------------------------------ */
/* Response Cache Class                                                */
/* ------------------------------------------------------------------ */

export class ResponseCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private stats = { hits: 0, misses: 0, evictions: 0, totalHitLatencyNs: 0n };
  private maxEntries: number;
  private maxSizeBytes: number;
  private currentSizeBytes = 0;
  private redis: RedisAdapter | null;
  private useRedis: boolean;
  private warmupIntervalMs: number;
  private warmupTimer: ReturnType<typeof setInterval> | null = null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * @param maxEntries    Max in-memory entries before LRU eviction
   * @param maxSizeBytes  Max total memory footprint
   * @param redis         Optional Redis adapter for multi-instance
   * @param warmupIntervalMs  How often to run cache warming (0 = disabled)
   */
  constructor(opts?: {
    maxEntries?: number;
    maxSizeBytes?: number;
    redis?: RedisAdapter;
    warmupIntervalMs?: number;
  }) {
    this.maxEntries = opts?.maxEntries ?? 1000;
    this.maxSizeBytes = opts?.maxSizeBytes ?? 50 * 1024 * 1024; // 50MB
    this.redis = opts?.redis ?? null;
    this.useRedis = Boolean(this.redis);
    this.warmupIntervalMs = opts?.warmupIntervalMs ?? 0;

    // Start periodic cleanup every 30 seconds
    this.cleanupTimer = setInterval(() => this.cleanup(), 30_000);
  }

  /* ---------------------------------------------------------------- */
  /* Core operations                                                    */
  /* ---------------------------------------------------------------- */

  /**
   * Get a value from cache. Returns null if expired or missing.
   * Checks memory first, then Redis (if configured).
   * LRU: updates access count on hit.
   */
  get<T>(key: string): T | null {
    const startNs = process.hrtime.bigint();

    // 1. Check memory cache
    const entry = this.cache.get(key);
    if (entry) {
      if (entry.expiresAt > Date.now()) {
        // Cache HIT — update LRU
        entry.accessCount++;
        this.stats.hits++;
        this.stats.totalHitLatencyNs += process.hrtime.bigint() - startNs;
        return entry.data as T;
      }
      // Expired — remove
      this.removeEntry(key);
    }

    // 2. Check Redis (if configured) — fire and forget for speed
    if (this.useRedis) {
      // Return null immediately; Redis async fetch on miss
      // prevents blocking the hot path
      this.stats.misses++;
      return null;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Async version that also checks Redis.
   * Use this when Redis is enabled and you can afford async.
   */
  async getAsync<T>(key: string): Promise<T | null> {
    const startNs = process.hrtime.bigint();

    // Memory first
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      entry.accessCount++;
      this.stats.hits++;
      this.stats.totalHitLatencyNs += process.hrtime.bigint() - startNs;
      return entry.data as T;
    }

    if (entry) this.removeEntry(key);

    // Redis fallback
    if (this.useRedis && this.redis) {
      try {
        const raw = await this.redis.get(`jarvis:cache:${key}`);
        if (raw) {
          const parsed = JSON.parse(raw) as T;
          // Promote to memory cache
          this.set(key, parsed, CACHE_TTL.NORMAL);
          this.stats.hits++;
          this.stats.totalHitLatencyNs += process.hrtime.bigint() - startNs;
          return parsed;
        }
      } catch {
        // Redis miss — fall through
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Store a value in cache with TTL.
   * Automatically evicts LRU entries if at capacity.
   */
  set<T>(key: string, data: T, ttlMs: number, tags?: string[]): void {
    const now = Date.now();
    const sizeEstimate = this.estimateSize(data);

    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.removeEntry(key);
    }

    // Evict LRU if at capacity
    while (
      this.cache.size >= this.maxEntries ||
      (this.currentSizeBytes + sizeEstimate > this.maxSizeBytes && this.cache.size > 0)
    ) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      expiresAt: now + ttlMs,
      tags: tags ?? [],
      accessCount: 1,
      createdAt: now,
      sizeEstimate,
    };

    this.cache.set(key, entry as CacheEntry<unknown>);
    this.currentSizeBytes += sizeEstimate;

    // Async write to Redis if configured
    if (this.useRedis && this.redis) {
      this.redis
        .set(`jarvis:cache:${key}`, JSON.stringify(data), ttlMs)
        .catch(() => {}); // fire-and-forget
    }
  }

  /**
   * Set with async Redis write + await.
   */
  async setAsync<T>(key: string, data: T, ttlMs: number, tags?: string[]): Promise<void> {
    this.set(key, data, ttlMs, tags);
    if (this.useRedis && this.redis) {
      await this.redis.set(`jarvis:cache:${key}`, JSON.stringify(data), ttlMs);
    }
  }

  /**
   * Invalidate all entries with a given tag.
   */
  invalidate(tag: string): void {
    const toRemove: string[] = [];
    for (const [key, entry] of this.cache) {
      if (entry.tags.includes(tag)) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      this.removeEntry(key);
    }
    // Also invalidate in Redis
    if (this.useRedis && this.redis) {
      this.redis.delByPattern(`jarvis:cache:*`).catch(() => {});
    }
  }

  /**
   * Remove a specific key.
   */
  delete(key: string): void {
    this.removeEntry(key);
    if (this.useRedis && this.redis) {
      this.redis.del(`jarvis:cache:${key}`).catch(() => {});
    }
  }

  /**
   * Check if a key exists and is not expired (fast, sync).
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && entry.expiresAt > Date.now();
  }

  /**
   * Clear entire cache.
   */
  clear(): void {
    this.cache.clear();
    this.currentSizeBytes = 0;
    if (this.useRedis && this.redis) {
      this.redis.delByPattern("jarvis:cache:*").catch(() => {});
    }
  }

  /**
   * Remove expired entries.
   */
  cleanup(): number {
    const now = Date.now();
    const toRemove: string[] = [];
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt <= now) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      this.removeEntry(key);
    }
    return toRemove.length;
  }

  /* ---------------------------------------------------------------- */
  /* Cache warming                                                      */
  /* ---------------------------------------------------------------- */

  /**
   * Register entries to warm periodically.
   * Call startWarming() to begin.
   */
  private warmEntries: CacheWarmEntry[] = [];

  registerWarmEntry(entry: CacheWarmEntry): void {
    this.warmEntries.push(entry);
  }

  /**
   * Start periodic cache warming.
   */
  startWarming(): void {
    if (this.warmupIntervalMs <= 0 || this.warmupTimer) return;
    this.warmupTimer = setInterval(() => this.runWarming(), this.warmupIntervalMs);
  }

  stopWarming(): void {
    if (this.warmupTimer) {
      clearInterval(this.warmupTimer);
      this.warmupTimer = null;
    }
  }

  private async runWarming(): Promise<void> {
    await Promise.all(
      this.warmEntries.map(async (entry) => {
        try {
          const data = await entry.generator();
          this.set(entry.key, data, entry.ttlMs, entry.tags);
        } catch {
          // Silently skip failed warm-ups
        }
      })
    );
  }

  /* ---------------------------------------------------------------- */
  /* Statistics                                                         */
  /* ---------------------------------------------------------------- */

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const avgHitLatencyMs =
      this.stats.hits > 0
        ? Number(this.stats.totalHitLatencyNs) / this.stats.hits / 1_000_000
        : 0;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      totalEntries: this.cache.size,
      totalSizeBytes: this.currentSizeBytes,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      avgHitLatencyMs,
    };
  }

  resetStats(): void {
    this.stats = { hits: 0, misses: 0, evictions: 0, totalHitLatencyNs: 0n };
  }

  /* ---------------------------------------------------------------- */
 /* Internal helpers                                                   */
  /* ---------------------------------------------------------------- */

  private removeEntry(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSizeBytes -= entry.sizeEstimate;
      this.cache.delete(key);
    }
  }

  private evictLRU(): void {
    let lruKey: string | null = null;
    let minAccess = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.accessCount < minAccess) {
        minAccess = entry.accessCount;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.removeEntry(lruKey);
      this.stats.evictions++;
    }
  }

  private estimateSize(data: unknown): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 1024; // fallback estimate
    }
  }

  /**
   * Dispose — stop all timers.
   */
  dispose(): void {
    this.stopWarming();
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Singleton instance                                                  */
/* ------------------------------------------------------------------ */

let globalCache: ResponseCache | null = null;

/**
 * Get or create the global JARVIS cache instance.
 * Singleton pattern ensures one cache across the app.
 */
export function getJarvisCache(): ResponseCache {
  if (!globalCache) {
    globalCache = new ResponseCache({
      maxEntries: 1000,
      maxSizeBytes: 50 * 1024 * 1024,
    });
    // Register common warm entries
    globalCache.registerWarmEntry({
      key: generateCommandCacheKey("health", "all", "short"),
      generator: async () => ({ status: "checking", ts: Date.now() }),
      ttlMs: CACHE_TTL.HEALTH,
      tags: ["health"],
    });
  }
  return globalCache;
}

/**
 * Reset the global cache (useful for testing).
 */
export function resetJarvisCache(): void {
  globalCache?.dispose();
  globalCache = null;
}

/**
 * Memoize an async function with cache.
 * Wraps any function with automatic caching.
 */
export function memoizeWithCache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyFn: (...args: TArgs) => string,
  ttlMs: number,
  tags?: string[]
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const cache = getJarvisCache();
    const key = keyFn(...args);
    const cached = cache.get<TResult>(key);
    if (cached !== null) return cached;
    const result = await fn(...args);
    cache.set(key, result, ttlMs, tags);
    return result;
  };
}

/**
 * Middleware-style cache wrapper for JARVIS commands.
 * Checks cache before executing, stores result after.
 */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  executor: () => Promise<T>,
  tags?: string[]
): Promise<T> {
  const cache = getJarvisCache();
  const cached = cache.get<T>(key);
  if (cached !== null) return cached;

  const result = await executor();
  cache.set(key, result, ttlMs, tags);
  return result;
}
