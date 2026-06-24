import crypto, { timingSafeEqual } from "crypto";

function secret() {
  const s = process.env.MELI_OAUTH_STATE_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) {
    throw new Error("Falta MELI_OAUTH_STATE_SECRET o NEXTAUTH_SECRET para firmar el state de OAuth de MercadoLibre");
  }
  return s;
}

export function signMeliOAuthUserId(userId: string): string {
  const exp = Date.now() + 15 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ u: userId, exp }), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyMeliOAuthState(state: string): string | null {
  try {
    const [payload, sig] = state.split(".");
    if (!payload || !sig) return null;
    const expected = crypto.createHmac("sha256", secret()).update(payload).digest();
    const provided = Buffer.from(sig, "base64url");
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      u?: string;
      exp?: number;
    };
    if (!json.u || !json.exp || Date.now() > json.exp) return null;
    return json.u;
  } catch {
    return null;
  }
}
