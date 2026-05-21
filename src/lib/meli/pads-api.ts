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

export type MeliPadsAdRow = {
  item_id?: string;
  title?: string;
  campaign_id?: number;
  status?: string;
  metrics?: Record<string, unknown>;
};

export type MeliPadsAdsSearchResponse = {
  paging?: { offset?: number; total?: number; limit?: number };
  results?: MeliPadsAdRow[];
};

/** Lista alineada a ML Product Ads (2026): incluye sov y montos/cantidades por canal evita rechazos parciales del endpoint search. */
/** Métricas soportadas por PADS v2 (sin alias no documentados: `sov` puede hacer rechazar toda la búsqueda en algunos entornos). */
const PADS_METRICS =
  "clicks,prints,ctr,cost,cpc,acos,organic_units_quantity,organic_units_amount,organic_items_quantity,direct_items_quantity,indirect_items_quantity,advertising_items_quantity,cvr,roas,direct_units_quantity,indirect_units_quantity,units_quantity,direct_amount,indirect_amount,total_amount,impression_share,top_impression_share,lost_impression_share_by_budget,lost_impression_share_by_ad_rank,acos_benchmark";

/** Subconjunto estable para reintentar si ML responde 400 con la lista completa (cambia según cuenta/región). */
const PADS_METRICS_MINIMAL =
  "clicks,prints,ctr,cost,cpc,acos,cvr,roas,direct_amount,indirect_amount,total_amount";

async function padsCampaignSearchWithMetricsRetry(
  accessToken: string,
  path: string,
  dateFrom: string,
  dateTo: string,
  offset: number,
  limit: number
) {
  const qsFull = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    date_from: dateFrom,
    date_to: dateTo,
    metrics: PADS_METRICS,
    metrics_summary: "true",
    channel: "marketplace",
  });
  let res = await meliApi<MeliPadsCampaignSearchResponse>(accessToken, `${path}?${qsFull.toString()}`, {
    headers: { "api-version": "2" },
  });
  if (!res.ok && res.status === 400) {
    const qsMin = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      date_from: dateFrom,
      date_to: dateTo,
      metrics: PADS_METRICS_MINIMAL,
      metrics_summary: "true",
      channel: "marketplace",
    });
    res = await meliApi<MeliPadsCampaignSearchResponse>(accessToken, `${path}?${qsMin.toString()}`, {
      headers: { "api-version": "2" },
    });
  }
  return res;
}

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
  const path = `/marketplace/advertising/${encodeURIComponent(siteId)}/advertisers/${advertiserId}/product_ads/campaigns/search`;
  return padsCampaignSearchWithMetricsRetry(accessToken, path, dateFrom, dateTo, offset, limit);
}

/** Variante sin /search (según guía AR/new-product-ads). */
export async function meliPadsCampaignsWithMetricsRangeNoSearch(
  accessToken: string,
  siteId: string,
  advertiserId: number,
  dateFrom: string,
  dateTo: string,
  offset = 0,
  limit = 50
) {
  const path = `/marketplace/advertising/${encodeURIComponent(siteId)}/advertisers/${advertiserId}/product_ads/campaigns`;
  return padsCampaignSearchWithMetricsRetry(accessToken, path, dateFrom, dateTo, offset, limit);
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

/** Variante sin /search (según guía AR/new-product-ads). */
export async function meliPadsCampaignsBasicNoSearch(
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
  const path = `/marketplace/advertising/${encodeURIComponent(siteId)}/advertisers/${advertiserId}/product_ads/campaigns?${qs.toString()}`;
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
  const path = `/marketplace/advertising/${encodeURIComponent(siteId)}/product_ads/campaigns/search`;
  return padsCampaignSearchWithMetricsRetry(accessToken, path, dateFrom, dateTo, offset, limit);
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
  const pathBase = `/marketplace/advertising/${encodeURIComponent(siteId)}/product_ads/campaigns/${campaignId}`;
  const qsFull = new URLSearchParams({
    date_from: dateFrom,
    date_to: dateTo,
    metrics: PADS_METRICS,
  });
  let res = await meliApi<MeliPadsCampaignRow>(accessToken, `${pathBase}?${qsFull.toString()}`, {
    headers: { "api-version": "2" },
  });
  if (!res.ok && res.status === 400) {
    const qsMin = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
      metrics: PADS_METRICS_MINIMAL,
    });
    res = await meliApi<MeliPadsCampaignRow>(accessToken, `${pathBase}?${qsMin.toString()}`, {
      headers: { "api-version": "2" },
    });
  }
  return res;
}

/** Items/anuncios de una campaña (o advertiser) con métricas. */
export async function meliPadsSearchAds(
  accessToken: string,
  siteId: string,
  advertiserId: number,
  dateFrom: string,
  dateTo: string,
  campaignId?: number,
  offset = 0,
  limit = 50
) {
  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    date_from: dateFrom,
    date_to: dateTo,
    metrics: PADS_METRICS,
    channel: "marketplace",
  });
  if (campaignId && Number.isFinite(campaignId)) {
    qs.set("campaign_id", String(campaignId));
  }
  const path = `/marketplace/advertising/${encodeURIComponent(siteId)}/advertisers/${advertiserId}/product_ads/ads/search?${qs.toString()}`;
  return meliApi<MeliPadsAdsSearchResponse>(accessToken, path, {
    headers: { "api-version": "2" },
  });
}

/** Actualiza estado de un anuncio/producto dentro de PADS. */
export async function meliPadsPutAdStatus(
  accessToken: string,
  siteId: string,
  advertiserId: number,
  itemId: string,
  body: { status: "active" | "paused"; campaign_id?: number }
) {
  const path = `/marketplace/advertising/${encodeURIComponent(siteId)}/advertisers/${advertiserId}/product_ads/ads/${encodeURIComponent(itemId)}`;
  return meliApi<unknown>(accessToken, path, {
    method: "PUT",
    headers: {
      "api-version": "2",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
