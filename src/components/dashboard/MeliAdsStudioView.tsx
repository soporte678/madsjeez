"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Info,
  Zap,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { toast } from "sonner";

type SnapshotCampaign = {
  id: number;
  name?: string;
  status?: string;
  strategy?: string;
  budget?: number;
  roas_target?: number;
  site_id: string;
  advertiser_id: number;
  metrics?: Record<string, number>;
  metrics_prev?: Record<string, number>;
};

type Recommendation = {
  id: string;
  severity: "info" | "warning" | "critical";
  category: "positive" | "negative" | "efficiency" | "growth";
  expectedImpact: "positive" | "negative" | "neutral";
  confidence: number;
  priorityScore?: number;
  title: string;
  rationale: string;
  advertiserId?: number;
  campaignId: number;
  campaignName: string;
  siteId: string;
  applyPayload: Record<string, unknown>;
};

/** Payload de GET `/api/meli/ads/snapshot` (estado de pantalla + cache localStorage). */
type MeliAdsStudioSnapshot = {
  fetchedAt?: string;
  metricsDays?: number;
  advertisers?: { advertiser_id: number; site_id: string; account_name?: string }[];
  campaigns?: SnapshotCampaign[];
  totals?: Record<string, number>;
  previousTotals?: Record<string, number>;
  deltas?: Record<string, number>;
  finance?: Record<string, number>;
  currentWindow?: { start: string; end: string };
  previousWindow?: { start: string; end: string };
  recommendations?: Recommendation[];
  dailyStats?: Array<{ day: string; snapshots: number; avgCost: number; avgRevenue: number; avgProfit: number }>;
  changeSummary?: { positive: number; negative: number; neutral: number; pending: number };
  comparisons?: Array<{
    daysAgo: number;
    snapshotAt: string | null;
    metrics: Record<string, number>;
    deltasVsNow: Record<string, number>;
  }>;
  errors?: string[];
};

const SNAPSHOT_CACHE_KEY = "meli_ads_snapshot_v1";
const AUTO_REFRESH_MS = 10 * 60 * 1000;

