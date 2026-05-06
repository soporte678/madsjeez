import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeliAccessTokenForUser } from "@/lib/meli/prisma-session";
import { meliGetSellerPromotions } from "@/lib/meli/api";
import {
  meliPadsListAdvertisers,
  meliPadsSearchCampaignsBasic,
  meliPadsSearchCampaignsWithMetrics,
  meliPadsSearchCampaignsWithMetricsRange,
  type MeliPadsCampaignRow,
  type MeliPadsCampaignMetrics,
} from "@/lib/meli/pads-api";
import { analyzePadsCampaigns } from "@/lib/meli/ads-analyzer";

export const dynamic = "force-dynamic";

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
    impression_share: pickMetric(raw, ["impression_share"]),
    top_impression_share: pickMetric(raw, ["top_impression_share"]),
    lost_impression_share_by_budget: pickMetric(raw, ["lost_impression_share_by_budget"]),
    lost_impression_share_by_ad_rank: pickMetric(raw, ["lost_impression_share_by_ad_rank"]),
    acos_benchmark: pickMetric(raw, ["acos_benchmark"]),
  };
}

function sumMetrics(rows: CampaignEnriched[]) {
  const totalBudget = rows.reduce((acc, r) => acc + n(r.budget), 0);
  const totalPrints = rows.reduce((acc, r) => acc + n(r.metrics?.prints), 0);
  const totalClicks = rows.reduce((acc, r) => acc + n(r.metrics?.clicks), 0);
  const totalCost = rows.reduce((acc, r) => acc + n(r.metrics?.cost), 0);
  const totalRevenue = rows.reduce((acc, r) => acc + n(r.metrics?.roas) * n(r.metrics?.cost), 0);
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

    for (const adv of advertisers) {
      let camp = await meliPadsSearchCampaignsWithMetrics(
        meli.accessToken,
        adv.site_id,
        adv.advertiser_id,
        days,
        0,
        50
      );
      if (!camp.ok || !(camp.data.results?.length)) {
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
          continue;
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
      const prevByCampaignId = new Map<number, MeliPadsCampaignMetrics>();
      for (const p of prevCamp.data?.results ?? []) {
        if (p.id != null && p.metrics) {
          prevByCampaignId.set(Number(p.id), normalizeMetrics(p.metrics as Record<string, unknown>));
        }
      }

      if (camp.data.metrics_summary != null) {
        metricsSummaryByAdvertiser[String(adv.advertiser_id)] = camp.data.metrics_summary;
      }

      for (const row of camp.data.results ?? []) {
        const r = row as MeliPadsCampaignRow;
        campaigns.push({
          ...r,
          metrics: normalizeMetrics(r.metrics as Record<string, unknown>),
          site_id: adv.site_id,
          advertiser_id: adv.advertiser_id,
          metrics_prev: prevByCampaignId.get(Number(r.id)),
        });
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

    const monthStart = new Date();
    monthStart.setDate(1);
    const daysElapsed = Math.max(1, Math.ceil((Date.now() - monthStart.getTime()) / 86_400_000));
    const avgDailySpent = totals.cost / Math.max(1, days);
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(0, daysInMonth - new Date().getDate());
    const nextInvoiceProjection = avgDailySpent * daysRemaining;

    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      metricsDays: days,
      currentWindow,
      previousWindow,
      advertisers,
      campaigns,
      metricsSummaryByAdvertiser,
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
      promotions,
      recommendations,
      errors,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "snapshot_error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
