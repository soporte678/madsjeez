"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Zap,
  ArrowDown,
  ArrowUp,
  Activity,
  BarChart2,
  Search,
  Filter,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import { MeliAdsEcosystemChart } from "@/components/dashboard/MeliAdsEcosystemChart";

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
  /** Presupuesto diario actual (PADS); opcional en snapshots cacheados viejos. */
  campaignBudget?: number;
  /** Cantidad de publicaciones/items; opcional en cache viejo. */
  campaignItemsCount?: number;
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
  dailyCutoff?: {
    timezone: string;
    bucketDateKey: string;
    source: string;
    snapshotUpdatedAt: string | null;
  } | null;
  /** Suma de cortes diarios guardados en cada ventana (solo días con dato). */
  rolledTotals?: Array<{ windowDays: number; daysIncluded: number; totals: Record<string, number> }>;
  /** Historial de cortes diarios (más recientes al final del array). */
  dailyHistory?: Array<{ bucketDateKey: string; updatedAt: string; totals: Record<string, number> }>;
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
const COMPARE_DAYS_STORAGE_KEY = "meli_ads_compare_days_v1";
const ALLOWED_COMPARE_DAYS = [1, 2, 3, 5, 7, 15, 20, 30] as const;
const AUTO_REFRESH_MS = 10 * 60 * 1000;

function readStoredCompareDays(): number {
  if (typeof window === "undefined") return 1;
  try {
    const raw = localStorage.getItem(COMPARE_DAYS_STORAGE_KEY);
    const n = raw ? Number.parseInt(raw, 10) : NaN;
    if (Number.isFinite(n) && (ALLOWED_COMPARE_DAYS as readonly number[]).includes(n)) return n;
  } catch {
    /* ignore */
  }
  return 1;
}