function renderDelta(
  value: number,
  kind: "number" | "money" | "pct",
  direction: "up_good" | "down_good",
  money: (v: unknown) => string,
  count: (v: unknown) => string
) {
  if (!Number.isFinite(value) || value === 0) return <span className="text-xs text-gray-400">= 0</span>;
  const up = value > 0;
  const isGood = direction === "up_good" ? up : !up;
  const text =
    kind === "money"
      ? money(Math.abs(value))
      : kind === "pct"
        ? `${Math.abs(value).toFixed(2)} pts. porcentuales`
        : count(Math.abs(value));
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isGood ? "text-emerald-600" : "text-red-600"}`}>
      {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {text}
    </span>
  );
}

export default function MeliAdsStudioView() {
  const { status: sess } = useSession();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [snapshot, setSnapshot] = useState<MeliAdsStudioSnapshot | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SNAPSHOT_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { data?: unknown };
      return (parsed?.data as MeliAdsStudioSnapshot) ?? null;
    } catch {
      return null;
    }
  });
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<"name" | "clicks" | "prints" | "ctr" | "cost" | "acos" | "roas" | "budget">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [editingCampaignNameRow, setEditingCampaignNameRow] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [expandedCampaignRows, setExpandedCampaignRows] = useState<Record<string, boolean>>({});
  const [campaignItems, setCampaignItems] = useState<Record<string, Array<{ item_id?: string; title?: string; status?: string; metrics?: Record<string, unknown> }>>>({});
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const [compareDays, setCompareDays] = useState(7);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    setLoading(true);
    try {
      const res = await fetch(`/api/meli/ads/snapshot?analyze=1&days=14&compare_days=${compareDays}&t=${Date.now()}`, {
        cache: "no-store",
      });
      let data: Record<string, unknown>;
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        if (!silent) toast.error("Respuesta inválida del servidor");
        return;
      }
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : "No se pudo cargar Product Ads";
        if (!silent) toast.error(msg);
        // Sesión cerrada: limpiar cache. Cualquier otro fallo (502, timeout ML, etc.) no debe vaciar
        // la UI en refrescos silenciosos — antes borrábamos todo y parecía “sin datos”.
        if (res.status === 401) {
          setSnapshot(null);
          try {
            localStorage.removeItem(SNAPSHOT_CACHE_KEY);
          } catch {
            /* ignore */
          }
        }
        return;
      }
      setSnapshot(data as MeliAdsStudioSnapshot);
      localStorage.setItem(
        SNAPSHOT_CACHE_KEY,
        JSON.stringify({
          savedAt: new Date().toISOString(),
          data,
        })
      );
      setSelected({});
      if (!silent && Array.isArray(data.errors) && data.errors.length > 0) {
        toast.message("Mercado Libre devolvió avisos", {
          description: data.errors.slice(0, 4).join(" · "),
        });
      }
    } catch {
      if (!silent) toast.error("Error de red");
    } finally {
      setLoading(false);
    }
  }, [compareDays]);

  useEffect(() => {
    // Primer pull para traer estado actual y luego refresco periódico.
    const kickoff = setTimeout(() => load({ silent: true }), 0);
    const timer = setInterval(() => {
      load({ silent: true });
    }, AUTO_REFRESH_MS);
    return () => {
      clearTimeout(kickoff);
      clearInterval(timer);
    };
  }, [load]);

  const toggleRec = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const applySelected = async () => {
    const recs = snapshot?.recommendations ?? [];
    const actions = recs
      .filter((r) => selected[r.id])
      .map((r) => ({
        siteId: r.siteId,
        advertiserId: r.advertiserId,
        campaignId: r.campaignId,
        recommendationId: r.id,
        recommendationTitle: r.title,
        applyPayload: r.applyPayload,
      }));
    if (actions.length === 0) {
      toast.error("Seleccioná al menos una recomendación");
      return;
    }
    setApplying(true);
    try {
      const res = await fetch("/api/meli/ads/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "No se pudieron aplicar los cambios");
        return;
      }
      const ok = (data.results as { ok: boolean }[]).filter((x) => x.ok).length;
      const bad = (data.results as { ok: boolean }[]).filter((x) => !x.ok).length;
      toast.success(`Actualizado: ${ok} OK${bad ? `, ${bad} con error` : ""}`);
      await load();
    } catch {
      toast.error("Error de red al aplicar");
    } finally {
      setApplying(false);
    }
  };

  if (sess === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (sess === "unauthenticated") {
    return <p className="text-gray-600 text-sm">Iniciá sesión para usar esta herramienta.</p>;
  }

  const recs = snapshot?.recommendations ?? [];
  const positiveRecs = recs.filter((r) => r.expectedImpact === "positive");
  const negativeRecs = recs.filter((r) => r.severity === "critical" || r.category === "negative" || r.expectedImpact === "negative");
  const camps = snapshot?.campaigns ?? [];
  const totals = snapshot?.totals ?? {};
  const deltas = snapshot?.deltas ?? {};
  const finance = snapshot?.finance ?? {};
  const dailyStats = snapshot?.dailyStats ?? [];
  const changeSummary = snapshot?.changeSummary ?? { positive: 0, negative: 0, neutral: 0, pending: 0 };
  const comparisons = snapshot?.comparisons ?? [];

  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const money = (v: unknown) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(num(v));
  const count = (v: unknown) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(num(v));
  const pct = (v: unknown, digits = 2) => `${num(v).toFixed(digits)}%`;
  const ratio = (v: unknown, digits = 2) => num(v).toFixed(digits);
  const sortedCamps = (() => {
    const arr = [...camps];
    const read = (c: SnapshotCampaign) => {
      const m = c.metrics || {};
      if (sortBy === "name") return (c.name || "").toLowerCase();
      if (sortBy === "budget") return num(c.budget);
      return num(m[sortBy]);
    };
    arr.sort((a, b) => {
      const va = read(a);
      const vb = read(b);
      const cmp = typeof va === "string" && typeof vb === "string" ? va.localeCompare(vb) : Number(va) - Number(vb);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  })();

  const renameCampaign = async (c: SnapshotCampaign) => {
    const rowKey = `${c.site_id}-${c.id}`;
    const newName = (editingNames[rowKey] ?? "").trim();
    if (!newName) {
      toast.error("Ingresá un nombre válido");
      return;
    }
    setRenamingId(rowKey);
    try {
      const res = await fetch("/api/meli/ads/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actions: [
            {
              siteId: c.site_id,
              advertiserId: c.advertiser_id,
              campaignId: c.id,
              recommendationTitle: "Renombrar campaña",
              applyPayload: {
                name: newName,
                status: (c.status || "active").toLowerCase(),
                budget: num(c.budget) || 1,
                strategy: (c.strategy || "profitability").toLowerCase(),
                channel: "marketplace",
                roas_target: num(c.roas_target) || 5,
              },
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "No se pudo renombrar");
      } else {
        toast.success("Campaña renombrada");
        await load({ silent: true });
      }
    } catch {
      toast.error("Error de red al renombrar");
    } finally {
      setRenamingId(null);
    }
  };

  const toggleCampaignItems = async (c: SnapshotCampaign) => {
    const rowKey = `${c.site_id}-${c.id}`;
    const currentlyOpen = Boolean(expandedCampaignRows[rowKey]);
    setExpandedCampaignRows((s) => ({ ...s, [rowKey]: !currentlyOpen }));
    if (currentlyOpen || campaignItems[rowKey]) return;
    setLoadingItems((s) => ({ ...s, [rowKey]: true }));
    try {
      const qs = new URLSearchParams({
        siteId: c.site_id,
        advertiserId: String(c.advertiser_id),
        campaignId: String(c.id),
        days: String(snapshot?.metricsDays ?? 14),
      });
      const res = await fetch(`/api/meli/ads/campaign-items?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "No se pudieron cargar artículos");
        return;
      }
      setCampaignItems((s) => ({ ...s, [rowKey]: data.items || [] }));
    } catch {
      toast.error("Error de red al cargar artículos");
    } finally {
      setLoadingItems((s) => ({ ...s, [rowKey]: false }));
    }
  };
  const onChangeCompareDays = (days: number) => {
    setCompareDays(days);
    setTimeout(() => load({ silent: true }), 0);
  };
  const severityLabel = (s: Recommendation["severity"]) =>
    s === "critical" ? "Crítico" : s === "warning" ? "Advertencia" : "Informativo";
  const categoryLabel = (c: Recommendation["category"]) =>
    c === "positive" ? "Positivo" : c === "negative" ? "Riesgo" : c === "efficiency" ? "Eficiencia" : "Crecimiento";
  const statusLabel = (s?: string) => {
    const v = (s || "").toLowerCase();
    if (v === "active") return "Activa";
    if (v === "paused") return "Pausada";
    if (v === "draft") return "Borrador";
    if (v === "ended") return "Finalizada";
    return s || "—";
  };
  const strategyLabel = (s?: string) => {
    const v = (s || "").toLowerCase();
    if (v === "profitability") return "Rentabilidad";
    if (v === "increase") return "Incremento";
    if (v === "visibility") return "Visibilidad";
    return s || "—";
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Mercado Libre Ads — estudio automático</h2>
        <p className="text-sm text-gray-600 mt-1 max-w-3xl">
          Traemos tus campañas de <strong>Product Ads (PADS)</strong>, métricas recientes de Mercado Libre y un{" "}
          <strong>análisis automático</strong> con reglas de performance (CTR, ACOS vs valor de referencia, pérdida por
          presupuesto, ROAS). Podés aplicar los cambios sugeridos vía API (presupuesto, estrategia, ROAS objetivo,
          estado).
        </p>
        <p className="text-xs text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 mt-3">
          Requiere tener Product Ads habilitado en Mercado Libre y scopes OAuth adecuados. Si ves 404 en anunciantes,
          activá las campañas desde ML → Gestión de publicaciones → Publicidad.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <button
          type="button"
          disabled={loading}
          onClick={() => load()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-medium px-4 py-2 text-sm shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualizar datos y análisis
        </button>
        {snapshot?.fetchedAt && (
          <span className="text-xs text-gray-500">
            Última lectura: {new Date(snapshot.fetchedAt).toLocaleString("es-AR")} · ventana{" "}
            {snapshot.metricsDays ?? 14} días
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">Comparar contra:</span>
        {[1, 2, 3, 5, 7, 15, 20, 30].map((days) => {
          const active = compareDays === days;
          return (
            <button
              key={days}
              type="button"
              onClick={() => onChangeCompareDays(days)}
              className={`h-8 rounded-md border px-3 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
              aria-pressed={active}
            >
              {days === 1 ? "24h" : `${days}d`}
            </button>
          );
        })}
      </div>
      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Glosario rápido (acrónimos)</h3>
        <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
          <li>
            <span className="font-semibold text-foreground">PADS:</span> Product Ads de Mercado Libre; campañas de
            publicidad sobre publicaciones.
          </li>
          <li>
            <span className="font-semibold text-foreground">CTR:</span> porcentaje de clics sobre impresiones. Fórmula:
            clicks / impresiones.
          </li>
          <li>
            <span className="font-semibold text-foreground">ACOS:</span> porcentaje del costo publicitario sobre ventas
            atribuidas. Fórmula: costo / ingresos Ads.
          </li>
          <li>
            <span className="font-semibold text-foreground">ROAS:</span> retorno de la inversión publicitaria. Fórmula:
            ingresos Ads / costo.
          </li>
          <li>
            <span className="font-semibold text-foreground">API:</span> conexión automática entre sistemas para leer
            datos y aplicar cambios.
          </li>
          <li>
            <span className="font-semibold text-foreground">ML:</span> abreviatura de Mercado Libre.
          </li>
          <li>
            <span className="font-semibold text-foreground">OAuth:</span> autorización segura para dar permisos sin
            compartir contraseña.
          </li>
          <li>
            <span className="font-semibold text-foreground">Pts. porcentuales:</span> diferencia entre dos porcentajes
            (ejemplo: 2.0% a 2.5% = +0.5 pts. porcentuales).
          </li>
        </ul>
      </section>

      {snapshot?.advertisers?.length === 0 && !loading && snapshot && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary flex gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          No hay anunciante PADS para esta cuenta. Verificá permisos u operativamente Product Ads en Mercado Libre.
        </div>
      )}

      {camps.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Presupuesto diario total</p>
            <p className="text-xl font-bold text-emerald-700">{money(totals.budget)}</p>
            {renderDelta(num(deltas.budget), "money", "up_good", money, count)}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Gasto (ventana actual)</p>
            <p className="text-xl font-bold text-emerald-700">{money(totals.cost)}</p>
            {renderDelta(num(deltas.cost), "money", "down_good", money, count)}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Ingresos estimados Ads</p>
            <p className="text-xl font-bold text-emerald-700">{money(totals.revenue)}</p>
            {renderDelta(num(deltas.revenue), "money", "up_good", money, count)}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Ganancia estimada</p>
            <p className={`text-xl font-bold ${num(totals.profit) >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {money(totals.profit)}
            </p>
            {renderDelta(num(deltas.profit), "money", "up_good", money, count)}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Próxima factura (proyección)</p>
            <p className="text-xl font-bold text-emerald-700">{money(finance.nextInvoiceProjection)}</p>
            <p className="text-xs text-gray-500 mt-1">Diario: {money(finance.avgDailySpent)}</p>
          </div>
        </section>
      )}

      {(dailyStats.length > 0 || recs.length > 0) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Semáforo de impacto (cambios aplicados)</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-slate-900">
                <span className="font-semibold text-emerald-700">Positivos:</span> {changeSummary.positive}
              </div>
              <div className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-slate-900">
                <span className="font-semibold text-red-700">Negativos:</span> {changeSummary.negative}
              </div>
              <div className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-slate-900">
                <span className="font-semibold text-slate-700">Neutrales:</span> {changeSummary.neutral}
              </div>
              <div className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-slate-900">
                <span className="font-semibold text-amber-700">Pendientes:</span> {changeSummary.pending}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              La evaluación se recalcula al sincronizar cada 10 min comparando CTR/ACOS/ROAS contra el período previo.
            </p>
          </div>
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4">
            <h3 className="text-sm font-semibold text-cyan-800 mb-2">Estadística diaria (promedio por sync)</h3>
            <div className="space-y-1 max-h-40 overflow-auto text-xs">
              {dailyStats.slice(-7).map((d) => (
                <div key={d.day} className="flex items-center justify-between border-b border-cyan-700/10 pb-1">
                  <span>{d.day}</span>
                  <span className="text-cyan-900">Costo {money(d.avgCost)}</span>
                  <span className={d.avgProfit >= 0 ? "text-emerald-700" : "text-red-700"}>Profit {money(d.avgProfit)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {comparisons.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-slate-50">
            <h3 className="font-semibold text-gray-900">Informe comparativo del ecosistema de marketing</h3>
            <p className="text-xs text-gray-600 mt-1">Estado actual vs el rango seleccionado.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2">Métrica</th>
                  <th className="text-right px-3 py-2">Ahora</th>
                  {comparisons.map((c) => (
                    <th key={c.daysAgo} className="text-right px-3 py-2">
                      Hace {c.daysAgo}d
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: "cost", label: "Costo", fmt: "money" as const },
                  { key: "revenue", label: "Revenue", fmt: "money" as const },
                  { key: "profit", label: "Profit", fmt: "money" as const },
                  { key: "roas", label: "ROAS", fmt: "ratio" as const },
                  { key: "acos", label: "ACOS", fmt: "pct" as const },
                  { key: "ctr", label: "CTR", fmt: "pct" as const },
                  { key: "clicks", label: "Clicks", fmt: "count" as const },
                  { key: "prints", label: "Impresiones", fmt: "count" as const },
                ].map((row) => {
                  const nowVal = num(totals[row.key as keyof typeof totals]);
                  const format = (v: number) =>
                    row.fmt === "money"
                      ? money(v)
                      : row.fmt === "pct"
                        ? `${v.toFixed(2)}%`
                        : row.fmt === "ratio"
                          ? `${v.toFixed(2)}x`
                          : count(v);
                  return (
                    <tr key={row.key} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-medium text-gray-800">{row.label}</td>
                      <td className="px-3 py-2 text-right font-semibold">{format(nowVal)}</td>
                      {comparisons.map((c) => {
                        const old = num(c.metrics[row.key] ?? 0);
                        const delta = num(c.deltasVsNow[row.key] ?? 0);
                        const direction: "up_good" | "down_good" =
                          row.key === "cost" || row.key === "acos" ? "down_good" : "up_good";
                        return (
                          <td key={`${row.key}-${c.daysAgo}`} className="px-3 py-2 text-right">
                            <div>{format(old)}</div>
                            {renderDelta(
                              delta,
                              row.fmt === "money" ? "money" : row.fmt === "pct" ? "pct" : "number",
                              direction,
                              money,
                              count
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {camps.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-900">Campañas y métricas (ML)</h3>
          </div>
          <div className="px-4 py-2 border-b border-gray-100 bg-slate-50 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-600 font-medium">Ordenar por:</span>
            {[
              { id: "name", label: "Nombre" },
              { id: "clicks", label: "Clicks" },
              { id: "prints", label: "Impresiones" },
              { id: "ctr", label: "CTR" },
              { id: "cost", label: "Costo" },
              { id: "acos", label: "ACOS" },
              { id: "roas", label: "ROAS" },
              { id: "budget", label: "Presupuesto" },
            ].map((opt) => {
              const active = sortBy === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortBy(opt.id as typeof sortBy)}
                  className={`h-8 rounded-md border px-2.5 font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSortDir("asc")}
              className={`h-8 rounded-md border px-2.5 font-medium transition-colors ${
                sortDir === "asc"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              Ascendente
            </button>
            <button
              type="button"
              onClick={() => setSortDir("desc")}
              className={`h-8 rounded-md border px-2.5 font-medium transition-colors ${
                sortDir === "desc"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              Descendente
            </button>
            <button type="button" onClick={() => { setSortBy("clicks"); setSortDir("desc"); }} className="h-8 rounded bg-blue-600 text-white px-2.5">
              Más clicks
            </button>
            <button type="button" onClick={() => { setSortBy("clicks"); setSortDir("asc"); }} className="h-8 rounded bg-slate-700 text-white px-2.5">
              Menos clicks
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Campaña</th>
                  <th className="text-left px-3 py-2 font-medium">Estado</th>
                  <th className="text-left px-3 py-2 font-medium">Estrategia</th>
                  <th className="text-right px-3 py-2 font-medium">Presupuesto</th>
                  <th className="text-right px-3 py-2 font-medium">Impresiones</th>
                  <th className="text-right px-3 py-2 font-medium">Clicks</th>
                  <th className="text-right px-3 py-2 font-medium">CTR</th>
                  <th className="text-right px-3 py-2 font-medium">Costo</th>
                  <th className="text-right px-3 py-2 font-medium">ACOS</th>
                  <th className="text-right px-3 py-2 font-medium">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {sortedCamps.map((c) => {
                  const m = c.metrics || {};
                  const p = c.metrics_prev || {};
                  const prints = m.prints ?? 0;
                  const clicks = m.clicks ?? 0;
                  let ctr = Number.NaN;
                  if (prints > 0) ctr = (clicks / prints) * 100;
                  else if (m.ctr != null && Number.isFinite(m.ctr)) {
                    const v = Number(m.ctr);
                    ctr = v <= 1 ? v * 100 : v;
                  }
                  const prevCtrRaw = Number(p.ctr ?? 0);
                  const prevCtr = prevCtrRaw > 0 && prevCtrRaw <= 1 ? prevCtrRaw * 100 : prevCtrRaw;
                  const cost = num(m.cost);
                  const acos = num(m.acos);
                  const roas = num(m.roas);
                  const rowKey = `${c.site_id}-${c.id}`;
                  const isExpanded = Boolean(expandedCampaignRows[rowKey]);
                  return (
                    <Fragment key={rowKey}>
                    <tr className="border-t border-border transition-colors hover:bg-muted/70 focus-within:bg-muted/70">
                      <td className="px-3 py-2 text-foreground font-medium max-w-[300px]">
                        <div className="space-y-1">
                          <div className="truncate">{c.name || c.id}</div>
                          <div className="flex items-center gap-2">
                            {editingCampaignNameRow === rowKey ? (
                              <>
                                <input
                                  autoFocus
                                  value={editingNames[rowKey] ?? c.name ?? ""}
                                  onChange={(e) => setEditingNames((s) => ({ ...s, [rowKey]: e.target.value }))}
                                  className="h-7 w-44 rounded border border-border bg-card px-2 text-xs text-foreground"
                                  placeholder="Nuevo nombre"
                                />
                                <button
                                  type="button"
                                  disabled={renamingId === rowKey}
                                  onClick={async () => {
                                    await renameCampaign(c);
                                    setEditingCampaignNameRow(null);
                                  }}
                                  className="h-7 rounded bg-primary text-primary-foreground px-2 text-xs disabled:opacity-50"
                                >
                                  {renamingId === rowKey ? "..." : "Guardar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCampaignNameRow(null);
                                    setEditingNames((s) => ({ ...s, [rowKey]: c.name ?? "" }));
                                  }}
                                  className="h-7 rounded bg-muted text-foreground px-2 text-xs"
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  title="Editar nombre de campaña"
                                  onClick={() => {
                                    setEditingCampaignNameRow(rowKey);
                                    setEditingNames((s) => ({ ...s, [rowKey]: c.name ?? "" }));
                                  }}
                                  className="h-7 w-7 rounded border border-border bg-card text-primary inline-flex items-center justify-center hover:bg-muted"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleCampaignItems(c)}
                                  className="h-7 rounded bg-muted text-foreground px-2 text-xs hover:bg-muted/80"
                                >
                                  {isExpanded ? "Ocultar artículos" : "Ver artículos"}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{statusLabel(c.status)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{strategyLabel(c.strategy)}</td>
                      <td className="px-3 py-2 text-right text-emerald-700 font-semibold">
                        <div>{money(c.budget)}</div>
                        <span className="text-xs text-muted-foreground">diario</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div>{count(prints)}</div>
                        {renderDelta(num(prints) - num(p.prints), "number", "up_good", money, count)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div>{count(clicks)}</div>
                        {renderDelta(num(clicks) - num(p.clicks), "number", "up_good", money, count)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div>{Number.isFinite(ctr) ? pct(ctr) : "—"}</div>
                        {renderDelta(Number.isFinite(ctr) ? ctr - prevCtr : 0, "pct", "up_good", money, count)}
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-700 font-semibold">
                        <div>{money(cost)}</div>
                        {renderDelta(cost - num(p.cost), "money", "down_good", money, count)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div>{pct(acos)}</div>
                        {renderDelta(acos - num(p.acos), "pct", "down_good", money, count)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div>{ratio(roas)}x</div>
                        {renderDelta(roas - num(p.roas), "number", "up_good", money, count)}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan={10} className="px-3 py-3">
                          {loadingItems[rowKey] ? (
                            <p className="text-xs text-gray-600">Cargando artículos...</p>
                          ) : (campaignItems[rowKey] ?? []).length === 0 ? (
                            <p className="text-xs text-gray-600">Sin artículos reportados para esta campaña.</p>
                          ) : (
                            <div className="space-y-2">
                              {(campaignItems[rowKey] ?? []).slice(0, 30).map((it, idx) => {
                                const mm = (it.metrics || {}) as Record<string, unknown>;
                                return (
                                  <div key={`${it.item_id ?? idx}`} className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white flex flex-wrap gap-3">
                                    <span className="font-medium text-gray-900">{it.title || it.item_id || "Ítem"}</span>
                                    <span className="text-gray-600">ID: {it.item_id || "-"}</span>
                                    <span className="text-gray-600">Estado: {statusLabel(it.status)}</span>
                                    <span className="text-gray-700">Clicks: {count(mm.clicks ?? 0)}</span>
                                    <span className="text-gray-700">Impresiones: {count(mm.prints ?? 0)}</span>
                                    <span className="text-gray-700">Costo: {money(mm.cost ?? 0)}</span>
                                    <span className="text-gray-700">ROAS: {ratio(mm.roas ?? 0)}x</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr className="font-semibold text-gray-800">
                  <td className="px-3 py-2">Totales</td>
                  <td className="px-3 py-2">—</td>
                  <td className="px-3 py-2">—</td>
                  <td className="px-3 py-2 text-right text-emerald-700">{money(totals.budget)}</td>
                  <td className="px-3 py-2 text-right">{count(totals.prints)}</td>
                  <td className="px-3 py-2 text-right">{count(totals.clicks)}</td>
                  <td className="px-3 py-2 text-right">{pct(totals.ctr)}</td>
                  <td className="px-3 py-2 text-right text-emerald-700">{money(totals.cost)}</td>
                  <td className="px-3 py-2 text-right">{pct(totals.acos)}</td>
                  <td className="px-3 py-2 text-right">{ratio(totals.roas)}x</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {recs.length > 0 && (
        <section className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-muted/60">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Análisis automático — acciones sugeridas</h3>
            </div>
            <button
              type="button"
              disabled={applying || loading}
              onClick={applySelected}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium px-4 py-2 text-sm"
            >
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Aplicar seleccionadas en ML
            </button>
          </div>
          <div className="px-4 py-3 text-xs bg-muted/70 border-b border-border grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold">Virtudes</p>
              <p className="text-emerald-900 font-bold text-sm">{positiveRecs.length}</p>
            </div>
            <div className="rounded-lg border border-red-300 bg-red-50 px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wide text-red-700 font-semibold">Riesgos</p>
              <p className="text-red-900 font-bold text-sm">{negativeRecs.length}</p>
            </div>
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wide text-amber-700 font-semibold">Advertencias</p>
              <p className="text-amber-900 font-bold text-sm">{recs.filter((r) => r.severity === "warning").length}</p>
            </div>
            <div className="rounded-lg border border-indigo-300 bg-indigo-50 px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wide text-indigo-700 font-semibold">Total acciones</p>
              <p className="text-indigo-900 font-bold text-sm">{recs.length}</p>
            </div>
          </div>
          <div className="px-4 py-2 border-b border-border text-[11px] text-muted-foreground flex flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">Crítico = actuar primero</span>
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700">Advertencia = optimización recomendada</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Positivo = escalar/continuar</span>
          </div>
          <ul className="p-4 grid grid-cols-1 gap-3 bg-muted/40">
            {recs.map((r) => {
              const Icon =
                r.severity === "critical"
                  ? AlertTriangle
                  : r.severity === "warning"
                    ? AlertTriangle
                    : Info;
              const color =
                r.severity === "critical"
                  ? "text-red-700 bg-red-100 border-red-300"
                  : r.severity === "warning"
                    ? "text-amber-800 bg-amber-100 border-amber-300"
                    : r.expectedImpact === "positive"
                      ? "text-emerald-700 bg-emerald-100 border-emerald-300"
                      : "text-blue-700 bg-blue-50 border-blue-100";
              const rowTint =
                r.severity === "critical"
                  ? "bg-gradient-to-r from-red-500/20 to-red-500/5 border-red-400/50 shadow-[0_0_0_1px_rgba(248,113,113,0.35),0_8px_20px_rgba(127,29,29,0.25)]"
                  : r.severity === "warning"
                    ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 border-amber-400/45 shadow-[0_0_0_1px_rgba(251,191,36,0.25)]"
                    : r.expectedImpact === "positive"
                      ? "bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border-emerald-400/45 shadow-[0_0_0_1px_rgba(52,211,153,0.25)]"
                      : "bg-card border-border";
              const actionLabel =
                r.severity === "critical"
                  ? "Acción urgente: revisar y aplicar hoy"
                  : r.severity === "warning"
                    ? "Acción recomendada: optimizar esta campaña"
                    : "Virtud detectada: escalar sin perder rentabilidad";
              return (
                <li key={r.id} className={`p-4 rounded-xl border shadow-sm ${rowTint}`}>
                  <div className="flex gap-3 items-start">
                    <input
                      type="checkbox"
                      className="mt-1.5 h-4 w-4 rounded border-2 border-border bg-card accent-primary shadow-sm"
                      checked={Boolean(selected[r.id])}
                      onChange={() => toggleRec(r.id)}
                    />
                    <div className={`rounded-lg border p-2 shrink-0 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                          r.severity === "critical"
                            ? "bg-red-950/70 text-red-100 border border-red-400/35"
                            : r.severity === "warning"
                              ? "bg-amber-950/60 text-amber-100 border border-amber-400/35"
                              : "bg-emerald-950/50 text-emerald-100 border border-emerald-400/35"
                        }`}
                      >
                        {actionLabel}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-foreground text-sm md:text-base">{r.title}</span>
                        <span className="text-[10px] uppercase tracking-wide text-foreground/80 bg-card border border-border px-2 py-0.5 rounded">
                          {severityLabel(r.severity)}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-foreground/80 bg-card border border-border px-2 py-0.5 rounded">
                          {categoryLabel(r.category)}
                        </span>
                        <span className="text-[10px] tracking-wide text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded">
                          Confianza {(r.confidence * 100).toFixed(0)}%
                        </span>
                        {typeof r.priorityScore === "number" && (
                          <span className="text-[10px] tracking-wide text-fuchsia-700 bg-fuchsia-100 border border-fuchsia-200 px-2 py-0.5 rounded">
                            Prioridad {r.priorityScore}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed font-medium">{r.rationale}</p>
                      <p className="text-xs text-muted-foreground">Campaña #{r.campaignId}</p>
                      <p className="text-xs text-muted-foreground">Configuración lista para aplicar en Mercado Libre.</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!loading && snapshot && camps.length === 0 && (snapshot.advertisers?.length ?? 0) > 0 && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            No hay campañas PADS listadas para estos anunciantes. Si antes veías datos, suele deberse a un rechazo del
            endpoint de búsqueda de ML o a que la respuesta vino en otro formato; revisá los avisos abajo o en el toast.
          </p>
          {Array.isArray(snapshot.errors) && snapshot.errors.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
              <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Respuesta / rutas ML</p>
              <ul className="list-disc pl-4 space-y-0.5 opacity-90">
                {snapshot.errors.slice(0, 8).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
