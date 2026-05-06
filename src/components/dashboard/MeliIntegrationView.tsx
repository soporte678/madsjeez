"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Loader2, Link2, RefreshCw, ShoppingBag, Megaphone, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type MeliStatus = {
  connected: boolean;
  meliUserId: string | null;
  expiresAt: string | null;
};

type ImportPreview = {
  totalFound: number;
  uniqueFound: number;
  alreadyLinked: number;
  toCreate: number;
  toUpdate: number;
  breakdown: {
    byStatus: Record<string, number>;
    byCondition: Record<string, number>;
    byListingType: Record<string, number>;
  };
  samples: Array<{
    id: string;
    title: string;
    price: number;
    status: string;
    condition: string;
    listingType: string;
    stock: number;
    sold: number;
    action: "create" | "update";
  }>;
  warnings: string[];
};

export default function MeliIntegrationView() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const [meliStatus, setMeliStatus] = useState<MeliStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [importing, setImporting] = useState(false);
  const [syncingCamp, setSyncingCamp] = useState(false);
  const [promoPreview, setPromoPreview] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [loadingImportPreview, setLoadingImportPreview] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const r = await fetch("/api/meli/status");
      const d = await r.json();
      if (r.ok) setMeliStatus(d);
      else setMeliStatus({ connected: false, meliUserId: null, expiresAt: null });
    } catch {
      setMeliStatus({ connected: false, meliUserId: null, expiresAt: null });
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadStatus();
  }, [status, loadStatus]);

  useEffect(() => {
    const err = searchParams.get("error");
    const ok = searchParams.get("connected");
    const errorMessages: Record<string, string> = {
      meli_db_schema:
        "La base de datos no tiene la tabla de Mercado Libre. Hay que ejecutar migraciones (prisma migrate deploy) en el servidor y volver a conectar.",
      invalid_state: "La sesión de OAuth caducó o es inválida. Probá “Conectar Mercado Libre” de nuevo.",
      meli_not_configured: "Faltan variables MELI_APP_ID / MELI_CLIENT_SECRET / MELI_REDIRECT_URI en el servidor.",
      users_me_failed: "Mercado Libre no devolvió tu usuario. Reintentá o revisá permisos de la app.",
      no_meli_user: "No se pudo leer tu ID de usuario en Mercado Libre.",
      oauth_error: "Error al guardar la conexión. Revisá logs del servidor.",
    };
    if (err) {
      const decoded = decodeURIComponent(err).replace(/\s+/g, " ").trim();
      toast.error(errorMessages[decoded] || errorMessages[err] || decoded.slice(0, 280));
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
    }
    if (ok) {
      toast.success("Mercado Libre conectado correctamente.");
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
    }
  }, [searchParams]);

  const connectMeli = () => {
    window.location.href = "/api/meli/oauth/authorize";
  };

  const loadImportPreview = async () => {
    setLoadingImportPreview(true);
    try {
      const r = await fetch("/api/meli/import?maxPages=15&sampleSize=30");
      const d = await r.json();
      if (!r.ok) {
        toast.error(d.error || "No se pudo generar la vista previa");
        return;
      }
      setImportPreview(d.preview || null);
      if (d.preview) {
        toast.success(
          `Vista previa lista: ${d.preview.toCreate} nuevas y ${d.preview.toUpdate} para actualizar`
        );
      }
    } catch {
      toast.error("Error de red al leer vista previa");
    } finally {
      setLoadingImportPreview(false);
    }
  };

  const runImport = async () => {
    if (!importPreview) {
      toast.error("Primero revisá la vista previa de publicaciones");
      return;
    }
    setImporting(true);
    try {
      const r = await fetch("/api/meli/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPages: 15, requireConfirm: true, confirmed: true }),
      });
      const d = await r.json();
      if (!r.ok) {
        toast.error(d.error || "Error al importar");
        return;
      }
      if (d.needsConfirmation) {
        setImportPreview(d.preview || null);
        toast.message("Confirmá la importación luego de revisar la vista previa.");
        return;
      }
      toast.success(`Importadas: ${d.imported}, actualizadas: ${d.updated}`);
      await loadImportPreview();
      if (d.errorCount > 0) {
        toast.message(`${d.errorCount} avisos`, {
          description: (d.errors || []).slice(0, 3).join(" · "),
        });
      }
    } catch {
      toast.error("Error de red al importar");
    } finally {
      setImporting(false);
    }
  };

  const loadPromotionsPreview = async () => {
    try {
      const r = await fetch("/api/meli/promotions");
      const d = await r.json();
      if (!r.ok) {
        toast.error(d.error || "No se pudieron leer promociones");
        return;
      }
      setPromoPreview(JSON.stringify(d, null, 2).slice(0, 12000));
    } catch {
      toast.error("Error al cargar promociones ML");
    }
  };

  const syncCampaigns = async () => {
    setSyncingCamp(true);
    try {
      const r = await fetch("/api/meli/promotions/sync", { method: "POST" });
      const d = await r.json();
      if (!r.ok) {
        toast.error(d.error || "Error al sincronizar campañas");
        return;
      }
      toast.success(
        `Campañas: ${d.created} nuevas, ${d.updated} actualizadas (${d.rawCount} promos en ML)`
      );
    } catch {
      toast.error("Error de red");
    } finally {
      setSyncingCamp(false);
    }
  };

  if (status === "loading" || loadingStatus) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <p className="text-slate-600">Iniciá sesión para usar Mercado Libre.</p>;
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Mercado Libre</h2>
        <p className="text-sm text-slate-600 mt-1">
          Conectá tu cuenta de Mercado Libre para importar tus publicaciones y traer promociones a las campañas de
          MADSJEEZ. Cualquier usuario logueado puede usar esta herramienta (tus ítems quedan asociados a tu cuenta).
        </p>
        <p className="text-sm mt-2">
          <a
            href="/dashboard#meli-ads-studio"
            className="text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            Mercado Libre Ads — datos en vivo, análisis automático y aplicar cambios en campañas PADS
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-slate-800">Estado de conexión</p>
            <p className="text-xs text-slate-500">
              {meliStatus?.connected
                ? `Conectado · usuario ML ${meliStatus.meliUserId}`
                : "Sin conectar"}
            </p>
          </div>
          <button
            type="button"
            onClick={connectMeli}
            className="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-4 py-2 text-sm shadow-sm"
          >
            <Link2 className="w-4 h-4" />
            {meliStatus?.connected ? "Reconectar Mercado Libre" : "Conectar Mercado Libre"}
          </button>
        </div>
        <a
          href="https://developers.mercadolibre.com.ar/es_ar/autenticacion-y-autorizacion"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Documentación OAuth ML <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-slate-900">Importar publicaciones</h3>
        </div>
        <p className="text-sm text-slate-600">
          Trae tus publicaciones activas desde Mercado Libre a MADSJEEZ (título, fotos, precio, stock, envío, etc.).
          Los productos aparecen en búsqueda y en la ficha usando tu catálogo Prisma.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!meliStatus?.connected || loadingImportPreview || importing}
            onClick={loadImportPreview}
            className="rounded-lg border border-border bg-card hover:bg-muted px-4 py-2 text-sm font-medium text-foreground disabled:opacity-50"
          >
            {loadingImportPreview ? "Leyendo publicaciones..." : "Ver vista previa de publicaciones"}
          </button>
          <button
            type="button"
            disabled={!meliStatus?.connected || importing || !importPreview}
            onClick={runImport}
            className="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-medium px-4 py-2 text-sm shadow-sm"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Confirmar importación (sin duplicar)
          </button>
        </div>
        {importPreview && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-xs text-slate-700 font-medium">
              Vista previa: {importPreview.uniqueFound} publicaciones únicas leídas desde ML ({importPreview.totalFound} registros
              escaneados).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="rounded bg-white border border-slate-200 p-2">
                <span className="text-slate-500">Se crearán</span>
                <div className="text-base font-bold text-emerald-700">{importPreview.toCreate}</div>
              </div>
              <div className="rounded bg-white border border-slate-200 p-2">
                <span className="text-slate-500">Se actualizarán</span>
                <div className="text-base font-bold text-primary">{importPreview.toUpdate}</div>
              </div>
              <div className="rounded bg-white border border-slate-200 p-2">
                <span className="text-slate-500">Ya vinculadas (no duplica)</span>
                <div className="text-base font-bold text-slate-800">{importPreview.alreadyLinked}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="font-semibold text-slate-700 mb-1">Por estado</p>
                <div className="space-y-1">
                  {Object.entries(importPreview.breakdown.byStatus).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-slate-600"><span>{k}</span><span>{v}</span></div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Por condición</p>
                <div className="space-y-1">
                  {Object.entries(importPreview.breakdown.byCondition).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-slate-600"><span>{k}</span><span>{v}</span></div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Por tipo de publicación</p>
                <div className="space-y-1">
                  {Object.entries(importPreview.breakdown.byListingType).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-slate-600"><span>{k}</span><span>{v}</span></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs bg-white border border-slate-200 rounded">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="text-left px-2 py-1">Publicación</th>
                    <th className="text-right px-2 py-1">Precio</th>
                    <th className="text-left px-2 py-1">Tipo</th>
                    <th className="text-left px-2 py-1">Condición</th>
                    <th className="text-left px-2 py-1">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.samples.slice(0, 15).map((s) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-2 py-1 text-slate-700 max-w-[260px] truncate">{s.title}</td>
                      <td className="px-2 py-1 text-right text-slate-700">${Number(s.price || 0).toLocaleString("es-AR")}</td>
                      <td className="px-2 py-1 text-slate-600">{s.listingType}</td>
                      <td className="px-2 py-1 text-slate-600">{s.condition}</td>
                      <td className={`px-2 py-1 font-semibold ${s.action === "create" ? "text-emerald-700" : "text-primary"}`}>
                        {s.action === "create" ? "Crear" : "Actualizar"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-slate-900">Campañas con datos de ML</h3>
        </div>
        <p className="text-sm text-slate-600">
          Lee las promociones que Mercado Libre devuelve para tu cuenta y creá o actualizá registros en{" "}
          <strong>Campañas</strong> locales (fechas, tipo y descuento estimado). Podés inspeccionar el JSON crudo antes
          de sincronizar.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!meliStatus?.connected}
            onClick={loadPromotionsPreview}
            className="rounded-lg border border-border bg-card hover:bg-muted px-4 py-2 text-sm font-medium text-foreground disabled:opacity-50"
          >
            Ver JSON promociones ML
          </button>
          <button
            type="button"
            disabled={!meliStatus?.connected || syncingCamp}
            onClick={syncCampaigns}
            className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary/10 text-primary hover:bg-primary/15 disabled:opacity-50 font-semibold px-4 py-2 text-sm"
          >
            {syncingCamp ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Sincronizar con campañas MADSJEEZ
          </button>
        </div>
        {promoPreview && (
          <pre className="text-[11px] bg-slate-950 text-slate-100 p-4 rounded-lg overflow-auto max-h-[320px] whitespace-pre-wrap">
            {promoPreview}
          </pre>
        )}
      </div>
    </div>
  );
}
