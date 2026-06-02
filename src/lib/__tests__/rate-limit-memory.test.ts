import { describe, it, expect } from "vitest";
import { checkRateLimit } from "../rate-limit";

describe("rate-limit-memory", () => {
  it("allows requests under the cap", () => {
    const t0 = 1_700_000_000_000;
    expect(checkRateLimit("k1", { max: 3, windowMs: 60_000, now: t0 })).toEqual({ ok: true });
    expect(checkRateLimit("k1", { max: 3, windowMs: 60_000, now: t0 + 100 })).toEqual({ ok: true });
    expect(checkRateLimit("k1", { max: 3, windowMs: 60_000, now: t0 + 200 })).toEqual({ ok: true });
  });

  it("blocks when the cap is exceeded within the window", () => {
    const t0 = 1_700_000_000_000;
    expect(checkRateLimit("k2", { max: 2, windowMs: 60_000, now: t0 })).toEqual({ ok: true });
    expect(checkRateLimit("k2", { max: 2, windowMs: 60_000, now: t0 + 50 })).toEqual({ ok: true });
    const r = checkRateLimit("k2", { max: 2, windowMs: 60_000, now: t0 + 100 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfterSec).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const t0 = 1_700_000_000_000;
    expect(checkRateLimit("k3", { max: 1, windowMs: 1000, now: t0 })).toEqual({ ok: true });
    expect(checkRateLimit("k3", { max: 1, windowMs: 1000, now: t0 + 100 }).ok).toBe(false);
    expect(checkRateLimit("k3", { max: 1, windowMs: 1000, now: t0 + 1001 })).toEqual({ ok: true });
  });
});
