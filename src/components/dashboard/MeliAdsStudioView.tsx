"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
  ChevronDown,
  ChevronUp,
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
  title: string;
  rationale: string;
  campaignId: number;
  campaignName: string;
  siteId: string;
  applyPayload: Record<string, unknown>;
};

export default function MeliAdsStudioView() {
  const { status: sess } = useSession();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [snapshot, setSnapshot] = useState<{
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
    errors?: string[];
  } | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meli/ads/snapshot?analyze=1&days=14");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "No se pudo cargar Product Ads");
        setSnapshot(null);
        return;
      }
      setSnapshot(data);
      setSelected({});
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        toast.message("Mercado Libre devolvió avisos", {
          description: data.errors.slice(0, 4).join(" · "),
        });
      }
    } catch {
      toast.error("Error de red");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleRec = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const applySelected = async () => {
    const recs = snapshot?.recommendations ?? [];
    const actions = recs
      .filter((r) => selected[r.id])
      .map((r) => ({
        siteId: r.siteId,
        campaignId: r.campaignId,
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
  const camps = snapshot?.campaigns ?? [];
  const totals = snapshot?.totals ?? {};
  const deltas = snapshot?.deltas ?? {};
  const finance = snapshot?.finance ?? {};

  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const money = (v: unknown) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(num(v));
  const count = (v: unknown) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(num(v));
  const pct = (v: unknown, digits = 2) => `${num(v).toFixed(digits)}%`;
  const ratio = (v: unknown, digits = 2) => num(v).toFixed(digits);

  const Delta = ({ value, kind = "number" }: { value: number; kind?: "number" | "money" | "pct" }) => {
    if (!Number.isFinite(value) || value === 0) return <span className="text-xs text-gray-400">= 0</span>;
    const up = value > 0;
    const text =
      kind === "money" ? money(Math.abs(value)) : kind === "pct" ? `${Math.abs(value).toFixed(2)} pp` : count(Math.abs(value));
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-600" : "text-red-600"}`}>
        {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        {text}
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Mercado Libre Ads — estudio automático</h2>
        <p className="text-sm text-gray-600 mt-1 max-w-3xl">
          Traemos tus campañas de <strong>Product Ads (PADS)</strong>, métricas recientes de Mercado Libre y un{" "}
          <strong>análisis automático</strong> con reglas de performance (CTR, ACOS vs benchmark, pérdida por
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
          onClick={load}
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
            <Delta value={num(deltas.budget)} kind="money" />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Gasto (ventana actual)</p>
            <p className="text-xl font-bold text-emerald-700">{money(totals.cost)}</p>
            <Delta value={num(deltas.cost)} kind="money" />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Ingresos estimados Ads</p>
            <p className="text-xl font-bold text-emerald-700">{money(totals.revenue)}</p>
            <Delta value={num(deltas.revenue)} kind="money" />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Ganancia estimada</p>
            <p className={`text-xl font-bold ${num(totals.profit) >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {money(totals.profit)}
            </p>
            <Delta value={num(deltas.profit)} kind="money" />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Próxima factura (proyección)</p>
            <p className="text-xl font-bold text-emerald-700">{money(finance.nextInvoiceProjection)}</p>
            <p className="text-xs text-gray-500 mt-1">Diario: {money(finance.avgDailySpent)}</p>
          </div>
        </section>
      )}

      {camps.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-900">Campañas y métricas (ML)</h3>
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
                {camps.map((c) => {
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
                  return (
                    <tr key={`${c.site_id}-${c.id}`} className="border-t border-gray-100 hover:bg-gray-50/80">
                      <td className="px-3 py-2 text-gray-900 font-medium max-w-[220px] truncate">
                        {c.name || c.id}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{c.status}</td>
                      <td className="px-3 py-2 text-gray-700">{c.strategy}</td>
                      <td className="px-3 py-2 text-right text-emerald-700 font-semibold">
                        <div>{money(c.budget)}</div>
                        <span className="text-xs text-gray-400">diario</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div>{count(prints)}</div>
                        <Delta value={num(prints) - num(p.prints)} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div>{count(clicks)}</div>
                        <Delta value={num(clicks) - num(p.clicks)} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div>{Number.isFinite(ctr) ? pct(ctr) : "—"}</div>
                        <Delta value={Number.isFinite(ctr) ? ctr - prevCtr : 0} kind="pct" />
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-700 font-semibold">
                        <div>{money(cost)}</div>
                        <Delta value={cost - num(p.cost)} kind="money" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div>{pct(acos)}</div>
                        <Delta value={acos - num(p.acos)} kind="pct" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div>{ratio(roas)}x</div>
                        <Delta value={roas - num(p.roas)} />
                      </td>
                    </tr>
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
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-900">Análisis automático — acciones sugeridas</h3>
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
          <ul className="divide-y divide-gray-100">
            {recs.map((r) => {
              const Icon =
                r.severity === "critical"
                  ? AlertTriangle
                  : r.severity === "warning"
                    ? AlertTriangle
                    : Info;
              const color =
                r.severity === "critical"
                  ? "text-red-600 bg-red-50 border-red-100"
                  : r.severity === "warning"
                    ? "text-primary bg-primary/10 border-primary/20"
                    : "text-blue-700 bg-blue-50 border-blue-100";
              const open = expanded[r.id];
              return (
                <li key={r.id} className="p-4">
                  <div className="flex gap-3 items-start">
                    <input
                      type="checkbox"
                      className="mt-1.5 rounded border-gray-300"
                      checked={Boolean(selected[r.id])}
                      onChange={() => toggleRec(r.id)}
                    />
                    <div className={`rounded-lg border p-2 shrink-0 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{r.title}</span>
                        <span className="text-[11px] uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {r.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{r.rationale}</p>
                      <p className="text-xs text-gray-500">
                        Campaña #{r.campaignId} · {r.campaignName}
                      </p>
                      <button
                        type="button"
                        onClick={() => setExpanded((e) => ({ ...e, [r.id]: !open }))}
                        className="text-xs text-primary font-medium inline-flex items-center gap-1 mt-1 hover:underline"
                      >
                        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        Ver payload ML (PUT)
                      </button>
                      {open && (
                        <pre className="text-[11px] bg-slate-950 text-slate-100 p-3 rounded-lg mt-2 overflow-auto max-h-48">
                          {JSON.stringify(r.applyPayload, null, 2)}
                        </pre>
                      )}
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
