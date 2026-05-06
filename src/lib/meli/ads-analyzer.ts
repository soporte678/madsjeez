import type { MeliPadsCampaignRow, MeliPadsAdvertiser } from "./pads-api";

export type AdsApplyPayload = {
  name: string;
  status: string;
  budget: number;
  strategy: string;
  channel: string;
  roas_target: number;
};

export type AdsRecommendation = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  rationale: string;
  advertiserId: number;
  siteId: string;
  campaignId: number;
  campaignName: string;
  applyPayload: AdsApplyPayload;
};

function strategyToApi(s?: string): string {
  const u = (s || "profitability").toUpperCase();
  if (u === "PROFITABILITY" || u === "INCREASE" || u === "VISIBILITY") {
    return u.toLowerCase();
  }
  return "profitability";
}

/** Corrige ROAS si solo hay ACOS legado. */
function normalizeRoas(row: MeliPadsCampaignRow): number {
  if (row.roas_target != null && row.roas_target > 0) return Number(row.roas_target);
  const acos = Number(row.acos_target);
  if (acos > 0) return Math.min(50, Math.max(1, 100 / acos));
  return 5;
}

function buildBasePayload(row: MeliPadsCampaignRow, channel = "marketplace"): AdsApplyPayload {
  return {
    name: row.name || `Campaign ${row.id}`,
    status: (row.status || "active").toLowerCase(),
    budget: Number(row.budget ?? 0),
    strategy: strategyToApi(row.strategy),
    channel,
    roas_target: normalizeRoas(row),
  };
}

/**
 * Reglas heurísticas estilo gestión de performance (CTR, ACOS vs benchmark, pérdida por presupuesto).
 * Los cambios son conservadores; revisá siempre en ML.
 */
export function analyzePadsCampaigns(input: {
  advertisers: MeliPadsAdvertiser[];
  campaigns: Array<
    MeliPadsCampaignRow & { site_id: string; advertiser_id: number }
  >;
}): AdsRecommendation[] {
  const out: AdsRecommendation[] = [];
  let seq = 0;
  const advById = new Map(input.advertisers.map((a) => [a.advertiser_id, a]));

  for (const row of input.campaigns) {
    const siteId = row.site_id;
    const advId = row.advertiser_id;
    const adv = advById.get(advId);
    if (!adv) continue;

    const m = row.metrics || {};
    const status = (row.status || "").toLowerCase();
    const roas = normalizeRoas(row);
    const base = buildBasePayload(row);
    base.roas_target = roas;

    const prints = Number(m.prints ?? 0);
    const clicks = Number(m.clicks ?? 0);
    const cost = Number(m.cost ?? 0);
    const ctr = prints > 0 ? clicks / prints : Number(m.ctr ?? 0);
    const acos = Number(m.acos ?? 0);
    const bench = Number(m.acos_benchmark ?? 0);
    const lostBudget = Number(m.lost_impression_share_by_budget ?? 0);
    const roasActual = Number(m.roas ?? 0);

    // 1) Muchas impresiones, CTR muy bajo: priorizar profitability + ROAS más exigente
    if (status === "active" && prints >= 800 && ctr > 0 && ctr < 0.004 && cost >= 5) {
      const newRoas = Math.min(40, roas * 1.2);
      seq += 1;
      out.push({
        id: `pads-${row.id}-low-ctr-${seq}`,
        severity: "warning",
        title: "CTR bajo con volumen de impresiones",
        rationale:
          "Hay exposición pero pocos clics: conviene orientar la campaña a rentabilidad y encarecer levemente el objetivo ROAS para que ML priorice intención de compra más alta.",
        advertiserId: advId,
        siteId,
        campaignId: row.id,
        campaignName: row.name || String(row.id),
        applyPayload: {
          ...base,
          strategy: "profitability",
          roas_target: Math.round(newRoas * 100) / 100,
        },
      });
    }

    // 2) ACOS muy por encima del benchmark
    if (status === "active" && acos > 0 && bench > 0 && acos > bench * 1.45 && cost >= 10) {
      const newRoas = Math.min(45, roas * 1.25);
      seq += 1;
      out.push({
        id: `pads-${row.id}-acos-${seq}`,
        severity: "critical",
        title: "ACOS por encima del benchmark",
        rationale:
          "El ACOS de la campaña supera ampliamente la referencia de Mercado Libre. Subir el ROAS objetivo reduce agresividad y suele bajar el ACOS efectivo.",
        advertiserId: advId,
        siteId,
        campaignId: row.id,
        campaignName: row.name || String(row.id),
        applyPayload: {
          ...base,
          strategy: "profitability",
          roas_target: Math.round(newRoas * 100) / 100,
        },
      });
    }

    // 3) Pérdida de impresiones por presupuesto
    if (status === "active" && lostBudget >= 0.2 && Number(row.budget) > 0) {
      const bump = Math.min(Number(row.budget) * 1.12, Number(row.budget) + 500);
      const newBudget = Math.round(bump * 100) / 100;
      seq += 1;
      out.push({
        id: `pads-${row.id}-budget-${seq}`,
        severity: "info",
        title: "Tráfico limitado por presupuesto",
        rationale:
          "Una parte relevante de las impresiones se pierde por presupuesto. Si la cuenta es rentable, un aumento moderado del presupuesto diario puede recuperar alcance.",
        advertiserId: advId,
        siteId,
        campaignId: row.id,
        campaignName: row.name || String(row.id),
        applyPayload: {
          ...base,
          budget: newBudget,
        },
      });
    }

    // 4) Sin impresiones en la ventana
    if (status === "active" && prints === 0 && cost === 0) {
      seq += 1;
      out.push({
        id: `pads-${row.id}-no-print-${seq}`,
        severity: "info",
        title: "Sin impresiones en el período",
        rationale:
          "Si el ítem es nuevo o tiene poca trayectoria, una estrategia visibility suele acelerar datos; cuando haya volumen, volvé a profitability.",
        advertiserId: advId,
        siteId,
        campaignId: row.id,
        campaignName: row.name || String(row.id),
        applyPayload: {
          ...base,
          strategy: "visibility",
          roas_target: Math.max(2, roas * 0.85),
        },
      });
    }

    // 5) Performance muy por encima del objetivo: opción de escalar suavemente
    if (
      status === "active" &&
      roasActual > 0 &&
      roasActual >= roas * 1.35 &&
      prints > 200 &&
      lostBudget < 0.05
    ) {
      const newBudget = Math.round(Number(row.budget) * 1.1 * 100) / 100;
      seq += 1;
      out.push({
        id: `pads-${row.id}-scale-${seq}`,
        severity: "info",
        title: "ROAS real muy superior al objetivo",
        rationale:
          "Hay margen para captar más demanda sin tensionar el ROAS: incremento moderado de presupuesto manteniendo la estrategia actual.",
        advertiserId: advId,
        siteId,
        campaignId: row.id,
        campaignName: row.name || String(row.id),
        applyPayload: {
          ...base,
          budget: newBudget,
        },
      });
    }
  }

  const seen = new Set<string>();
  return out.filter((r) => {
    const k = `${r.campaignId}:${r.title}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
