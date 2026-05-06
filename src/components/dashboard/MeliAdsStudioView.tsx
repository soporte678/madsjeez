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
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (sess === "unauthenticated") {
    return <p className="text-gray-600 text-sm">Iniciá sesión para usar esta herramienta.</p>;
  }

  const recs = snapshot?.recommendations ?? [];
  const camps = snapshot?.campaigns ?? [];

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
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
          Requiere tener Product Ads habilitado en Mercado Libre y scopes OAuth adecuados. Si ves 404 en anunciantes,
          activá las campañas desde ML → Gestión de publicaciones → Publicidad.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <button
          type="button"
          disabled={loading}
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-2 text-sm"
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
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900 flex gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          No hay anunciante PADS para esta cuenta. Verificá permisos u operativamente Product Ads en Mercado Libre.
        </div>
      )}

      {camps.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
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
                  const prints = m.prints ?? 0;
                  const clicks = m.clicks ?? 0;
                  let ctr = "—";
                  if (prints > 0) ctr = ((clicks / prints) * 100).toFixed(2);
                  else if (m.ctr != null && Number.isFinite(m.ctr)) {
                    const v = Number(m.ctr);
                    ctr = (v <= 1 ? v * 100 : v).toFixed(2);
                  }
                  return (
                    <tr key={`${c.site_id}-${c.id}`} className="border-t border-gray-100 hover:bg-gray-50/80">
                      <td className="px-3 py-2 text-gray-900 font-medium max-w-[220px] truncate">
                        {c.name || c.id}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{c.status}</td>
                      <td className="px-3 py-2 text-gray-700">{c.strategy}</td>
                      <td className="px-3 py-2 text-right">{c.budget ?? "—"}</td>
                      <td className="px-3 py-2 text-right">{prints}</td>
                      <td className="px-3 py-2 text-right">{clicks}</td>
                      <td className="px-3 py-2 text-right">{ctr}</td>
                      <td className="px-3 py-2 text-right">{m.cost ?? "—"}</td>
                      <td className="px-3 py-2 text-right">{m.acos ?? "—"}</td>
                      <td className="px-3 py-2 text-right">{m.roas ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {recs.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
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
                    ? "text-amber-700 bg-amber-50 border-amber-100"
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
                        className="text-xs text-blue-600 font-medium inline-flex items-center gap-1 mt-1 hover:underline"
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
        <p className="text-sm text-gray-600">No hay campañas PADS listadas para estos anunciantes.</p>
      )}
    </div>
  );
}
