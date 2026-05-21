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
  category: "positive" | "negative" | "efficiency" | "growth";
  expectedImpact: "positive" | "negative" | "neutral";
  confidence: number;
  priorityScore: number;
  title: string;
  rationale: string;
  advertiserId: number;
  siteId: string;
  campaignId: number;
  campaignName: string;
  /** Presupuesto diario actual reportado por PADS (antes de aplicar sugerencias). */
  campaignBudget: number;
  /** Cantidad de publicaciones/items en la campaña (proxy desde métricas ML). */
  campaignItemsCount: number;
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

/** Cantidad de publicaciones/productos (métricas PADS; si ML no envía, 0). */
function estimateCampaignItemsCount(row: MeliPadsCampaignRow): number {
  const m = row.metrics as Record<string, unknown> | undefined;
  if (!m) return 0;
  const advertising = Number(m.advertising_items_quantity);
  if (Number.isFinite(advertising) && advertising > 0) return Math.round(advertising);
  const sum =
    (Number.isFinite(Number(m.direct_items_quantity)) ? Number(m.direct_items_quantity) : 0) +
    (Number.isFinite(Number(m.indirect_items_quantity)) ? Number(m.indirect_items_quantity) : 0) +
    (Number.isFinite(Number(m.organic_items_quantity)) ? Number(m.organic_items_quantity) : 0);
  return sum > 0 ? Math.round(sum) : 0;
}

function campaignCardStats(row: MeliPadsCampaignRow): Pick<AdsRecommendation, "campaignBudget" | "campaignItemsCount"> {
  return {
    campaignBudget: Math.round(Number(row.budget ?? 0) * 100) / 100,
    campaignItemsCount: estimateCampaignItemsCount(row),
  };
}

/**
 * Reglas heurísticas estilo gestión de performance (CTR, ACOS vs valor de referencia, pérdida por presupuesto).
 * Los cambios son conservadores; revisá siempre en ML.
 */