function renderDelta(
  value: number,
  kind: "number" | "money" | "pct",
  direction: "up_good" | "down_good",
  money: (v: unknown) => string,
  count: (v: unknown) => string,
  opts?: { theme?: "light" | "dark"; suffix?: string }
) {
  const theme = opts?.theme ?? "light";
  const suffix = opts?.suffix ?? "";
  const zeroCls = theme === "dark" ? "text-slate-500" : "text-gray-400";
  if (!Number.isFinite(value) || value === 0) return <span className={`text-xs ${zeroCls}`}>= 0</span>;
  const up = value > 0;
  const isGood = direction === "up_good" ? up : !up;
  const text =
    kind === "money"
      ? money(Math.abs(value))
      : kind === "pct"
        ? `${Math.abs(value).toFixed(2)} pts. porcentuales`
        : count(Math.abs(value));
  const goodCls = theme === "dark" ? "text-emerald-400" : "text-emerald-600";
  const badCls = theme === "dark" ? "text-rose-400" : "text-red-600";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isGood ? goodCls : badCls}`}>
      {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {text}
      {suffix}
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
  const [compareDays, setCompareDays] = useState(1);
  const [recFilter, setRecFilter] = useState<"all" | "critical" | "warning" | "virtue">("all");
  /** Detalle largo del análisis por id de recomendación (solo tras “Leer más…”). */
  const [expandedRecAnalysis, setExpandedRecAnalysis] = useState<Record<string, boolean>>({});
  const [studioTab, setStudioTab] = useState<"overview" | "table">("overview");
  const [campaignSearch, setCampaignSearch] = useState("");

  useEffect(() => {
    const v = readStoredCompareDays();
    setCompareDays((prev) => (prev === v ? prev : v));
  }, []);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    setLoading(true);
    try {
      const res = await fetch(`/api/meli/ads/snapshot?analyze=1&days=14&compare_days=${compareDays}&t=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
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
      <div className="flex justify-center rounded-xl border border-gray-800 bg-[#0A0F1C] py-20 shadow-lg">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (sess === "unauthenticated") {
    return <p className="text-sm text-gray-400">Iniciá sesión para usar esta herramienta.</p>;
  }

  const recs = snapshot?.recommendations ?? [];
  const camps = snapshot?.campaigns ?? [];
  const totals = snapshot?.totals ?? {};
  const deltas = snapshot?.deltas ?? {};
  const finance = snapshot?.finance ?? {};
  const dailyStats = snapshot?.dailyStats ?? [];
  const changeSummary = snapshot?.changeSummary ?? { positive: 0, negative: 0, neutral: 0, pending: 0 };
  const comparisons = snapshot?.comparisons ?? [];

  const countCritical = recs.filter((r) => r.severity === "critical").length;
  const countWarning = recs.filter((r) => r.severity === "warning").length;
  // "Virtudes" representa el grupo no crítico/no advertencia (severidad informativa).
  // Esto mantiene el total particionado: all = critical + warning + virtue(info).
  const countVirtue = recs.filter((r) => r.severity === "info").length;

  const filteredRecs =
    recFilter === "all"
      ? recs
      : recFilter === "critical"
        ? recs.filter((r) => r.severity === "critical")
        : recFilter === "warning"
          ? recs.filter((r) => r.severity === "warning")
          : recs.filter((r) => r.severity === "info");

  const chartWindowDays = Math.min(Math.max(compareDays, 1), 30);
  const chartSlice = dailyStats.slice(-chartWindowDays);
  const chartLabelsArr = (() => {
    const n = chartSlice.length;
    if (n <= 0) return [];
    const labels: string[] = [];
    for (let k = n; k >= 2; k--) labels.push(`D-${k}`);
    labels.push("Ayer");
    return labels;
  })();
  const revenueK = chartSlice.map((d) => d.avgRevenue / 1000);
  const costK = chartSlice.map((d) => d.avgCost / 1000);

  const avgDailyBlock = (() => {
    const slice = dailyStats.slice(-chartWindowDays);
    if (!slice.length) return null;
    const avgCost = slice.reduce((s, d) => s + d.avgCost, 0) / slice.length;
    const avgProfit = slice.reduce((s, d) => s + d.avgProfit, 0) / slice.length;
    const lastDay = slice[slice.length - 1]?.day ?? "—";
    return { avgCost, avgProfit, lastDay };
  })();

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

  const campaignQuery = campaignSearch.trim().toLowerCase();
  const filteredSortedCamps = campaignQuery
    ? sortedCamps.filter((c) => (c.name || String(c.id)).toLowerCase().includes(campaignQuery))
    : sortedCamps;

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
    try {
      localStorage.setItem(COMPARE_DAYS_STORAGE_KEY, String(days));
    } catch {
      /* ignore */
    }
    setTimeout(() => load({ silent: true }), 0);
  };
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
    <div className="min-h-[50vh] bg-[#0A0F1C] text-gray-300">
      <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl flex-1 space-y-3">
            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              <Zap className="h-7 w-7 shrink-0 fill-blue-500/20 text-blue-500" aria-hidden />
              Mercado Libre Ads <span className="text-blue-500">—</span> Estudio automático
            </h2>
            <p className="text-sm leading-relaxed text-gray-400">
              Traemos tus campañas de <strong className="text-gray-200">Product Ads (PADS)</strong>, métricas recientes de
              Mercado Libre y un <strong className="text-gray-200">análisis automático</strong> con reglas de performance.
              Revisá las alertas y aplicá los cambios sugeridos.
            </p>
            <p className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-xs text-amber-100/90">
              Requiere tener Product Ads habilitado en Mercado Libre y scopes OAuth adecuados. Si ves 404 en anunciantes,
              activá las campañas desde ML → Gestión de publicaciones → Publicidad.
            </p>
            {snapshot?.dailyCutoff && (
              <p className="text-xs text-gray-500">
                <strong className="text-gray-300">Corte diario guardado:</strong> día civil{" "}
                <span className="font-mono text-gray-400">{snapshot.dailyCutoff.bucketDateKey}</span> (
                {snapshot.dailyCutoff.timezone}). La lectura en vivo de ML se actualiza seguido; los totales históricos y los
                acumulados por ventana usan solo una fila por día (
                {snapshot.dailyCutoff.snapshotUpdatedAt
                  ? `última escritura ${new Date(snapshot.dailyCutoff.snapshotUpdatedAt).toLocaleString("es-AR")}`
                  : "sin marca de tiempo"}
                ).
              </p>
            )}
            <details className="group rounded-xl border border-gray-800 bg-[#131A2A] shadow-lg transition-all">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2 text-sm font-medium text-gray-300 hover:text-white [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <span aria-hidden>📖</span> Ver glosario rápido (acrónimos)
                </span>
                <span className="transition-transform duration-300 group-open:-rotate-180">▼</span>
              </summary>
              <div className="grid grid-cols-1 gap-2 border-t border-gray-800 px-4 pb-4 pt-3 text-xs text-gray-400 md:grid-cols-2 md:gap-x-8">
                <p>
                  <strong className="text-gray-200">PADS:</strong> Product Ads de Mercado Libre; campañas de publicidad
                  sobre publicaciones.
                </p>
                <p>
                  <strong className="text-gray-200">CTR:</strong> porcentaje de clics sobre impresiones (clicks /
                  impresiones).
                </p>
                <p>
                  <strong className="text-gray-200">ACOS:</strong> costo publicitario sobre ventas atribuidas (costo /
                  ingresos Ads).
                </p>
                <p>
                  <strong className="text-gray-200">ROAS:</strong> ingresos Ads / costo (multiplicador).
                </p>
                <p>
                  <strong className="text-gray-200">API:</strong> conexión automática entre sistemas para leer datos y
                  aplicar cambios.
                </p>
                <p>
                  <strong className="text-gray-200">ML:</strong> abreviatura de Mercado Libre.
                </p>
                <p>
                  <strong className="text-gray-200">OAuth:</strong> autorización segura para dar permisos sin compartir
                  contraseña.
                </p>
                <p>
                  <strong className="text-gray-200">Pts. porcentuales:</strong> diferencia entre dos porcentajes (ej.: 2.0%
                  a 2.5% = +0.5 pts. porcentuales).
                </p>
              </div>
            </details>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
            <div className="flex flex-wrap items-center justify-end gap-3">
              {snapshot?.fetchedAt && (
                <span className="flex items-center gap-2 font-mono text-xs text-gray-500">
                  Última lectura: {new Date(snapshot.fetchedAt).toLocaleString("es-AR")}
                  <RefreshCw className="h-3 w-3 cursor-pointer hover:text-white" aria-hidden />
                </span>
              )}
              <button
                type="button"
                disabled={loading}
                onClick={() => load()}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm transition-colors hover:bg-gray-200 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Actualizar datos y análisis
              </button>
            </div>
            <div className="flex w-full flex-wrap items-center gap-1 overflow-x-auto rounded-lg border border-gray-800 bg-[#131A2A] p-1 lg:w-auto">
              <span className="whitespace-nowrap px-2 py-1.5 text-xs font-medium text-gray-500">Comparar:</span>
              {[1, 2, 3, 5, 7, 15, 20, 30].map((days) => {
                const active = compareDays === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => onChangeCompareDays(days)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                      active ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:bg-gray-800/80 hover:text-white"
                    }`}
                    aria-pressed={active}
                  >
                    {days === 1 ? "24h" : `${days}d`}
                  </button>
                );
              })}
            </div>
            <p className="text-right text-[11px] text-gray-500">
              Ventana métricas ML: {snapshot?.metricsDays ?? 14} días · Comparás contra período anterior de{" "}
              <span className="font-medium text-gray-400">
                {compareDays === 1 ? "24h" : `${compareDays}d`}
              </span>
            </p>
          </div>
        </header>

        <nav className="flex border-b border-gray-800" aria-label="Secciones del estudio">
          <button
            type="button"
            onClick={() => setStudioTab("overview")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              studioTab === "overview"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "border-b-2 border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Activity className="h-4 w-4" aria-hidden />
            Resumen y alertas
          </button>
          <button
            type="button"
            onClick={() => setStudioTab("table")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              studioTab === "table"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "border-b-2 border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <BarChart2 className="h-4 w-4" aria-hidden />
            Gestión detallada de campañas
          </button>
        </nav>

        {studioTab === "overview" && (
          <div className="space-y-8">
      {(snapshot?.rolledTotals?.length ?? 0) > 0 && (
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Totales acumulados (cortes diarios guardados)</h3>
            <p className="mt-1 text-xs text-gray-400">
              Cada día guardamos métricas PADS de Mercado Libre para <strong className="text-gray-200">ese día civil</strong>{" "}
              (Argentina). Acá se <strong className="text-gray-200">suman</strong> costo, ingresos y profit entre esos
              cortes; CTR, ACOS y ROAS salen de los agregados. Si falta un día en la ventana, “días con dato” será menor al
              largo de la ventana.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {(snapshot?.rolledTotals ?? []).map((roll) => {
              const t = roll.totals;
              return (
                <div
                  key={roll.windowDays}
                  className="rounded-xl border border-gray-800 bg-[#131A2A] p-4 shadow-lg transition-colors hover:border-gray-700"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Últimos {roll.windowDays} días</p>
                  <p className="mb-2 text-[11px] text-gray-500">
                    {roll.daysIncluded}/{roll.windowDays} días con corte guardado
                  </p>
                  <dl className="space-y-1 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-400">Costo</dt>
                      <dd className="font-semibold text-white">{money(t.cost)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-400">Ingresos Ads</dt>
                      <dd className="font-semibold text-white">{money(t.revenue)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-400">Profit</dt>
                      <dd className={`font-semibold ${num(t.profit) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {money(t.profit)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-400">CTR</dt>
                      <dd className="font-medium text-gray-200">{pct(t.ctr)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-400">ACOS</dt>
                      <dd className="font-medium text-gray-200">{pct(t.acos)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-400">ROAS</dt>
                      <dd className="font-medium text-blue-400">{ratio(t.roas)}x</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {(snapshot?.dailyHistory?.length ?? 0) > 0 && (
        <section className="overflow-hidden rounded-xl border border-gray-800 bg-[#131A2A] shadow-lg">
          <div className="border-b border-gray-800 bg-[#1A2235] px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Historial de cortes diarios</h3>
            <p className="mt-0.5 text-xs text-gray-400">Una fila por día civil (Argentina). Orden: más reciente arriba.</p>
          </div>
          <div className="max-h-72 overflow-x-auto overflow-y-auto">
            <table className="min-w-full text-xs">
              <thead className="sticky top-0 z-10 bg-[#1A2235] text-gray-400 backdrop-blur-sm">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Día (AR)</th>
                  <th className="px-3 py-2 text-left font-medium">Actualizado</th>
                  <th className="px-3 py-2 text-right font-medium">Costo</th>
                  <th className="px-3 py-2 text-right font-medium">Ingresos</th>
                  <th className="px-3 py-2 text-right font-medium">Profit</th>
                  <th className="px-3 py-2 text-right font-medium">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {[...(snapshot?.dailyHistory ?? [])].reverse().map((row) => (
                  <tr key={row.bucketDateKey} className="hover:bg-[#1C2538]">
                    <td className="px-3 py-2 font-mono text-gray-200">{row.bucketDateKey}</td>
                    <td className="px-3 py-2 text-gray-400">{new Date(row.updatedAt).toLocaleString("es-AR")}</td>
                    <td className="px-3 py-2 text-right font-medium text-white">{money(row.totals.cost)}</td>
                    <td className="px-3 py-2 text-right font-medium text-white">{money(row.totals.revenue)}</td>
                    <td
                      className={`px-3 py-2 text-right font-medium ${num(row.totals.profit) >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {money(row.totals.profit)}
                    </td>
                    <td className="px-3 py-2 text-right text-blue-400">{ratio(row.totals.roas)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {snapshot?.advertisers?.length === 0 && !loading && snapshot && (
        <div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-100">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          No hay anunciante PADS para esta cuenta. Verificá permisos u operativamente Product Ads en Mercado Libre.
        </div>
      )}

      {camps.length > 0 && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col justify-between rounded-xl border border-gray-800 bg-[#131A2A] p-4 shadow-lg transition-colors hover:border-gray-700">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Presupuesto diario</h3>
            <div>
              <p className="text-2xl font-bold text-white">{money(totals.budget)}</p>
              <div className="mt-2">
                {num(deltas.budget) === 0 ? (
                  <span className="text-xs text-gray-500">= 0 cambios recientes</span>
                ) : (
                  renderDelta(num(deltas.budget), "money", "up_good", money, count, { theme: "dark", suffix: " vs ant." })
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-gray-800 bg-[#131A2A] p-4 shadow-lg transition-colors hover:border-gray-700">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Gasto (ventana)</h3>
            <div>
              <p className="text-2xl font-bold text-white">{money(totals.cost)}</p>
              <div className="mt-2">
                {renderDelta(num(deltas.cost), "money", "down_good", money, count, { theme: "dark", suffix: " vs ant." })}
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-gray-800 bg-[#131A2A] p-4 shadow-lg transition-colors hover:border-gray-700">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Ingresos estimados</h3>
            <div>
              <p className="text-2xl font-bold text-white">{money(totals.revenue)}</p>
              <div className="mt-2">
                {renderDelta(num(deltas.revenue), "money", "up_good", money, count, { theme: "dark", suffix: " vs ant." })}
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-gray-800 bg-[#131A2A] p-4 shadow-lg transition-colors hover:border-gray-700">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Ganancia / profit</h3>
            <div>
              <p className={`text-2xl font-bold ${num(totals.profit) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {money(totals.profit)}
              </p>
              <div className="mt-2">
                {renderDelta(num(deltas.profit), "money", "up_good", money, count, { theme: "dark", suffix: " vs ant." })}
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-gray-800 bg-[#131A2A] p-4 shadow-lg transition-colors hover:border-gray-700 sm:col-span-2 lg:col-span-1">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Proyección factura</h3>
            <div>
              <p className="text-2xl font-bold text-white">{money(finance.nextInvoiceProjection)}</p>
              <p className="mt-2 text-xs text-gray-500">
                Prom. diario: <span className="font-medium text-gray-300">{money(finance.avgDailySpent)}</span>
              </p>
            </div>
          </div>
        </section>
      )}

      {camps.length > 0 && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-800 bg-[#131A2A] p-6 shadow-lg lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                <BarChart2 className="h-5 w-5 text-blue-400" aria-hidden />
                Tendencia: ecosistema de marketing
              </h3>
              <span className="rounded bg-[#1A2235] px-2 py-1 text-xs text-gray-400">
                {compareDays === 1
                  ? "Ventana gráfico: 24h (1 día con corte)"
                  : `Últimos ${chartWindowDays} días (cortes guardados)`}
              </span>
            </div>
            {chartSlice.length > 0 ? (
              <MeliAdsEcosystemChart labels={chartLabelsArr} revenueK={revenueK} costK={costK} />
            ) : (
              <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500 lg:h-[340px]">
                Sin serie diaria todavía: sincronizá para acumular cortes y ver costo vs ingresos en miles ($).
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-gray-800 bg-[#131A2A] p-6 shadow-lg">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <Zap className="h-4 w-4" aria-hidden /> Promedio diario (por sync)
              </h3>
              {avgDailyBlock ? (
                <div className="space-y-4">
                  <div className="flex items-end justify-between border-b border-gray-800 pb-2">
                    <span className="text-xs text-gray-400">Fecha actual</span>
                    <span className="text-sm font-medium text-white">{avgDailyBlock.lastDay}</span>
                  </div>
                  <div className="flex items-end justify-between border-b border-gray-800 pb-2">
                    <span className="text-xs text-gray-400">Costo promedio</span>
                    <span className="text-sm font-medium text-rose-400">{money(avgDailyBlock.avgCost)}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-xs text-gray-400">Profit promedio</span>
                    <span className="text-sm font-bold text-emerald-400">{money(avgDailyBlock.avgProfit)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Todavía no hay cortes diarios guardados para promediar.</p>
              )}
            </div>

            <div className="flex flex-1 flex-col rounded-xl border border-gray-800 bg-[#131A2A] p-6 shadow-lg">
              <h3 className="mb-4 text-sm font-semibold text-white">Resumen de impacto</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center justify-center rounded-lg border border-emerald-500/30 bg-[#0A0F1C] p-3 text-emerald-400">
                  <span className="text-xl font-bold text-white">{changeSummary.positive}</span>
                  <span className="text-xs uppercase tracking-wider opacity-80">Positivo</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border border-rose-500/30 bg-[#0A0F1C] p-3 text-rose-400">
                  <span className="text-xl font-bold text-white">{changeSummary.negative}</span>
                  <span className="text-xs uppercase tracking-wider opacity-80">Negativo</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border border-gray-600/50 bg-[#0A0F1C] p-3 text-gray-400">
                  <span className="text-xl font-bold text-white">{changeSummary.neutral}</span>
                  <span className="text-xs uppercase tracking-wider opacity-80">Neutral</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border border-amber-500/30 bg-[#0A0F1C] p-3 text-amber-400">
                  <span className="text-xl font-bold text-white">{changeSummary.pending}</span>
                  <span className="text-xs uppercase tracking-wider opacity-80">Pendiente</span>
                </div>
              </div>
              <p className="mt-3 text-center text-[10px] leading-tight text-gray-500">
                La evaluación se recalcula al sincronizar comparando CTR / ACOS / ROAS vs el período anterior (
                {compareDays === 1 ? "24h" : `${compareDays}d`}).
              </p>
            </div>
          </div>
        </section>
      )}

      {comparisons.length > 0 && (
        <details className="group overflow-hidden rounded-xl border border-gray-800 bg-[#131A2A] shadow-lg">
          <summary className="cursor-pointer list-none bg-[#1A2235] px-4 py-3 text-sm font-semibold text-white hover:bg-[#232D42] [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-blue-400" aria-hidden />
                Informe comparativo del ecosistema (tabla detallada)
              </span>
              <span className="text-xs font-normal text-gray-400 transition-transform group-open:-rotate-180">▼</span>
            </span>
          </summary>
          <div className="border-t border-gray-800 px-4 pb-4 pt-3">
            <p className="mb-3 text-xs text-gray-400">Estado actual de la ventana vs snapshots históricos comparados.</p>
            <div className="overflow-x-auto rounded-lg border border-gray-800">
              <table className="min-w-full text-xs">
                <thead className="bg-[#1A2235] text-gray-400">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Métrica</th>
                    <th className="px-3 py-2 text-right font-medium">Ahora</th>
                    {comparisons.map((c) => (
                      <th key={c.daysAgo} className="px-3 py-2 text-right font-medium">
                        Hace {c.daysAgo}d
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80">
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
                      <tr key={row.key} className="hover:bg-[#1C2538]">
                        <td className="px-3 py-2 font-medium text-gray-200">{row.label}</td>
                        <td className="px-3 py-2 text-right font-semibold text-white">{format(nowVal)}</td>
                        {comparisons.map((c) => {
                          const old = num(c.metrics[row.key] ?? 0);
                          const delta = num(c.deltasVsNow[row.key] ?? 0);
                          const direction: "up_good" | "down_good" =
                            row.key === "cost" || row.key === "acos" ? "down_good" : "up_good";
                          return (
                            <td key={`${row.key}-${c.daysAgo}`} className="px-3 py-2 text-right text-gray-300">
                              <div>{format(old)}</div>
                              {renderDelta(
                                delta,
                                row.fmt === "money" ? "money" : row.fmt === "pct" ? "pct" : "number",
                                direction,
                                money,
                                count,
                                { theme: "dark" }
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
          </div>
        </details>
      )}

      {recs.length > 0 && (
        <section id="actions-section" className="scroll-mt-24">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                <Zap className="h-6 w-6 fill-amber-400/15 text-amber-400" aria-hidden />
                Análisis automático — acciones sugeridas
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Revisá las alertas detectadas por el algoritmo y aplicá los cambios con un clic.
              </p>
            </div>
            <button
              type="button"
              disabled={applying || loading}
              onClick={applySelected}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Aplicar seleccionadas en ML
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-2 overflow-x-auto pb-1">
            {(
              [
                { id: "all" as const, label: `Todas (${recs.length})`, classes: "bg-blue-600 text-white" },
                { id: "critical" as const, label: `Crítico (${countCritical})`, accent: "border-gray-700 text-rose-400 hover:border-rose-500/40" },
                { id: "warning" as const, label: `Advertencia (${countWarning})`, accent: "border-gray-700 text-amber-400 hover:border-amber-500/40" },
                { id: "virtue" as const, label: `Virtudes (${countVirtue})`, accent: "border-gray-700 text-emerald-400 hover:border-emerald-500/40" },
              ] as const
            ).map((btn) => {
              const active = recFilter === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setRecFilter(btn.id)}
                  className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? btn.id === "all"
                        ? `${btn.classes} border-transparent`
                        : `border-gray-600 bg-[#232D42] text-white`
                      : `border bg-[#131A2A] ${"accent" in btn ? btn.accent : ""} hover:bg-[#1C2538]`
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          {filteredRecs.length === 0 ? (
            <p className="rounded-xl border border-gray-800 bg-[#131A2A] px-4 py-6 text-center text-sm text-gray-400 shadow-lg">
              No hay acciones en esta categoría con los filtros actuales.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredRecs.map((r) => {
                const tone =
                  r.severity === "critical"
                    ? {
                        chip: "text-rose-400",
                        label: "Acción urgente",
                        icon: "alert" as const,
                      }
                    : r.severity === "warning"
                      ? {
                          chip: "text-amber-400",
                          label: "Acción recomendada",
                          icon: "alert" as const,
                        }
                      : r.expectedImpact === "positive"
                        ? {
                            chip: "text-emerald-400",
                            label: "Virtud detectada",
                            icon: "ok" as const,
                          }
                        : {
                            chip: "text-sky-300",
                            label: "Informativo",
                            icon: "ok" as const,
                          };
                const confPct = r.confidence <= 1 ? (r.confidence * 100).toFixed(0) : Number(r.confidence).toFixed(0);
                return (
                  <div
                    key={r.id}
                    className="group flex gap-4 rounded-xl border border-gray-800 bg-[#131A2A] p-4 shadow-lg transition-all hover:border-blue-500/50"
                  >
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-600 bg-[#0A0F1C] accent-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#131A2A]"
                        checked={Boolean(selected[r.id])}
                        onChange={() => toggleRec(r.id)}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        {tone.icon === "alert" ? (
                          <AlertTriangle className={`h-4 w-4 shrink-0 ${tone.chip}`} aria-hidden />
                        ) : (
                          <CheckCircle2 className={`h-4 w-4 shrink-0 ${tone.chip}`} aria-hidden />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Motivo detectado</span>
                      </div>
                      <div className={`mb-1 text-[10px] font-semibold uppercase tracking-wider ${tone.chip}`}>{tone.label}</div>
                      <h4 className="mb-3 text-base font-medium text-white">{r.title}</h4>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] text-blue-400">
                          {categoryLabel(r.category)}
                        </span>
                        <span className="rounded border border-purple-500/20 bg-purple-500/10 px-2 py-1 text-[10px] text-purple-400">
                          Confianza {confPct}%
                        </span>
                        {typeof r.priorityScore === "number" && (
                          <span className="rounded border border-pink-500/20 bg-pink-500/10 px-2 py-1 text-[10px] text-pink-400">
                            Prioridad {Math.round(r.priorityScore)}
                          </span>
                        )}
                      </div>
                      <div className="mb-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[11px] leading-snug text-gray-500">
                        <span className="max-w-full truncate font-medium text-gray-200" title={r.campaignName}>
                          {r.campaignName || `Campaña ${r.campaignId}`}
                        </span>
                        <span className="text-gray-600" aria-hidden>
                          ·
                        </span>
                        <span>
                          {(r.campaignItemsCount ?? 0) > 0 ? (
                            <>
                              <span className="tabular-nums text-gray-400">{r.campaignItemsCount}</span>{" "}
                              producto{(r.campaignItemsCount ?? 0) === 1 ? "" : "s"}
                            </>
                          ) : (
                            <span className="text-gray-500">Publicaciones: sin dato</span>
                          )}
                        </span>
                        <span className="text-gray-600" aria-hidden>
                          ·
                        </span>
                        <span className="tabular-nums text-gray-400">
                          Presup.{" "}
                          {money(
                            typeof r.campaignBudget === "number"
                              ? r.campaignBudget
                              : num((r.applyPayload as { budget?: unknown })?.budget)
                          )}
                          <span className="text-gray-500"> / día</span>
                          {(() => {
                            const proposed = num((r.applyPayload as { budget?: unknown })?.budget);
                            const cur =
                              typeof r.campaignBudget === "number"
                                ? r.campaignBudget
                                : proposed;
                            if (
                              proposed > 0 &&
                              cur > 0 &&
                              Math.round(proposed * 100) !== Math.round(cur * 100)
                            ) {
                              return (
                                <span className="text-emerald-400">
                                  {" "}
                                  (sug. ~{money(proposed)})
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </span>
                        <span className="w-full font-mono text-[10px] text-gray-600 sm:w-auto sm:pl-1">
                          #{r.campaignId}
                        </span>
                      </div>
                      <div className="mb-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRecAnalysis((prev) => ({
                              ...prev,
                              [r.id]: !prev[r.id],
                            }))
                          }
                          className="text-left text-xs font-medium text-blue-400 underline-offset-2 hover:text-blue-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded"
                          aria-expanded={Boolean(expandedRecAnalysis[r.id])}
                        >
                          {expandedRecAnalysis[r.id]
                            ? "Ocultar detalles del análisis"
                            : "Leer más detalles del análisis"}
                        </button>
                        {expandedRecAnalysis[r.id] && (
                          <p className="mt-2 text-sm leading-relaxed text-gray-300">{r.rationale}</p>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-3 text-xs text-gray-500">
                        <span className="text-[10px] text-gray-600">Mercado Libre Ads</span>
                        <span className="flex items-center gap-1 font-medium text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                          Listo para aplicar
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

          {!loading && snapshot && camps.length === 0 && (snapshot.advertisers?.length ?? 0) > 0 && (
            <div className="space-y-3 rounded-xl border border-gray-800 bg-[#131A2A] p-4 shadow-lg">
              <p className="text-sm text-gray-400">
                No hay campañas PADS listadas para estos anunciantes. Si antes veías datos, suele deberse a un rechazo del
                endpoint de búsqueda de ML o a que la respuesta vino en otro formato; revisá los avisos abajo o en el toast.
              </p>
              {Array.isArray(snapshot.errors) && snapshot.errors.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-xs text-amber-50">
                  <p className="mb-1 font-semibold text-amber-200">Respuesta / rutas ML</p>
                  <ul className="list-disc space-y-0.5 pl-4 opacity-90">
                    {snapshot.errors.slice(0, 8).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          </div>
        )}

        {studioTab === "table" && (
          <>
            {camps.length > 0 && (
        <section className="flex flex-col overflow-hidden rounded-xl border border-gray-800 bg-[#131A2A] shadow-lg">
          <div className="flex flex-col gap-4 border-b border-gray-800 bg-[#1A2235] p-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <BarChart2 className="h-5 w-5 text-blue-400" aria-hidden />
              Rendimiento detallado
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" aria-hidden />
                <input
                  type="search"
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                  placeholder="Buscar campaña…"
                  className="w-full min-w-[200px] rounded-lg border border-gray-700 bg-[#0A0F1C] py-1.5 pl-8 pr-3 text-sm text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:outline-none sm:w-64"
                  aria-label="Buscar campaña por nombre"
                />
              </div>
              <span className="hidden items-center gap-2 rounded-lg border border-gray-700 bg-[#232D42] px-3 py-1.5 text-sm text-gray-300 sm:inline-flex" title="Filtros avanzados próximamente">
                <Filter className="h-3.5 w-3.5" aria-hidden />
                Filtros
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-4 border-b border-gray-800 bg-[#1A2235]/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">Ordenar columnas y dirección (misma lógica que antes).</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="py-1.5 text-gray-400">Ordenar por:</span>
              {[
                { id: "name", label: "Nombre" },
                { id: "clicks", label: "Clics" },
                { id: "acos", label: "ACOS" },
                { id: "roas", label: "ROAS" },
                { id: "prints", label: "Impresiones" },
                { id: "ctr", label: "CTR" },
                { id: "cost", label: "Costo" },
                { id: "budget", label: "Presupuesto" },
              ].map((opt) => {
                const active = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSortBy(opt.id as typeof sortBy)}
                    className={`rounded px-3 py-1.5 font-medium transition-colors ${
                      active ? "bg-blue-600 text-white shadow-sm" : "bg-[#232D42] text-gray-200 hover:bg-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
              <span className="mx-1 hidden h-6 w-px bg-slate-600 sm:inline" aria-hidden />
              <button
                type="button"
                onClick={() => setSortDir("desc")}
                className={`rounded px-3 py-1.5 font-medium transition-colors ${
                  sortDir === "desc"
                    ? "border border-blue-500/40 bg-blue-600/25 text-blue-300"
                    : "border border-gray-700 bg-[#232D42] text-gray-300 hover:bg-gray-700"
                }`}
              >
                Descendente
              </button>
              <button
                type="button"
                onClick={() => setSortDir("asc")}
                className={`rounded px-3 py-1.5 font-medium transition-colors ${
                  sortDir === "asc"
                    ? "border border-blue-500/40 bg-blue-600/25 text-blue-300"
                    : "border border-gray-700 bg-[#232D42] text-gray-300 hover:bg-gray-700"
                }`}
              >
                Ascendente
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortBy("clicks");
                  setSortDir("desc");
                }}
                className="rounded bg-blue-600 px-2.5 py-1.5 text-white hover:bg-blue-500"
              >
                Más clics
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortBy("clicks");
                  setSortDir("asc");
                }}
                className="rounded bg-slate-700 px-2.5 py-1.5 text-white hover:bg-gray-600"
              >
                Menos clics
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm whitespace-nowrap text-gray-300">
              <thead className="sticky top-0 z-10 bg-[#1A2235] text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3">Campaña</th>
                  <th className="px-4 py-3">Estado / estrategia</th>
                  <th className="px-4 py-3 text-right">Presupuesto</th>
                  <th className="px-4 py-3 text-right">Impresiones / clics</th>
                  <th className="px-4 py-3 text-right">CTR / costo</th>
                  <th className="px-4 py-3 text-right">ACOS / ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredSortedCamps.map((c) => {
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
                  const acosTone = acos > 50 ? "text-rose-400" : acos > 30 ? "text-amber-400" : "text-emerald-400";
                  return (
                    <Fragment key={rowKey}>
                      <tr className="transition-colors hover:bg-[#1C2538]">
                        <td className="max-w-[280px] px-4 py-4 align-top">
                          <div className="mb-2 font-bold text-white">{c.name || c.id}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {editingCampaignNameRow === rowKey ? (
                              <>
                                <input
                                  autoFocus
                                  value={editingNames[rowKey] ?? c.name ?? ""}
                                  onChange={(e) => setEditingNames((s) => ({ ...s, [rowKey]: e.target.value }))}
                                  className="h-8 w-44 rounded border border-slate-600 bg-slate-900 px-2 text-xs text-white"
                                  placeholder="Nuevo nombre"
                                />
                                <button
                                  type="button"
                                  disabled={renamingId === rowKey}
                                  onClick={async () => {
                                    await renameCampaign(c);
                                    setEditingCampaignNameRow(null);
                                  }}
                                  className="h-8 rounded bg-blue-600 px-2 text-xs text-white disabled:opacity-50"
                                >
                                  {renamingId === rowKey ? "..." : "Guardar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCampaignNameRow(null);
                                    setEditingNames((s) => ({ ...s, [rowKey]: c.name ?? "" }));
                                  }}
                                  className="h-8 rounded border border-slate-600 bg-slate-800 px-2 text-xs text-slate-200"
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
                                  className="inline-flex h-8 items-center justify-center rounded border border-gray-700 bg-gray-800/80 p-1.5 text-gray-400 transition-colors hover:bg-blue-600 hover:text-white"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleCampaignItems(c)}
                                  className="inline-flex h-8 items-center gap-1 rounded border border-gray-700 bg-gray-800/80 px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-amber-400 transition-colors hover:bg-gray-700 hover:text-amber-300"
                                >
                                  <Eye size={12} aria-hidden />
                                  Ver artículos
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                            {statusLabel(c.status)}
                          </span>
                          <div className="mt-2 text-xs text-gray-400">{strategyLabel(c.strategy)}</div>
                        </td>
                        <td className="px-4 py-4 text-right align-top">
                          <div className="font-bold text-emerald-400">{money(c.budget)}</div>
                          <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Diario</div>
                        </td>
                        <td className="px-4 py-4 text-right align-top">
                          <div className="font-medium text-white">
                            {count(prints)} <span className="text-[10px] font-normal text-gray-500">vistas</span>
                          </div>
                          <div className="mt-1 font-medium text-white">
                            {count(clicks)} <span className="text-[10px] font-normal text-gray-500">clics</span>
                          </div>
                          <div className="mt-1 flex justify-end">
                            {renderDelta(num(prints) - num(p.prints), "number", "up_good", money, count, {
                              theme: "dark",
                            })}
                          </div>
                          <div className="flex justify-end">
                            {renderDelta(num(clicks) - num(p.clicks), "number", "up_good", money, count, {
                              theme: "dark",
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right align-top font-mono">
                          <div className="font-medium text-white">{Number.isFinite(ctr) ? pct(ctr) : "—"}</div>
                          <div className="mt-1 font-sans font-medium text-rose-400">{money(cost)}</div>
                          <div className="mt-1 flex justify-end">
                            {renderDelta(Number.isFinite(ctr) ? ctr - prevCtr : 0, "pct", "up_good", money, count, {
                              theme: "dark",
                            })}
                          </div>
                          <div className="flex justify-end">
                            {renderDelta(cost - num(p.cost), "money", "down_good", money, count, { theme: "dark" })}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right align-top font-mono">
                          <div className={`font-bold ${acosTone}`}>{pct(acos)}</div>
                          <div className="mt-1 text-blue-400">{ratio(roas)}x</div>
                          <div className="mt-1 flex justify-end">
                            {renderDelta(acos - num(p.acos), "pct", "down_good", money, count, { theme: "dark" })}
                          </div>
                          <div className="flex justify-end">
                            {renderDelta(roas - num(p.roas), "number", "up_good", money, count, { theme: "dark" })}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-[#0A0F1C]/80">
                          <td colSpan={6} className="px-4 py-4">
                            {loadingItems[rowKey] ? (
                              <p className="text-xs text-gray-400">Cargando artículos...</p>
                            ) : (campaignItems[rowKey] ?? []).length === 0 ? (
                              <p className="text-xs text-gray-400">Sin artículos reportados para esta campaña.</p>
                            ) : (
                              <div className="space-y-2">
                                {(campaignItems[rowKey] ?? []).slice(0, 30).map((it, idx) => {
                                  const mm = (it.metrics || {}) as Record<string, unknown>;
                                  return (
                                    <div
                                      key={`${it.item_id ?? idx}`}
                                      className="flex flex-wrap gap-3 rounded-lg border border-gray-700 bg-[#131A2A] px-3 py-2 text-xs text-gray-300"
                                    >
                                      <span className="font-medium text-white">{it.title || it.item_id || "Ítem"}</span>
                                      <span className="text-gray-400">ID: {it.item_id || "-"}</span>
                                      <span className="text-gray-400">Estado: {statusLabel(it.status)}</span>
                                      <span>Clicks: {count(mm.clicks ?? 0)}</span>
                                      <span>Impresiones: {count(mm.prints ?? 0)}</span>
                                      <span className="text-rose-300">Costo: {money(mm.cost ?? 0)}</span>
                                      <span className="text-blue-400">ROAS: {ratio(mm.roas ?? 0)}x</span>
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
              <tfoot className="border-t border-gray-800 bg-[#1A2235] font-bold text-white">
                <tr>
                  <td className="px-4 py-4">TOTALES</td>
                  <td className="px-4 py-4 text-gray-500">—</td>
                  <td className="px-4 py-4 text-right text-emerald-400">{money(totals.budget)}</td>
                  <td className="px-4 py-4 text-right">
                    <div>
                      {count(totals.prints)} <span className="text-xs font-normal text-gray-500">vistas</span>
                    </div>
                    <div className="mt-1 font-normal text-gray-300">
                      {count(totals.clicks)} <span className="text-xs text-gray-500">clics</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-mono">
                    <div className="font-bold">{pct(totals.ctr)}</div>
                    <div className="mt-1 font-sans font-medium text-rose-400">{money(totals.cost)}</div>
                  </td>
                  <td className="px-4 py-4 text-right font-mono">
                    <div className={num(totals.acos) > 50 ? "text-rose-400" : num(totals.acos) > 30 ? "text-amber-400" : "text-emerald-400"}>
                      {pct(totals.acos)}
                    </div>
                    <div className="mt-1 text-blue-400">{ratio(totals.roas)}x</div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

            {camps.length === 0 && (
              <div className="rounded-xl border border-gray-800 bg-[#131A2A] p-8 text-center text-sm text-gray-400 shadow-lg">
                No hay campañas para mostrar en la tabla. Usá el resumen o actualizá los datos desde Mercado Libre.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
