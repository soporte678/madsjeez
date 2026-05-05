import crypto from "crypto";

export type MpOAuthStatePayload = {
  sellerUserId: string;
  nonce: string;
  exp: number; // unix seconds
};

/** Build signed OAuth state: base64url(JSON) + "." + hex(HMAC-SHA256). */
export function createMpOAuthState(sellerUserId: string, secret: string, ttlSec = 600): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload: MpOAuthStatePayload = { sellerUserId, nonce, exp };
  const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(b64).digest("hex");
  return `${b64}.${sig}`;
}

/** Verify signature and expiry; returns payload or null. */
export function verifyMpOAuthState(state: string, secret: string): MpOAuthStatePayload | null {
  try {
    const dot = state.lastIndexOf(".");
    if (dot <= 0) return null;
    const b64 = state.slice(0, dot);
    const sig = state.slice(dot + 1);
    const expected = crypto.createHmac("sha256", secret).update(b64).digest("hex");
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const raw = Buffer.from(b64, "base64url").toString("utf8");
    const payload = JSON.parse(raw) as MpOAuthStatePayload;
    if (!payload?.sellerUserId || !payload?.nonce || typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
