/**
 * Cifrado AES-256-GCM para credenciales de tiendas externas en reposo.
 *
 * Clave: INTEGRATION_ENC_KEY (32 bytes hex/base64) o, en su defecto,
 * derivada de NEXTAUTH_SECRET vía scrypt. Formato de salida:
 *   v1:<iv_b64>:<tag_b64>:<ciphertext_b64>
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

function getKey(): Buffer {
  const raw = process.env.INTEGRATION_ENC_KEY;
  if (raw) {
    // hex (64 chars) o base64
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
    const b = Buffer.from(raw, "base64");
    if (b.length === 32) return b;
  }
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "Cifrado de integraciones no configurado: definí INTEGRATION_ENC_KEY (32 bytes hex/base64) o NEXTAUTH_SECRET."
    );
  }
  return scryptSync(secret, "integration-creds-v1", 32);
}

export function encryptJSON(obj: unknown): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plain = Buffer.from(JSON.stringify(obj), "utf8");
  const ct = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptJSON<T = Record<string, unknown>>(blob: string): T | null {
  try {
    const [v, ivB64, tagB64, ctB64] = blob.split(":");
    if (v !== "v1") return null;
    const key = getKey();
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const pt = Buffer.concat([
      decipher.update(Buffer.from(ctB64, "base64")),
      decipher.final(),
    ]);
    return JSON.parse(pt.toString("utf8")) as T;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers para tokens OAuth (string) en reposo.                      */
/*  encryptToken -> "v1:..." | decryptToken: compat con texto plano    */
/*  legacy (si no empieza con "v1:", lo devuelve tal cual). Así los     */
/*  tokens ya guardados siguen funcionando y se cifran solos en el     */
/*  próximo refresh/reconexión, sin migración masiva riesgosa.         */
/* ------------------------------------------------------------------ */

/** Cifra un token para guardarlo. Pasa null/"" sin tocar. */
export function encryptToken(token: string | null | undefined): string | null {
  if (token == null || token === "") return token == null ? null : token;
  return encryptJSON(token);
}

/** Descifra un token guardado. Si no está cifrado (legacy), lo devuelve igual. */
export function decryptToken(stored: string | null | undefined): string | null {
  if (stored == null || stored === "") return stored == null ? null : stored;
  if (stored.startsWith("v1:")) {
    const v = decryptJSON<string>(stored);
    return typeof v === "string" ? v : null;
  }
  return stored; // legacy en texto plano
}
