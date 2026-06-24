/**
 * Token HMAC firmado para reset de contraseña.
 *
 * Vida útil: 1 hora (más corto que magic links de órdenes porque resetear
 * password es más sensible).
 *
 * Payload: { e: email, exp: epochSec, nonce }
 * Signature: HMAC-SHA256(payload, NEXTAUTH_SECRET)
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TTL_SEC = 60 * 60; // 1 hora

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  const pad = (4 - (s.length % 4)) % 4;
  const norm = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  return Buffer.from(norm, "base64");
}

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET || process.env.ORDER_ACCESS_SECRET;
  if (!s) {
    throw new Error(
      "[password-reset] NEXTAUTH_SECRET no configurado — imposible firmar tokens de reset"
    );
  }
  return s;
}

export type ResetTokenPayload = {
  e: string;
  exp: number;
  /** Nonce para que cada link sea único aunque se generen back-to-back. */
  n: string;
};

export function signResetToken(email: string): string {
  const payload: ResetTokenPayload = {
    e: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + TTL_SEC,
    n: randomBytes(8).toString("hex"),
  };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = createHmac("sha256", secret()).update(payloadB64).digest();
  return `${payloadB64}.${b64url(sig)}`;
}

export type VerifyResetResult =
  | { ok: true; payload: ResetTokenPayload }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifyResetToken(token: string): VerifyResetResult {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { ok: false, reason: "malformed" };
  }
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return { ok: false, reason: "malformed" };

  let payload: ResetTokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (typeof payload.e !== "string" || typeof payload.exp !== "number") {
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
  if (Math.floor(Date.now() / 1000) > payload.exp) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, payload };
}
