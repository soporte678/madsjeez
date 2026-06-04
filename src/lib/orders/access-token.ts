/**
 * Tokens firmados para acceso a orders sin sesión (guest checkout).
 *
 * Formato: base64url(payload).base64url(signature)
 *   payload  = JSON { o: orderId, b: buyerEmail, e: expiryEpochSec }
 *   signature = HMAC-SHA256(payload, ORDER_ACCESS_SECRET)
 *
 * El token va por email después del pago. El comprador lo usa para entrar
 * a /orders/access?token=... sin necesidad de cuenta. Si alguien adivina
 * el orderId, la firma rompe → 403.
 *
 * Default expiry: 90 días. Se puede regenerar pidiendo email de nuevo.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SEC = 90 * 24 * 60 * 60;

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  const pad = (4 - (s.length % 4)) % 4;
  const norm = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  return Buffer.from(norm, "base64");
}

function secret(): string {
  return (
    process.env.ORDER_ACCESS_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "madsjeez-order-fallback-secret-change-me"
  );
}

export type OrderAccessPayload = {
  /** Order ID (Prisma cuid o uuid Supabase). */
  o: string;
  /** Email del comprador (lowercased). */
  b: string;
  /** Expiry epoch seconds. */
  e: number;
};

export function signOrderAccessToken(
  orderId: string,
  buyerEmail: string,
  ttlSec = DEFAULT_TTL_SEC,
): string {
  const payload: OrderAccessPayload = {
    o: orderId,
    b: buyerEmail.trim().toLowerCase(),
    e: Math.floor(Date.now() / 1000) + ttlSec,
  };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = createHmac("sha256", secret()).update(payloadB64).digest();
  return `${payloadB64}.${b64url(sig)}`;
}

export type VerifyResult =
  | { ok: true; payload: OrderAccessPayload }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifyOrderAccessToken(token: string): VerifyResult {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { ok: false, reason: "malformed" };
  }
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return { ok: false, reason: "malformed" };

  let payload: OrderAccessPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (
    typeof payload.o !== "string" ||
    typeof payload.b !== "string" ||
    typeof payload.e !== "number"
  ) {
    return { ok: false, reason: "malformed" };
  }

  const expected = createHmac("sha256", secret()).update(payloadB64).digest();
  let provided: Buffer;
  try {
    provided = b64urlDecode(sigB64);
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { ok: false, reason: "bad_signature" };
  }
  if (Math.floor(Date.now() / 1000) > payload.e) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, payload };
}
