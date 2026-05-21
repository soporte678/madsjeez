/**
 * Zipnova Envíos API v2 — ver https://docs.zipnova.com/envios/principios/urls-y-autenticacion
 * Argentina (default): https://api.zipnova.com.ar/v2
 */

export type ZipnovaConfig = {
  baseUrl: string;
  accountId: number;
  originId: number | null;
  source: string;
  apiToken: string;
  apiSecret: string;
};

export function getZipnovaConfig(): ZipnovaConfig | null {
  const baseUrl = (process.env.ZIPNOVA_API_BASE_URL || "https://api.zipnova.com.ar/v2").replace(/\/$/, "");
  const accountRaw = process.env.ZIPNOVA_ACCOUNT_ID;
  const token = process.env.ZIPNOVA_API_TOKEN?.trim();
  const secret = process.env.ZIPNOVA_API_SECRET?.trim();
  if (!accountRaw || !token || !secret) return null;
  const accountId = parseInt(accountRaw, 10);
  if (!Number.isFinite(accountId) || accountId <= 0) return null;

  const originRaw = process.env.ZIPNOVA_ORIGIN_ID;
  const originId =
    originRaw && originRaw.trim() !== ""
      ? (() => {
          const n = parseInt(originRaw, 10);
          return Number.isFinite(n) && n > 0 ? n : null;
        })()
      : null;

  const source = (process.env.ZIPNOVA_SOURCE || "madsjeez_marketplace").slice(0, 150);

  return { baseUrl, accountId, originId, source, apiToken: token, apiSecret: secret };
}

export function zipnovaBasicAuthHeader(cfg: ZipnovaConfig): string {
  const raw = `${cfg.apiToken}:${cfg.apiSecret}`;
  return `Basic ${Buffer.from(raw, "utf8").toString("base64")}`;
}
