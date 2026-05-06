/** Product Ads (PADS) — endpoints documentados ML api-version 1–2. */

import { meliApi } from "./api";

export type MeliPadsAdvertiser = {
  advertiser_id: number;
  site_id: string;
  advertiser_name?: string;
  account_name?: string;
};

export async function meliPadsListAdvertisers(accessToken: string) {
  return meliApi<{ advertisers?: MeliPadsAdvertiser[] }>(
    accessToken,
    "/advertising/advertisers?product_id=PADS",
    { headers: { "Api-Version": "1" } }
  );
}

export type MeliPadsCampaignMetrics = {
  clicks?: number;
  prints?: number;
  cost?: number;
  cpc?: number;
  ctr?: number;
  acos?: number;
  cvr?: number;
  roas?: number;
  impression_share?: number;
  top_impression_share?: number;
  lost_impression_share_by_budget?: number;
  lost_impression_share_by_ad_rank?: number;
  acos_benchmark?: number;
};

export type MeliPadsCampaignRow = {
  id: number;
  name?: string;
  status?: string;
  strategy?: string;
  channel?: string;
  budget?: number;
  automatic_budget?: boolean;
  roas_target?: number;
  acos_target?: number;
  advertiser_id?: number;
  metrics?: MeliPadsCampaignMetrics;
};

export type MeliPadsCampaignSearchResponse = {
  paging?: { offset?: number; total?: number; limit?: number };
  results?: MeliPadsCampaignRow[];
  metrics_summary?: MeliPadsCampaignMetrics;
};

const PADS_METRICS =
  "clicks,prints,ctr,cost,cpc,acos,cvr,roas,impression_share,top_impression_share,lost_impression_share_by_budget,lost_impression_share_by_ad_rank,acos_benchmark";

export function meliPadsDateRange(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - Math.max(1, Math.min(days, 90)));
  return {
    date_from: from.toISOString().slice(0, 10),
    date_to: to.toISOString().slice(0, 10),
  };
}

/** Campañas con métricas agregadas en un rango explícito. */
export async function meliPadsSearchCampaignsWithMetricsRange(
  accessToken: string,
  siteId: string,
  advertiserId: number,
  dateFrom: string,
  dateTo: string,
  offset = 0,
  limit = 50
) {
  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    date_from: dateFrom,
    date_to: dateTo,
    metrics: PADS_METRICS,
    metrics_summary: "true",
    channel: "marketplace",
  });
  const path = `/marketplace/advertising/${encodeURIComponent(siteId)}/advertisers/${advertiserId}/product_ads/campaigns/search?${qs.toString()}`;
  return meliApi<MeliPadsCampaignSearchResponse>(accessToken, path, {
    headers: { "api-version": "2" },
  });
}

/** Campañas con métricas agregadas en el rango (últimos N días). */
export async function meliPadsSearchCampaignsWithMetrics(
  accessToken: string,
  siteId: string,
  advertiserId: number,
  days = 14,
  offset = 0,
  limit = 50
) {
  const { date_from, date_to } = meliPadsDateRange(days);
  return meliPadsSearchCampaignsWithMetricsRange(
    accessToken,
    siteId,
    advertiserId,
    date_from,
    date_to,
    offset,
    limit
  );
}

/** Lista de campañas sin métricas (respaldo si falla el endpoint con métricas). */
export async function meliPadsSearchCampaignsBasic(
  accessToken: string,
  siteId: string,
  advertiserId: number,
  offset = 0,
  limit = 50
) {
  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    channel: "marketplace",
  });
  const path = `/marketplace/advertising/${encodeURIComponent(siteId)}/advertisers/${advertiserId}/product_ads/campaigns/search?${qs.toString()}`;
  return meliApi<MeliPadsCampaignSearchResponse>(accessToken, path, {
    headers: { "api-version": "2" },
  });
}

/**
 * Fallback multi-tenant: algunos entornos exponen campañas en la ruta sin /advertisers/:id
 * y requieren advertiser_id como query param.
 */
export async function meliPadsSearchCampaignsWithMetricsAltPath(
  accessToken: string,
  siteId: string,
  advertiserId: number,
  dateFrom: string,
  dateTo: string,
  offset = 0,
  limit = 50
) {
  const qs = new URLSearchParams({
    advertiser_id: String(advertiserId),
    limit: String(limit),
    offset: String(offset),
    date_from: dateFrom,
    date_to: dateTo,
    metrics: PADS_METRICS,
    metrics_summary: "true",
    channel: "marketplace",
  });
  const path = `/marketplace/advertising/${encodeURIComponent(siteId)}/product_ads/campaigns/search?${qs.toString()}`;
  return meliApi<MeliPadsCampaignSearchResponse>(accessToken, path, {
    headers: { "api-version": "2" },
  });
}

export async function meliPadsSearchCampaignsBasicAltPath(
  accessToken: string,
  siteId: string,
  advertiserId: number,
  offset = 0,
  limit = 50
) {
  const qs = new URLSearchParams({
    advertiser_id: String(advertiserId),
    limit: String(limit),
    offset: String(offset),
    channel: "marketplace",
  });
  const path = `/marketplace/advertising/${encodeURIComponent(siteId)}/product_ads/campaigns/search?${qs.toString()}`;
  return meliApi<MeliPadsCampaignSearchResponse>(accessToken, path, {
    headers: { "api-version": "2" },
  });
}

export async function meliPadsPutCampaign(
  accessToken: string,
  siteId: string,
  campaignId: number,
  body: Record<string, unknown>
) {
  const path = `/marketplace/advertising/${encodeURIComponent(siteId)}/product_ads/campaigns/${campaignId}`;
  return meliApi<unknown>(accessToken, path, {
    method: "PUT",
    headers: {
      "api-version": "2",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

/** Detalle de una campaña con métricas (fallback cuando search no devuelve KPIs). */
export async function meliPadsGetCampaignWithMetrics(
  accessToken: string,
  siteId: string,
  campaignId: number,
  dateFrom: string,
  dateTo: string
) {
  const qs = new URLSearchParams({
    date_from: dateFrom,
    date_to: dateTo,
    metrics: PADS_METRICS,
  });
  const path = `/marketplace/advertising/${encodeURIComponent(siteId)}/product_ads/campaigns/${campaignId}?${qs.toString()}`;
  return meliApi<MeliPadsCampaignRow>(accessToken, path, {
    headers: { "api-version": "2" },
  });
}
