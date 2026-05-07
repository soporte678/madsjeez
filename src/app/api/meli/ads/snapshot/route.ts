import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMeliAccessTokenForUser } from "@/lib/meli/prisma-session";
import { meliGetSellerPromotions } from "@/lib/meli/api";
import {
  meliPadsListAdvertisers,
  meliPadsSearchCampaignsBasic,
  meliPadsSearchCampaignsWithMetrics,
  meliPadsCampaignsBasicNoSearch,
  meliPadsCampaignsWithMetricsRangeNoSearch,
  meliPadsSearchCampaignsWithMetricsRange,
  meliPadsSearchCampaignsBasicAltPath,
  meliPadsSearchCampaignsWithMetricsAltPath,
  meliPadsGetCampaignWithMetrics,
  type MeliPadsCampaignRow,
  type MeliPadsCampaignMetrics,
} from "@/lib/meli/pads-api";
import { analyzePadsCampaigns } from "@/lib/meli/ads-analyzer";
import {
  coreToJsonRecord,
  getArgentinaDateKey,
  lastNDayKeys,
  MELI_ADS_BUCKET_TZ,
  rollupTotalsCores,
  totalsJsonToCore,
} from "@/lib/meli/ads-daily-bucket";

export const dynamic = "force-dynamic";

const SOURCE_DAILY_CUTOFF = "daily_cutoff";

type CampaignEnriched = MeliPadsCampaignRow & {
  site_id: string;
  advertiser_id: number;
  metrics_prev?: MeliPadsCampaignMetrics;
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getWindow(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { start: toIsoDate(start), end: toIsoDate(end) };
}

function getPreviousWindow(days: number) {
  const prevEnd = new Date();
  prevEnd.setDate(prevEnd.getDate() - days);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days);
  return { start: toIsoDate(prevStart), end: toIsoDate(prevEnd) };
}