export function analyzePadsCampaigns(input: {
  advertisers: MeliPadsAdvertiser[];
  campaigns: Array<
    MeliPadsCampaignRow & {
      site_id: string;
      advertiser_id: number;
      metrics_prev?: Record<string, number | undefined>;
    }
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
    const prev = row.metrics_prev || {};
    const prevCtr = Number(prev.ctr ?? 0);
    const prevAcos = Number(prev.acos ?? 0);
    const prevRoas = Number(prev.roas ?? 0);
    const trend =
      prevCtr || prevAcos || prevRoas
        ? ` Tendencia vs período anterior: CTR ${((ctr - prevCtr) * 100).toFixed(2)} pp, ACOS ${(acos - prevAcos).toFixed(2)} pp, ROAS ${(roasActual - prevRoas).toFixed(2)}.`
        : "";

    // 1) Muchas impresiones, CTR muy bajo: priorizar profitability + ROAS más exigente
    if (status === "active" && prints >= 800 && ctr > 0 && ctr < 0.004 && cost >= 5) {
      const newRoas = Math.min(40, roas * 1.2);
      seq += 1;
      out.push({
        id: `pads-${row.id}-low-ctr-${seq}`,
        severity: "warning",
        category: "negative",
        expectedImpact: "positive",
        confidence: 0.81,
        priorityScore: 82,
        title: "CTR bajo con volumen de impresiones",
        rationale:
          `Hay exposición pero pocos clics: conviene orientar la campaña a rentabilidad y encarecer levemente el objetivo ROAS para que ML priorice intención de compra más alta.${trend}`,
        advertiserId: advId,
        siteId,
        campaignId: row.id,
        campaignName: row.name || String(row.id),
        ...campaignCardStats(row),
        applyPayload: {
          ...base,
          strategy: "profitability",
          roas_target: Math.round(newRoas * 100) / 100,
        },
      });
    }

    // 2) ACOS muy por encima del valor de referencia
    if (status === "active" && acos > 0 && bench > 0 && acos > bench * 1.45 && cost >= 10) {
      const newRoas = Math.min(45, roas * 1.25);
      seq += 1;
      out.push({
        id: `pads-${row.id}-acos-${seq}`,
        severity: "critical",
        category: "negative",
        expectedImpact: "positive",
        confidence: 0.88,
        priorityScore: 93,
        title: "ACOS por encima del valor de referencia",
        rationale:
          `El ACOS de la campaña supera ampliamente la referencia de Mercado Libre. Subir el ROAS objetivo reduce agresividad y suele bajar el ACOS efectivo.${trend}`,
        advertiserId: advId,
        siteId,
        campaignId: row.id,
        campaignName: row.name || String(row.id),
        ...campaignCardStats(row),
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
        category: "growth",
        expectedImpact: "positive",
        confidence: 0.72,
        priorityScore: 71,
        title: "Tráfico limitado por presupuesto",
        rationale:
          `Una parte relevante de las impresiones se pierde por presupuesto. Si la cuenta es rentable, un aumento moderado del presupuesto diario puede recuperar alcance.${trend}`,
        advertiserId: advId,
        siteId,
        campaignId: row.id,
        campaignName: row.name || String(row.id),
        ...campaignCardStats(row),
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
        category: "growth",
        expectedImpact: "positive",
        confidence: 0.66,
        priorityScore: 58,
        title: "Sin impresiones en el período",
        rationale:
          `Si el ítem es nuevo o tiene poca trayectoria, una estrategia visibility suele acelerar datos; cuando haya volumen, volvé a profitability.${trend}`,
        advertiserId: advId,
        siteId,
        campaignId: row.id,
        campaignName: row.name || String(row.id),
        ...campaignCardStats(row),
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
        category: "positive",
        expectedImpact: "positive",
        confidence: 0.77,
        priorityScore: 76,
        title: "ROAS real muy superior al objetivo",
        rationale:
          `Hay margen para captar más demanda sin tensionar el ROAS: incremento moderado de presupuesto manteniendo la estrategia actual.${trend}`,
        advertiserId: advId,
        siteId,
        campaignId: row.id,
        campaignName: row.name || String(row.id),
        ...campaignCardStats(row),
        applyPayload: {
          ...base,
          budget: newBudget,
        },
      });
    }

    // 6) Costo alto con muy baja tracción comercial
    const cvr = Number(m.cvr ?? 0);
    if (status === "active" && cost > 25 && clicks > 40 && cvr > 0 && cvr < 0.004) {
      seq += 1;
      out.push({
        id: `pads-${row.id}-low-cvr-${seq}`,
        severity: "critical",
        category: "negative",
        expectedImpact: "positive",
        confidence: 0.84,
        priorityScore: 90,
        title: "Conversión baja con gasto relevante",
        rationale:
          `La campaña capta clics pero convierte poco para el gasto actual. Recomendable endurecer ROAS y pasar temporalmente a profitability para proteger margen.${trend}`,
        advertiserId: advId,
        siteId,
        campaignId: row.id,
        campaignName: row.name || String(row.id),
        ...campaignCardStats(row),
        applyPayload: {
          ...base,
          strategy: "profitability",
          roas_target: Math.min(50, Math.round(roas * 1.3 * 100) / 100),
        },
      });
    }

    // 7) Señal positiva fuerte de eficiencia
    if (status === "active" && roasActual > 8 && acos > 0 && acos < 12 && prints > 500) {
      seq += 1;
      out.push({
        id: `pads-${row.id}-high-eff-${seq}`,
        severity: "info",
        category: "positive",
        expectedImpact: "neutral",
        confidence: 0.7,
        priorityScore: 54,
        title: "Eficiencia alta sostenida",
        rationale:
          `ROAS y ACOS muestran una campaña saludable. Sugerencia: mantener estrategia y monitorear cada 24h para evitar sobreajustes.${trend}`,
        advertiserId: advId,
        siteId,
        campaignId: row.id,
        campaignName: row.name || String(row.id),
        ...campaignCardStats(row),
        applyPayload: {
          ...base,
        },
      });
    }

    // 8) Objetivo comercial: cierre 7-10% con margen bajo (volumen rentable)
    // Si CVR < 7% y hay volumen de clics, activar estrategia de cierre.
    if (status === "active" && clicks >= 60 && cvr > 0 && cvr < 0.07) {
      const newRoas = Math.min(35, Math.max(3, roas * 1.15));
      seq += 1;
      out.push({
        id: `pads-${row.id}-close-rate-low-${seq}`,
        severity: "critical",
        category: "efficiency",
        expectedImpact: "positive",
        confidence: 0.86,
        priorityScore: 95,
        title: "Cierre por debajo del 7% (objetivo 7-10%)",
        rationale:
          `La campaña tiene tráfico suficiente pero no convierte al nivel objetivo de cierre. Ajustar a profitability y elevar ROAS ayuda a filtrar intención y proteger margen para escalar volumen rentable.${trend}`,
        advertiserId: advId,
        siteId,
        campaignId: row.id,
        campaignName: row.name || String(row.id),
        ...campaignCardStats(row),
        applyPayload: {
          ...base,
          strategy: "profitability",
          roas_target: Math.round(newRoas * 100) / 100,
        },
      });
    }

    // Si CVR > 10% + ACOS controlado: oportunidad de escalar ventas sin romper margen.
    if (status === "active" && clicks >= 40 && cvr >= 0.1 && acos > 0 && acos <= Math.max(bench * 1.1, 18)) {
      const newBudget = Math.round(Math.min((Number(row.budget) || 0) * 1.18, (Number(row.budget) || 0) + 1200) * 100) / 100;
      seq += 1;
      out.push({
        id: `pads-${row.id}-close-rate-high-${seq}`,
        severity: "info",
        category: "positive",
        expectedImpact: "positive",
        confidence: 0.83,
        priorityScore: 84,
        title: "Cierre superior al 10% con margen sano",
        rationale:
          `La campaña ya está cerrando ventas a nivel alto con ACOS controlado. Escalar presupuesto gradualmente es la vía más directa para vender más unidades sin deteriorar el margen.${trend}`,
        advertiserId: advId,
        siteId,
        campaignId: row.id,
        campaignName: row.name || String(row.id),
        ...campaignCardStats(row),
        applyPayload: {
          ...base,
          budget: newBudget > 0 ? newBudget : Number(row.budget ?? 0),
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
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}
