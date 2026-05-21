/** Corte diario e histórico PADS — zona horaria fija para negocio AR (.com.ar). */

import { format, parseISO, subDays } from "date-fns";

export const MELI_ADS_BUCKET_TZ = "America/Argentina/Buenos_Aires";

/** YYYY-MM-DD del día civil en Argentina (usado como clave de bucket único por usuario). */
export function getArgentinaDateKey(now = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: MELI_ADS_BUCKET_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now);
}

export function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export type AdsTotalsCore = {
  prints: number;
  clicks: number;
  cost: number;
  revenue: number;
  profit: number;
  budget: number;
  campaigns: number;
  ctr: number;
  acos: number;
  roas: number;
};

export function totalsJsonToCore(raw: Record<string, unknown> | null | undefined): AdsTotalsCore {
  const t = raw ?? {};
  const prints = n(t.prints);
  const clicks = n(t.clicks);
  const cost = n(t.cost);
  const revenue = n(t.revenue);
  const profit = n(t.profit);
  const budget = n(t.budget);
  const campaigns = n(t.campaigns);
  const ctr = prints > 0 ? (clicks / prints) * 100 : n(t.ctr);
  const acos = revenue > 0 ? (cost / revenue) * 100 : n(t.acos);
  const roas = cost > 0 ? revenue / cost : n(t.roas);
  return { prints, clicks, cost, revenue, profit, budget, campaigns, ctr, acos, roas };
}

/** Suma métricas aditivas de varios cortes diarios y recalcula CTR/ACOS/ROAS agregados. */
export function rollupTotalsCores(rows: AdsTotalsCore[]): AdsTotalsCore {
  const acc = {
    prints: 0,
    clicks: 0,
    cost: 0,
    revenue: 0,
    profit: 0,
    budget: 0,
    campaigns: 0,
    ctr: 0,
    acos: 0,
    roas: 0,
  };
  for (const r of rows) {
    acc.prints += r.prints;
    acc.clicks += r.clicks;
    acc.cost += r.cost;
    acc.revenue += r.revenue;
    acc.profit += r.profit;
    acc.budget += r.budget;
    acc.campaigns += r.campaigns;
  }
  acc.ctr = acc.prints > 0 ? (acc.clicks / acc.prints) * 100 : 0;
  acc.acos = acc.revenue > 0 ? (acc.cost / acc.revenue) * 100 : 0;
  acc.roas = acc.cost > 0 ? acc.revenue / acc.cost : 0;
  return acc;
}

export function coreToJsonRecord(c: AdsTotalsCore): Record<string, number> {
  return {
    prints: c.prints,
    clicks: c.clicks,
    cost: c.cost,
    revenue: c.revenue,
    profit: c.profit,
    budget: c.budget,
    campaigns: c.campaigns,
    ctr: c.ctr,
    acos: c.acos,
    roas: c.roas,
  };
}

/** Últimos N días civiles (clave YYYY-MM-DD) terminando en `endKey` (inclusive), orden ascendente. */
export function lastNDayKeys(endKey: string, n: number): string[] {
  const end = parseISO(endKey);
  if (Number.isNaN(end.getTime()) || n < 1) return [];
  const keys: string[] = [];
  for (let back = n - 1; back >= 0; back--) {
    keys.push(format(subDays(end, back), "yyyy-MM-dd"));
  }
  return keys;
}