function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function metricValue(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : undefined;
  if (typeof raw === "string") {
    const parsed = Number(raw.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const nested =
      metricValue(obj.value) ??
      metricValue(obj.amount) ??
      metricValue(obj.total) ??
      metricValue(obj.metric_value);
    if (nested != null) return nested;
  }
  return undefined;
}

function pickMetric(obj: Record<string, unknown> | undefined, keys: string[]): number {
  if (!obj) return 0;
  for (const k of keys) {
    const val = metricValue(obj[k]);
    if (val != null) return val;
  }
  return 0;
}

function padsSearchResults(data: unknown): MeliPadsCampaignRow[] {
  if (Array.isArray(data)) return data as MeliPadsCampaignRow[];
  if (!data || typeof data !== "object") return [];
  const o = data as Record<string, unknown>;
  for (const key of ["results", "campaigns", "elements", "items"]) {
    const arr = o[key];
    if (Array.isArray(arr) && arr.length > 0) return arr as MeliPadsCampaignRow[];
  }
  const nested = o.data;
  if (nested && typeof nested === "object") {
    const inner = nested as Record<string, unknown>;
    for (const key of ["results", "campaigns", "elements"]) {
      const arr = inner[key];
      if (Array.isArray(arr) && arr.length > 0) return arr as MeliPadsCampaignRow[];
    }
  }
  const fallback = o.results;
  return Array.isArray(fallback) ? (fallback as MeliPadsCampaignRow[]) : [];
}

function normalizeMetrics(raw?: Record<string, unknown>) {
  if (!raw) return undefined;
  const prints = pickMetric(raw, ["prints", "impressions", "impression", "views"]);
  const clicks = pickMetric(raw, ["clicks", "click"]);
  const cost = pickMetric(raw, ["cost", "spend", "amount_spent"]);
  let ctr = pickMetric(raw, ["ctr", "click_through_rate"]);
  if (ctr > 1) ctr = ctr / 100;
  return {
    ...raw,
    prints,
    clicks,
    cost,
    ctr,
    cpc: pickMetric(raw, ["cpc", "cost_per_click"]),
    acos: pickMetric(raw, ["acos", "acos_percent"]),
    cvr: pickMetric(raw, ["cvr", "conversion_rate"]),
    roas: pickMetric(raw, ["roas", "return_on_ad_spend"]),
    impression_share: pickMetric(raw, ["impression_share", "sov"]),
    top_impression_share: pickMetric(raw, ["top_impression_share"]),
    lost_impression_share_by_budget: pickMetric(raw, ["lost_impression_share_by_budget"]),
    lost_impression_share_by_ad_rank: pickMetric(raw, ["lost_impression_share_by_ad_rank"]),
    acos_benchmark: pickMetric(raw, ["acos_benchmark"]),
    total_amount: pickMetric(raw, ["total_amount", "amount", "revenue", "sales"]),
    direct_amount: pickMetric(raw, ["direct_amount"]),
    indirect_amount: pickMetric(raw, ["indirect_amount"]),
  };
}

function metricsCoreScore(metrics?: Record<string, unknown>) {
  if (!metrics) return 0;
  const prints = pickMetric(metrics, ["prints", "impressions"]);
  const clicks = pickMetric(metrics, ["clicks"]);
  const cost = pickMetric(metrics, ["cost", "spend", "amount_spent"]);
  const roas = pickMetric(metrics, ["roas", "return_on_ad_spend"]);
  const totalAmount = pickMetric(metrics, ["total_amount", "amount", "revenue", "sales"]);
  return prints + clicks + cost + roas + totalAmount;
}

function sumMetrics(rows: CampaignEnriched[]) {
  const totalBudget = rows.reduce((acc, r) => acc + n(r.budget), 0);
  const totalPrints = rows.reduce((acc, r) => acc + n(r.metrics?.prints), 0);
  const totalClicks = rows.reduce((acc, r) => acc + n(r.metrics?.clicks), 0);
  const totalCost = rows.reduce((acc, r) => acc + n(r.metrics?.cost), 0);
  const totalRevenue = rows.reduce((acc, r) => {
    const explicitRevenue = n((r.metrics as Record<string, unknown> | undefined)?.total_amount);
    if (explicitRevenue > 0) return acc + explicitRevenue;
    return acc + n(r.metrics?.roas) * n(r.metrics?.cost);
  }, 0);
  const totalProfit = totalRevenue - totalCost;
  return {
    campaigns: rows.length,
    budget: totalBudget,
    prints: totalPrints,
    clicks: totalClicks,
    ctr: totalPrints > 0 ? (totalClicks / totalPrints) * 100 : 0,
    cost: totalCost,
    acos: totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0,
    roas: totalCost > 0 ? totalRevenue / totalCost : 0,
    revenue: totalRevenue,
    profit: totalProfit,
  };
}

/** Lectura PADS con métricas solo para `dayKey` (YYYY-MM-DD): base del histórico diario sin solapar ventanas largas. */
async function padsCampaignsSingleDaySlice(
  accessToken: string,
  advertisers: { advertiser_id: number; site_id: string }[],
  dayKey: string,
  errorSink: string[]
): Promise<CampaignEnriched[]> {
  const out: CampaignEnriched[] = [];
  for (const adv of advertisers) {
    try {
      let camp = await meliPadsSearchCampaignsWithMetricsRange(
        accessToken,
        adv.site_id,
        adv.advertiser_id,
        dayKey,
        dayKey,
        0,
        50
      );
      if (!camp.ok || padsSearchResults(camp.data).length === 0) {
        if (!camp.ok) {
          errorSink.push(`PADS día ${dayKey} (${adv.advertiser_id}): métricas HTTP ${camp.status}`);
        }
        camp = await meliPadsSearchCampaignsBasic(accessToken, adv.site_id, adv.advertiser_id, 0, 50);
      }
      if (padsSearchResults(camp.data).length === 0) {
        const altWithMetrics = await meliPadsSearchCampaignsWithMetricsAltPath(
          accessToken,
          adv.site_id,
          adv.advertiser_id,
          dayKey,
          dayKey,
          0,
          50
        );
        if (altWithMetrics.ok && padsSearchResults(altWithMetrics.data).length > 0) {
          camp = altWithMetrics;
        }
      }
      const currentRows = padsSearchResults(camp.data).map((r) => ({
        row: r as MeliPadsCampaignRow,
        metrics: normalizeMetrics((r as MeliPadsCampaignRow).metrics as Record<string, unknown>),
      }));
      for (const row of currentRows) {
        const r = row.row as MeliPadsCampaignRow;
        out.push({
          ...r,
          metrics: row.metrics,
          site_id: adv.site_id,
          advertiser_id: adv.advertiser_id,
        });
      }
    } catch (e) {
      errorSink.push(
        `PADS día único (${dayKey}) advertiser ${adv.advertiser_id}: ${e instanceof Error ? e.message : "unknown"}`
      );
    }
  }
  return out;
}

function campaignTrendScore(current?: Record<string, unknown>, previous?: Record<string, unknown>): number {
  if (!current || !previous) return 0;
  const curCtr = pickMetric(current, ["ctr"]);
  const prevCtr = pickMetric(previous, ["ctr"]);
  const curAcos = pickMetric(current, ["acos"]);
  const prevAcos = pickMetric(previous, ["acos"]);
  const curRoas = pickMetric(current, ["roas"]);
  const prevRoas = pickMetric(previous, ["roas"]);
  const ctrScore = (curCtr - prevCtr) * 80;
  const acosScore = (prevAcos - curAcos) * 3;
  const roasScore = (curRoas - prevRoas) * 8;
  return Math.round((ctrScore + acosScore + roasScore) * 100) / 100;
}

function evaluateChangeOutcome(current?: Record<string, unknown>, previous?: Record<string, unknown>) {
  if (!current || !previous) return { outcome: "PENDING" as const, score: null as number | null, summary: "Sin datos suficientes para evaluar aún." };
  const curCtr = pickMetric(current, ["ctr"]);
  const prevCtr = pickMetric(previous, ["ctr"]);
  const curAcos = pickMetric(current, ["acos"]);
  const prevAcos = pickMetric(previous, ["acos"]);
  const curRoas = pickMetric(current, ["roas"]);
  const prevRoas = pickMetric(previous, ["roas"]);
  const score = (curCtr - prevCtr) * 120 + (prevAcos - curAcos) * 4 + (curRoas - prevRoas) * 10;
  const rounded = Math.round(score * 100) / 100;
  if (rounded >= 2) return { outcome: "POSITIVE" as const, score: rounded, summary: "Mejora consistente tras el cambio (CTR/ROAS al alza y/o ACOS a la baja)." };
  if (rounded <= -2) return { outcome: "NEGATIVE" as const, score: rounded, summary: "Deterioro de performance tras el cambio (CTR/ROAS caen y/o ACOS sube)." };
  return { outcome: "NEUTRAL" as const, score: rounded, summary: "Variación marginal; mantener observación en próximas ventanas." };
}

function parseCompareDaysParam(raw: string | null): number[] {
  const defaults = [1, 7, 15, 20];
  if (!raw || !raw.trim()) return defaults;
  const parsed = raw
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 365)
    .map((n) => Math.floor(n));
  const unique = Array.from(new Set(parsed));
  return unique.length > 0 ? unique.slice(0, 8) : defaults;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const meli = await getMeliAccessTokenForUser(session.user.id);
    if (!meli) {
      return NextResponse.json({ error: "Conectá Mercado Libre primero" }, { status: 400 });
    }

    const url = new URL(req.url);
    const analyze = url.searchParams.get("analyze") === "1";
    const days = Math.min(90, Math.max(7, Number(url.searchParams.get("days")) || 14));
    const compareDays = parseCompareDaysParam(url.searchParams.get("compare_days"));
    const currentWindow = getWindow(days);
    const previousWindow = getPreviousWindow(days);

    const errors: string[] = [];
    const advRes = await meliPadsListAdvertisers(meli.accessToken);
    const advertisers = advRes.data?.advertisers ?? [];
    if (!advRes.ok) {
      errors.push(`PADS advertisers HTTP ${advRes.status}`);
    }

    const campaigns: CampaignEnriched[] = [];
    const metricsSummaryByAdvertiser: Record<string, unknown> = {};
    const diagnosticsByAdvertiser: Record<string, unknown> = {};

    for (const adv of advertisers) {
      try {
        let camp = await meliPadsSearchCampaignsWithMetrics(
          meli.accessToken,
          adv.site_id,
          adv.advertiser_id,
          days,
          0,
          50
        );
        if (!camp.ok || padsSearchResults(camp.data).length === 0) {
          if (!camp.ok) {
            errors.push(`Campañas con métricas (${adv.advertiser_id}): HTTP ${camp.status}`);
          }
          camp = await meliPadsSearchCampaignsBasic(
            meli.accessToken,
            adv.site_id,
            adv.advertiser_id,
            0,
            50
          );
          if (!camp.ok) {
            errors.push(`Campañas básicas (${adv.advertiser_id}): HTTP ${camp.status}`);
            // No hacer continue: la ruta primaria puede fallar (4xx) y el fallback por query sigue siendo válido.
          }
        }

        // Fallback multi-tenant: endpoint alternativo sin segmento /advertisers/:id
        if (padsSearchResults(camp.data).length === 0) {
          const noSearchWithMetrics = await meliPadsCampaignsWithMetricsRangeNoSearch(
            meli.accessToken,
            adv.site_id,
            adv.advertiser_id,
            currentWindow.start,
            currentWindow.end,
            0,
            50
          );
          if (noSearchWithMetrics.ok && padsSearchResults(noSearchWithMetrics.data).length > 0) {
            camp = noSearchWithMetrics;
            errors.push(`Fallback no-search con métricas OK (${adv.advertiser_id})`);
          }
        }

        if (padsSearchResults(camp.data).length === 0) {
          const noSearchBasic = await meliPadsCampaignsBasicNoSearch(
            meli.accessToken,
            adv.site_id,
            adv.advertiser_id,
            0,
            50
          );
          if (noSearchBasic.ok && padsSearchResults(noSearchBasic.data).length > 0) {
            camp = noSearchBasic;
            errors.push(`Fallback no-search básico OK (${adv.advertiser_id})`);
          }
        }

        if (padsSearchResults(camp.data).length === 0) {
          const altWithMetrics = await meliPadsSearchCampaignsWithMetricsAltPath(
            meli.accessToken,
            adv.site_id,
            adv.advertiser_id,
            currentWindow.start,
            currentWindow.end,
            0,
            50
          );
          if (altWithMetrics.ok && padsSearchResults(altWithMetrics.data).length > 0) {
            camp = altWithMetrics;
            errors.push(`Fallback alt-path OK (${adv.advertiser_id})`);
          } else {
            const altBasic = await meliPadsSearchCampaignsBasicAltPath(
              meli.accessToken,
              adv.site_id,
              adv.advertiser_id,
              0,
              50
            );
            if (altBasic.ok && padsSearchResults(altBasic.data).length > 0) {
              camp = altBasic;
              errors.push(`Fallback alt-path básico OK (${adv.advertiser_id})`);
            }
          }
        }

        const prevCamp = await meliPadsSearchCampaignsWithMetricsRange(
          meli.accessToken,
          adv.site_id,
          adv.advertiser_id,
          previousWindow.start,
          previousWindow.end,
          0,
          50
        );
        if (!prevCamp.ok) {
          errors.push(`Campañas período previo (${adv.advertiser_id}): HTTP ${prevCamp.status}`);
        }
        let currentRows = padsSearchResults(camp.data).map((r) => ({
          row: r as MeliPadsCampaignRow,
          metrics: normalizeMetrics((r as MeliPadsCampaignRow).metrics as Record<string, unknown>),
        }));

        const pagingInfo = (camp.data as Record<string, unknown> | undefined)?.paging as
          | { total?: number; offset?: number; limit?: number }
          | undefined;
        if (
          currentRows.length === 0 &&
          pagingInfo &&
          typeof pagingInfo.total === "number" &&
          pagingInfo.total > 0
        ) {
          errors.push(
            `PADS: paging.total=${pagingInfo.total} pero lista vacía en respuesta (${adv.advertiser_id}, ${adv.site_id})`
          );
        }

        const currentAllZero =
          currentRows.length > 0 &&
          currentRows.every((x) => metricsCoreScore(x.metrics as Record<string, unknown>) <= 0);

        let currentFallbackHits = 0;
        if (currentAllZero) {
          const fallbackRows = await Promise.allSettled(
            currentRows.map(async (x) => {
              const detail = await meliPadsGetCampaignWithMetrics(
                meli.accessToken,
                adv.site_id,
                Number(x.row.id),
                currentWindow.start,
                currentWindow.end
              );
              if (detail.ok && detail.data) {
                const metrics = normalizeMetrics(detail.data.metrics as Record<string, unknown>);
                if (metricsCoreScore(metrics as Record<string, unknown>) > 0) {
                  currentFallbackHits += 1;
                }
                return { row: { ...x.row, ...detail.data }, metrics };
              }
              return x;
            })
          );
          currentRows = fallbackRows.map((r, idx) => {
            if (r.status === "fulfilled") return r.value;
            errors.push(`Fallback campaña actual (${adv.advertiser_id}): ${String(r.reason)}`);
            return currentRows[idx];
          });
        }

        let prevRows = padsSearchResults(prevCamp.data).map((r) => ({
          row: r as MeliPadsCampaignRow,
          metrics: normalizeMetrics((r as MeliPadsCampaignRow).metrics as Record<string, unknown>),
        }));

        const prevAllZero =
          prevRows.length > 0 &&
          prevRows.every((x) => metricsCoreScore(x.metrics as Record<string, unknown>) <= 0);

        let prevFallbackHits = 0;
        if (prevAllZero) {
          const fallbackPrev = await Promise.allSettled(
            prevRows.map(async (x) => {
              const detail = await meliPadsGetCampaignWithMetrics(
                meli.accessToken,
                adv.site_id,
                Number(x.row.id),
                previousWindow.start,
                previousWindow.end
              );
              if (detail.ok && detail.data) {
                const metrics = normalizeMetrics(detail.data.metrics as Record<string, unknown>);
                if (metricsCoreScore(metrics as Record<string, unknown>) > 0) {
                  prevFallbackHits += 1;
                }
                return { row: { ...x.row, ...detail.data }, metrics };
              }
              return x;
            })
          );
          prevRows = fallbackPrev.map((r, idx) => {
            if (r.status === "fulfilled") return r.value;
            errors.push(`Fallback campaña previa (${adv.advertiser_id}): ${String(r.reason)}`);
            return prevRows[idx];
          });
        }

        const prevByCampaignId = new Map<number, MeliPadsCampaignMetrics>();
        for (const p of prevRows) {
          if (p.row.id != null && p.metrics) {
            prevByCampaignId.set(Number(p.row.id), p.metrics);
          }
        }
        const metricsSummary = camp.data?.metrics_summary;
        if (metricsSummary != null) {
          metricsSummaryByAdvertiser[String(adv.advertiser_id)] = metricsSummary;
        }

        diagnosticsByAdvertiser[String(adv.advertiser_id)] = {
          campaignCount: currentRows.length,
          currentAllZeroBeforeFallback: currentAllZero,
          currentFallbackHits,
          previousAllZeroBeforeFallback: prevAllZero,
          previousFallbackHits: prevFallbackHits,
        };

        for (const row of currentRows) {
          const r = row.row as MeliPadsCampaignRow;
          campaigns.push({
            ...r,
            metrics: row.metrics,
            site_id: adv.site_id,
            advertiser_id: adv.advertiser_id,
            metrics_prev: prevByCampaignId.get(Number(r.id)),
          });
        }
      } catch (e) {
        errors.push(
          `Advertiser ${adv.advertiser_id} (${adv.site_id}) fallo parcial: ${
            e instanceof Error ? e.message : "unknown_error"
          }`
        );
      }
    }

    let promotions: unknown = null;
    const promoRes = await meliGetSellerPromotions(meli.accessToken, meli.meliUserId);
    if (promoRes.ok) promotions = promoRes.data;

    let recommendations: ReturnType<typeof analyzePadsCampaigns> = [];
    if (analyze && campaigns.length > 0) {
      recommendations = analyzePadsCampaigns({
        advertisers,
        campaigns,
      });
    }

    const totals = sumMetrics(campaigns);
    const previousTotals = sumMetrics(
      campaigns.map((c) => ({
        ...c,
        metrics: c.metrics_prev,
      }))
    );

    const bucketDateKey = getArgentinaDateKey();
    const dailySliceCampaigns = await padsCampaignsSingleDaySlice(
      meli.accessToken,
      advertisers,
      bucketDateKey,
      errors
    );
    let totalsForPersist = sumMetrics(dailySliceCampaigns);
    let persistedMetricsDays = 1;
    if (
      advertisers.length > 0 &&
      totalsForPersist.cost === 0 &&
      totalsForPersist.clicks === 0 &&
      totalsForPersist.prints === 0 &&
      campaigns.length > 0
    ) {
      totalsForPersist = totals;
      persistedMetricsDays = days;
      errors.push(
        "PADS histórico diario: sin métricas de un solo día en ML; este corte usa la ventana larga como respaldo."
      );
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    const daysElapsed = Math.max(1, Math.ceil((Date.now() - monthStart.getTime()) / 86_400_000));
    const avgDailySpent = totals.cost / Math.max(1, days);
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(0, daysInMonth - new Date().getDate());
    const nextInvoiceProjection = avgDailySpent * daysRemaining;

    let createdSnapshot: { id: string; createdAt: Date } | null = null;
    let dailyStats: Array<{ day: string; snapshots: number; avgCost: number; avgRevenue: number; avgProfit: number }> = [];
    let rolledTotals: Array<{ windowDays: number; daysIncluded: number; totals: Record<string, number> }> = [];
    let dailyHistory: Array<{ bucketDateKey: string; updatedAt: string; totals: Record<string, number> }> = [];
    let dailyCutoffMeta: {
      timezone: string;
      bucketDateKey: string;
      source: string;
      snapshotUpdatedAt: string | null;
    } | null = null;
    let changeSummary = { positive: 0, negative: 0, neutral: 0, pending: 0 };
    let comparisons: Array<{
      daysAgo: number;
      snapshotAt: string | null;
      metrics: Record<string, number>;
      deltasVsNow: Record<string, number>;
    }> = [];
    try {
      const prevBucketKey = lastNDayKeys(bucketDateKey, 2)[0];
      const prevSnap = await prisma.meliAdsSnapshot.findFirst({
        where: {
          userId: session.user.id,
          bucketDateKey: prevBucketKey,
          source: SOURCE_DAILY_CUTOFF,
        },
        select: { totals: true },
      });
      const prevDailyCore = prevSnap?.totals
        ? totalsJsonToCore(prevSnap.totals as Record<string, unknown>)
        : null;
      const zeroPersistDeltas = {
        prints: 0,
        clicks: 0,
        ctr: 0,
        cost: 0,
        acos: 0,
        roas: 0,
        budget: 0,
        revenue: 0,
        profit: 0,
      };
      const deltasPayload = (prevDailyCore
        ? {
            prints: totalsForPersist.prints - prevDailyCore.prints,
            clicks: totalsForPersist.clicks - prevDailyCore.clicks,
            ctr: totalsForPersist.ctr - prevDailyCore.ctr,
            cost: totalsForPersist.cost - prevDailyCore.cost,
            acos: totalsForPersist.acos - prevDailyCore.acos,
            roas: totalsForPersist.roas - prevDailyCore.roas,
            budget: totalsForPersist.budget - prevDailyCore.budget,
            revenue: totalsForPersist.revenue - prevDailyCore.revenue,
            profit: totalsForPersist.profit - prevDailyCore.profit,
          }
        : zeroPersistDeltas) as unknown as object;

      const snapshotPersistPayload = {
        metricsDays: persistedMetricsDays,
        advertisersCount: advertisers.length,
        campaignsCount: campaigns.length,
        recommendationsCount: recommendations.length,
        totals: totalsForPersist as unknown as object,
        deltas: deltasPayload,
        diagnostics: diagnosticsByAdvertiser as unknown as object,
        errors: errors as unknown as object,
        source: SOURCE_DAILY_CUTOFF,
        bucketDateKey,
      };

      const existingDaily = await prisma.meliAdsSnapshot.findFirst({
        where: {
          userId: session.user.id,
          bucketDateKey,
          source: SOURCE_DAILY_CUTOFF,
        },
        select: { id: true },
      });

      createdSnapshot = await prisma.$transaction(async (tx) => {
        let snapshotId: string;
        let createdAt: Date;

        if (existingDaily) {
          await tx.meliAdsCampaignSnapshot.deleteMany({ where: { snapshotId: existingDaily.id } });
          await tx.meliAdsSnapshot.update({
            where: { id: existingDaily.id },
            data: snapshotPersistPayload,
          });
          const refreshed = await tx.meliAdsSnapshot.findUniqueOrThrow({
            where: { id: existingDaily.id },
            select: { createdAt: true },
          });
          snapshotId = existingDaily.id;
          createdAt = refreshed.createdAt;
        } else {
          const row = await tx.meliAdsSnapshot.create({
            data: {
              userId: session.user.id,
              ...snapshotPersistPayload,
            },
            select: { id: true, createdAt: true },
          });
          snapshotId = row.id;
          createdAt = row.createdAt;
        }

        if (campaigns.length > 0) {
          await tx.meliAdsCampaignSnapshot.createMany({
            data: campaigns.map((c) => ({
              snapshotId,
              campaignId: Number(c.id),
              advertiserId: Number(c.advertiser_id),
              siteId: c.site_id,
              name: c.name ?? null,
              status: c.status ?? null,
              strategy: c.strategy ?? null,
              budget: c.budget != null ? Number(c.budget) : null,
              roasTarget: c.roas_target != null ? Number(c.roas_target) : null,
              metrics: (c.metrics ?? null) as unknown as object | null,
              metricsPrev: (c.metrics_prev ?? null) as unknown as object | null,
              trendScore: campaignTrendScore(
                c.metrics as unknown as Record<string, unknown> | undefined,
                c.metrics_prev as unknown as Record<string, unknown> | undefined
              ),
            })),
          });
        }

        return { id: snapshotId, createdAt };
      });

      const persistedMeta = await prisma.meliAdsSnapshot.findUnique({
        where: { id: createdSnapshot!.id },
        select: { updatedAt: true },
      });
      dailyCutoffMeta = {
        timezone: MELI_ADS_BUCKET_TZ,
        bucketDateKey,
        source: SOURCE_DAILY_CUTOFF,
        snapshotUpdatedAt: persistedMeta?.updatedAt.toISOString() ?? null,
      };

      const pendingChanges = await prisma.meliAdsChange.findMany({
        where: {
          userId: session.user.id,
          outcome: "PENDING",
        },
        orderBy: { appliedAt: "desc" },
        take: 200,
      });
      const byCampaign = new Map<string, CampaignEnriched>();
      for (const c of campaigns) byCampaign.set(`${c.site_id}:${c.id}`, c);
      for (const ch of pendingChanges) {
        const key = `${ch.siteId}:${ch.campaignId}`;
        const cmp = byCampaign.get(key);
        if (!cmp) continue;
        const evalRes = evaluateChangeOutcome(
          cmp.metrics as unknown as Record<string, unknown> | undefined,
          cmp.metrics_prev as unknown as Record<string, unknown> | undefined
        );
        if (evalRes.outcome === "PENDING") continue;
        await prisma.meliAdsChange.update({
          where: { id: ch.id },
          data: {
            outcome: evalRes.outcome,
            outcomeScore: evalRes.score,
            outcomeSummary: evalRes.summary,
            evaluatedAt: new Date(),
            evaluatedSnapshotId: createdSnapshot?.id ?? null,
          },
        });
      }

      const dailyRows = await prisma.meliAdsSnapshot.findMany({
        where: {
          userId: session.user.id,
          source: SOURCE_DAILY_CUTOFF,
          bucketDateKey: { not: null },
        },
        orderBy: { bucketDateKey: "desc" },
        take: 120,
        select: { bucketDateKey: true, totals: true, updatedAt: true },
      });

      const byBucket = new Map<string, { totals: Record<string, unknown>; updatedAt: Date }>();
      for (const row of dailyRows) {
        if (row.bucketDateKey) {
          byBucket.set(row.bucketDateKey, {
            totals: (row.totals ?? {}) as Record<string, unknown>,
            updatedAt: row.updatedAt,
          });
        }
      }

      const dailyAsc = [...dailyRows].sort((a, b) =>
        (a.bucketDateKey ?? "") < (b.bucketDateKey ?? "") ? -1 : 1
      );
      dailyStats = dailyAsc.slice(-30).map((row) => {
        const t = (row.totals ?? {}) as Record<string, unknown>;
        return {
          day: row.bucketDateKey ?? "",
          snapshots: 1,
          avgCost: n(t.cost),
          avgRevenue: n(t.revenue),
          avgProfit: n(t.profit),
        };
      });

      dailyHistory = dailyAsc.slice(-90).map((row) => ({
        bucketDateKey: row.bucketDateKey ?? "",
        updatedAt: row.updatedAt.toISOString(),
        totals: coreToJsonRecord(totalsJsonToCore((row.totals ?? {}) as Record<string, unknown>)),
      }));

      rolledTotals = [7, 15, 20].map((windowDays) => {
        const keys = lastNDayKeys(bucketDateKey, windowDays);
        const cores = keys
          .map((k) => byBucket.get(k))
          .filter(Boolean)
          .map((entry) => totalsJsonToCore(entry!.totals));
        const rolled = rollupTotalsCores(cores);
        return {
          windowDays,
          daysIncluded: cores.length,
          totals: coreToJsonRecord(rolled),
        };
      });

      const changeSummaryRows = await prisma.meliAdsChange.groupBy({
        by: ["outcome"],
        where: { userId: session.user.id },
        _count: { _all: true },
      });
      changeSummary = {
        positive: changeSummaryRows.find((r) => r.outcome === "POSITIVE")?._count._all ?? 0,
        negative: changeSummaryRows.find((r) => r.outcome === "NEGATIVE")?._count._all ?? 0,
        neutral: changeSummaryRows.find((r) => r.outcome === "NEUTRAL")?._count._all ?? 0,
        pending: changeSummaryRows.find((r) => r.outcome === "PENDING")?._count._all ?? 0,
      };

      const totalsNow = {
        prints: totalsForPersist.prints,
        clicks: totalsForPersist.clicks,
        ctr: totalsForPersist.ctr,
        cost: totalsForPersist.cost,
        acos: totalsForPersist.acos,
        roas: totalsForPersist.roas,
        budget: totalsForPersist.budget,
        revenue: totalsForPersist.revenue,
        profit: totalsForPersist.profit,
      };
      comparisons = compareDays.map((d) => {
        const keysWindow = lastNDayKeys(bucketDateKey, d + 1);
        const targetKey = keysWindow[0];
        const hit = targetKey ? byBucket.get(targetKey) : undefined;
        const baseCore = hit ? totalsJsonToCore(hit.totals) : rollupTotalsCores([]);
        const base = coreToJsonRecord(baseCore);
        return {
          daysAgo: d,
          snapshotAt: hit ? hit.updatedAt.toISOString() : null,
          metrics: base,
          deltasVsNow: {
            prints: totalsNow.prints - base.prints,
            clicks: totalsNow.clicks - base.clicks,
            ctr: totalsNow.ctr - base.ctr,
            cost: totalsNow.cost - base.cost,
            acos: totalsNow.acos - base.acos,
            roas: totalsNow.roas - base.roas,
            budget: totalsNow.budget - base.budget,
            revenue: totalsNow.revenue - base.revenue,
            profit: totalsNow.profit - base.profit,
          },
        };
      });
    } catch (persistErr) {
      errors.push(
        `Persistencia Ads no disponible: ${
          persistErr instanceof Error ? persistErr.message : "db_history_unavailable"
        }`
      );
    }

    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      snapshotId: createdSnapshot?.id ?? null,
      metricsDays: days,
      currentWindow,
      previousWindow,
      advertisers,
      campaigns,
      metricsSummaryByAdvertiser,
      diagnosticsByAdvertiser,
      totals,
      previousTotals,
      deltas: {
        prints: totals.prints - previousTotals.prints,
        clicks: totals.clicks - previousTotals.clicks,
        ctr: totals.ctr - previousTotals.ctr,
        cost: totals.cost - previousTotals.cost,
        acos: totals.acos - previousTotals.acos,
        roas: totals.roas - previousTotals.roas,
        budget: totals.budget - previousTotals.budget,
        revenue: totals.revenue - previousTotals.revenue,
        profit: totals.profit - previousTotals.profit,
      },
      finance: {
        avgDailySpent,
        nextInvoiceProjection,
        daysElapsed,
      },
      dailyCutoff: dailyCutoffMeta,
      rolledTotals,
      dailyHistory,
      dailyStats,
      changeSummary,
      comparisons,
      promotions,
      recommendations,
      errors,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "snapshot_error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
