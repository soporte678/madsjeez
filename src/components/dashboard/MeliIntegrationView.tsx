"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  Link2,
  RefreshCw,
  ShoppingBag,
  Megaphone,
  ExternalLink,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
} from "lucide-react";
import { toast } from "sonner";

type MeliStatus = {
  connected: boolean;
  meliUserId: string | null;
  expiresAt: string | null;
};

type PreviewRow = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  meliPrice: number;
  meliStock: number;
  localPrice: number | null;
  localStock: number | null;
  sellerSku: string | null;
  status: string;
  condition: string;
  listingType: string;
  sold: number;
  action: "create" | "update";
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
  rows: PreviewRow[];
  samples: PreviewRow[];
  warnings: string[];
};

type LocalUnpublished = {
  id: string;
  title: string;
  sku: string | null;
  stock: number;
  price: number;
  isActive: boolean;
  thumbnailUrl: string | null;
};

type QuickFilter = "all" | "active_only" | "updates_only" | "new_only" | "price_diff" | "stock_diff";

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

function formatRelativeSync(iso: string | null): string {
  if (!iso) return "Sin importaciones completadas aún.";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "Sin datos de fecha.";
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Hace menos de 1 minuto.";
  if (m < 60) return `Hace ${m} minutos.`;
  const h = Math.floor(m / 60);
  if (h < 48) return `Hace ${h} horas.`;
  const d = Math.floor(h / 24);
  return `Hace ${d} días.`;
}

function statusBadgeClasses(status: string): string {
  const s = status.toLowerCase();
  if (s === "active") return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/40";
  if (s === "paused") return "bg-slate-400/20 text-slate-800 dark:text-slate-100 border-slate-400/45";
  if (s === "closed" || s === "inactive") return "bg-red-500/15 text-red-800 dark:text-red-200 border-red-500/35";
  if (s.includes("review")) return "bg-amber-400/20 text-amber-950 dark:text-amber-100 border-amber-500/40";
  return "bg-muted text-muted-foreground border-border";
}

function statusLabelEs(status: string): string {
  const s = status.toLowerCase();
  const map: Record<string, string> = {
    active: "Activa",
    paused: "Pausada",
    closed: "Cerrada",
    inactive: "Inactiva",
    under_review: "En revisión",
  };
  return map[s] || status;
}

function listingBadgeClasses(listingType: string): string {
  const t = listingType.toLowerCase();
  if (t.includes("gold_pro") || t.includes("gold_special"))
    return "bg-amber-400/25 text-amber-950 dark:text-amber-100 border-amber-500/40";
  if (t.includes("gold")) return "bg-amber-300/20 text-amber-950 dark:text-amber-50 border-amber-400/35";
  if (t === "free" || t.includes("classic"))
    return "bg-sky-500/15 text-sky-900 dark:text-sky-100 border-sky-400/35";
  return "bg-muted text-muted-foreground border-border";
}

function listingLabelEs(listingType: string): string {
  const t = listingType.toLowerCase();
  if (t.includes("gold_pro")) return "Premium (gold_pro)";
  if (t.includes("gold_special")) return "Premium especial";
  if (t === "free") return "Clásica";
  return listingType;
}

function conditionLabelEs(condition: string): string {
  const c = condition.toLowerCase();
  if (c === "new") return "Nuevo";
  if (c === "used") return "Usado";
  if (c === "refurbished") return "Reacondicionado";
  return condition;
}

export default function MeliIntegrationView() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const [meliStatus, setMeliStatus] = useState<MeliStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [importing, setImporting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [syncingCamp, setSyncingCamp] = useState(false);
  const [promoPreview, setPromoPreview] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [loadingImportPreview, setLoadingImportPreview] = useState(false);
  const [lastSuccessfulImportAt, setLastSuccessfulImportAt] = useState<string | null>(null);
  const [syncDirection, setSyncDirection] = useState<"import" | "export">("import");
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [pageSize, setPageSize] = useState<20 | 50 | 100>(20);
  const [page, setPage] = useState(1);
  const [selectedPullIds, setSelectedPullIds] = useState<Set<string>>(new Set());
  const [selectedPushIds, setSelectedPushIds] = useState<Set<string>>(new Set());
  const [rowPullErrors, setRowPullErrors] = useState<Record<string, string>>({});
  const [rowPushErrors, setRowPushErrors] = useState<Record<string, string>>({});
  const [localUnpublished, setLocalUnpublished] = useState<LocalUnpublished[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(false);

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
        "Falta esquema de Mercado Libre en la base (tabla/columnas). Si acabás de desplegar, esperá el pre-deploy de migraciones; si no, ejecutá prisma migrate deploy con la DATABASE_URL de producción y reconectá ML.",
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

  const loadLocalUnpublished = useCallback(async () => {
    setLoadingLocal(true);
    try {
      const r = await fetch("/api/meli/local-unpublished?limit=60");
      const d = await r.json();
      if (r.ok && d.items) setLocalUnpublished(d.items);
      else setLocalUnpublished([]);
    } catch {
      setLocalUnpublished([]);
    } finally {
      setLoadingLocal(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && syncDirection === "export") loadLocalUnpublished();
  }, [status, syncDirection, loadLocalUnpublished]);

  const connectMeli = () => {
    window.location.href = "/api/meli/oauth/authorize";
  };

  const loadImportPreview = async (preserveErrors = false) => {
    setLoadingImportPreview(true);
    try {
      const r = await fetch("/api/meli/import?maxPages=15&sampleSize=500");
      const d = await r.json();
      if (!r.ok) {
        toast.error(d.error || "No se pudo generar la vista previa");
        return;
      }
      setLastSuccessfulImportAt(d.lastSuccessfulImportAt ?? null);
      const preview = d.preview as ImportPreview | null;
      setImportPreview(preview || null);
      if (!preserveErrors) {
        setRowPullErrors({});
        setRowPushErrors({});
      }
      if (preview?.rows?.length) {
        setSelectedPullIds(new Set(preview.rows.map((x) => x.id)));
        setSelectedPushIds(new Set());
        setPage(1);
        toast.success(`Catálogo leído: ${preview.rows.length} publicaciones en esta vista previa.`);
      }
      if (preview?.warnings?.length) {
        toast.message("Avisos al leer Mercado Libre", {
          description: preview.warnings.slice(0, 4).join(" · "),
        });
      }
    } catch {
      toast.error("Error de red al leer vista previa");
    } finally {
      setLoadingImportPreview(false);
    }
  };

  const filteredRows = useMemo(() => {
    let rows = importPreview?.rows ?? [];
    const q = search.trim().toLowerCase();
    if (quickFilter === "active_only") rows = rows.filter((x) => x.status.toLowerCase() === "active");
    if (quickFilter === "updates_only") rows = rows.filter((x) => x.action === "update");
    if (quickFilter === "new_only") rows = rows.filter((x) => x.action === "create");
    if (quickFilter === "price_diff") {
      rows = rows.filter(
        (x) => x.localPrice != null && Math.abs(Number(x.localPrice) - Number(x.meliPrice)) > 0.009
      );
    }
    if (quickFilter === "stock_diff") {
      rows = rows.filter(
        (x) => x.localStock != null && Number(x.localStock) !== Number(x.meliStock)
      );
    }
    if (q) {
      rows = rows.filter(
        (x) =>
          x.title.toLowerCase().includes(q) ||
          x.id.toLowerCase().includes(q) ||
          (x.sellerSku || "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [importPreview, search, quickFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const p = Math.min(page, totalPages);
    const start = (p - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize, totalPages]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const togglePull = (id: string) => {
    setSelectedPullIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const togglePush = (id: string) => {
    setSelectedPushIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectAllFilteredPull = () => {
    setSelectedPullIds(new Set(filteredRows.map((x) => x.id)));
  };

  const clearPullSelection = () => setSelectedPullIds(new Set());

  const headerPullChecked =
    filteredRows.length > 0 && filteredRows.every((x) => selectedPullIds.has(x.id));
  const headerPullIndeterminate =
    filteredRows.some((x) => selectedPullIds.has(x.id)) && !headerPullChecked;

  const runImport = async () => {
    if (!importPreview?.rows?.length) {
      toast.error("Primero cargá la vista previa del catálogo");
      return;
    }
    const ids = [...selectedPullIds];
    if (!ids.length) {
      toast.error("Seleccioná al menos una publicación para importar o actualizar en MADSJEEZ");
      return;
    }
    setImporting(true);
    setRowPullErrors({});
    try {
      const r = await fetch("/api/meli/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPages: 15, requireConfirm: true, confirmed: true, itemIds: ids }),
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
      const errMap: Record<string, string> = {};
      for (const ir of (d.itemResults || []) as Array<{ itemId: string; ok: boolean; error?: string }>) {
        if (!ir.ok && ir.error) errMap[ir.itemId] = ir.error;
      }
      setRowPullErrors(errMap);
      await loadImportPreview(true);
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

  const runPushToMeli = async () => {
    const ids = [...selectedPushIds];
    if (!ids.length) {
      toast.error("Seleccioná publicaciones ya vinculadas para enviar precio y stock a Mercado Libre.");
      return;
    }
    setPushing(true);
    setRowPushErrors({});
    try {
      const r = await fetch("/api/meli/push-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meliItemIds: ids }),
      });
      const d = await r.json();
      if (!r.ok) {
        toast.error(d.error || "Error al enviar a Mercado Libre");
        return;
      }
      const errMap: Record<string, string> = {};
      let okn = 0;
      for (const x of (d.results || []) as Array<{ meliItemId: string; ok: boolean; error?: string }>) {
        if (x.ok) okn++;
        else if (x.error) errMap[x.meliItemId] = x.error;
      }
      setRowPushErrors(errMap);
      toast.success(`Actualización enviada a ML: ${okn} correctas de ${ids.length}.`);
      await loadImportPreview(true);
    } catch {
      toast.error("Error de red");
    } finally {
      setPushing(false);
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

  const exportUpdateRows = useMemo(
    () => (importPreview?.rows ?? []).filter((x) => x.action === "update"),
    [importPreview]
  );

  if (status === "loading" || loadingStatus) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <p className="text-muted-foreground">Iniciá sesión para usar Mercado Libre.</p>;
  }

  return (
    <div className="w-full max-w-7xl space-y-8 mx-auto">
      <div>
        <h2 className="text-xl font-bold text-foreground">Mercado Libre</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Conectá tu cuenta para importar publicaciones a MADSJEEZ o enviar precio y stock de tu catálogo hacia Mercado
          Libre. Podés elegir filas puntuales con las casillas de verificación.
        </p>
        <p className="text-sm mt-2">
          <a
            href="/dashboard#meli-ads-studio"
            className="text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            Mercado Libre Ads — datos en vivo y análisis
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-foreground">Estado de conexión</p>
            <p className="text-xs text-muted-foreground">
              {meliStatus?.connected
                ? `Conectado · usuario ML ${meliStatus.meliUserId}`
                : "Sin conectar"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span aria-hidden>⏱️</span>
              Última importación exitosa a MADSJEEZ:{" "}
              <span className="font-medium text-foreground">{formatRelativeSync(lastSuccessfulImportAt)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={connectMeli}
            className="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 text-sm shadow-sm"
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

      {/* Dirección de sincronización */}
      <div className="flex rounded-xl border border-border bg-muted/40 p-1 gap-1 max-w-xl">
        <button
          type="button"
          onClick={() => setSyncDirection("import")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            syncDirection === "import"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Download className="w-4 h-4" />
          Importar desde ML
        </button>
        <button
          type="button"
          onClick={() => setSyncDirection("export")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            syncDirection === "export"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload className="w-4 h-4" />
          Exportar hacia ML
        </button>
      </div>

      {syncDirection === "import" && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Importar publicaciones (Mercado Libre → MADSJEEZ)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Traé título, fotos, precio y stock desde Mercado Libre. Marcá solo las filas que querés aplicar: ideal para
            pruebas con pocas publicaciones.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!meliStatus?.connected || loadingImportPreview || importing}
              onClick={() => loadImportPreview()}
              className="rounded-lg border border-border bg-background hover:bg-muted px-4 py-2 text-sm font-medium text-foreground disabled:opacity-50"
            >
              {loadingImportPreview ? "Leyendo catálogo..." : "Cargar / refrescar vista previa"}
            </button>
            <button
              type="button"
              disabled={!meliStatus?.connected || importing || !importPreview?.rows?.length}
              onClick={runImport}
              className="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-medium px-4 py-2 text-sm shadow-sm"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Aplicar seleccionadas ({selectedPullIds.size})
            </button>
          </div>

          {importPreview && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
              <p className="text-xs text-foreground font-medium">
                Resumen: {importPreview.uniqueFound} publicaciones únicas escaneadas ({importPreview.totalFound}{" "}
                registros en respuesta paginada de ML).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="rounded bg-card border border-border p-2">
                  <span className="text-muted-foreground">Nuevas en MADSJEEZ</span>
                  <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">{importPreview.toCreate}</div>
                </div>
                <div className="rounded bg-card border border-border p-2">
                  <span className="text-muted-foreground">Actualizar desde ML</span>
                  <div className="text-base font-bold text-primary">{importPreview.toUpdate}</div>
                </div>
                <div className="rounded bg-card border border-border p-2">
                  <span className="text-muted-foreground">Ya vinculadas</span>
                  <div className="text-base font-bold text-foreground">{importPreview.alreadyLinked}</div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Buscar por título, MLA o SKU</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground"
                      placeholder="Ej. bujía, MLA123…"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-56">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Filtro rápido</label>
                  <select
                    value={quickFilter}
                    onChange={(e) => {
                      setQuickFilter(e.target.value as QuickFilter);
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="all">Todas</option>
                    <option value="active_only">Solo activas</option>
                    <option value="updates_only">Solo para actualizar</option>
                    <option value="new_only">Solo nuevas (crear)</option>
                    <option value="price_diff">Precio distinto al local</option>
                    <option value="stock_diff">Stock distinto al local</option>
                  </select>
                </div>
                <div className="w-full sm:w-44">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Por página</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value) as 20 | 50 | 100);
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllFilteredPull}
                  className="rounded-md border border-border px-2 py-1 bg-background hover:bg-muted text-foreground"
                >
                  Seleccionar todas (filtradas)
                </button>
                <button
                  type="button"
                  onClick={clearPullSelection}
                  className="rounded-md border border-border px-2 py-1 bg-background hover:bg-muted text-foreground"
                >
                  Limpiar selección
                </button>
                <span className="text-muted-foreground self-center">
                  Mostrando {pageRows.length} de {filteredRows.length} filtradas · página {safePage} / {totalPages}
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full text-xs">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="text-left px-2 py-2 w-10">
                        <input
                          type="checkbox"
                          checked={headerPullChecked}
                          aria-checked={
                            headerPullIndeterminate ? "mixed" : headerPullChecked ? "true" : "false"
                          }
                          onChange={(e) => {
                            if (e.target.checked) selectAllFilteredPull();
                            else clearPullSelection();
                          }}
                          className="rounded border-border"
                          title="Seleccionar o quitar todas las filas del filtro actual"
                        />
                      </th>
                      <th className="text-left px-2 py-2">Publicación</th>
                      <th className="text-left px-2 py-2">SKU</th>
                      <th className="text-right px-2 py-2">Precio</th>
                      <th className="text-right px-2 py-2">Stock ML</th>
                      <th className="text-right px-2 py-2">Stock local</th>
                      <th className="text-left px-2 py-2">Estado</th>
                      <th className="text-left px-2 py-2">Tipo</th>
                      <th className="text-left px-2 py-2">Acción</th>
                      <th className="text-center px-2 py-2">Estado / error</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {pageRows.map((s) => {
                      const pullErr = rowPullErrors[s.id];
                      const priceDiff =
                        s.localPrice != null && Math.abs(Number(s.localPrice) - Number(s.meliPrice)) > 0.009;
                      const stockDiff =
                        s.localStock != null && Number(s.localStock) !== Number(s.meliStock);
                      return (
                        <tr key={s.id} className={pullErr ? "bg-destructive/10" : undefined}>
                          <td className="px-2 py-2 align-middle">
                            <input
                              type="checkbox"
                              checked={selectedPullIds.has(s.id)}
                              onChange={() => togglePull(s.id)}
                              className="rounded border-border"
                            />
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <div className="flex items-center gap-2 max-w-[320px]">
                              {s.thumbnailUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={s.thumbnailUrl}
                                  alt=""
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded-md object-cover border border-border shrink-0 bg-muted"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-muted border border-border shrink-0" />
                              )}
                              <span className="truncate text-foreground font-medium" title={s.title}>
                                {s.title}
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 pl-12">{s.id}</div>
                          </td>
                          <td className="px-2 py-2 align-middle text-muted-foreground whitespace-nowrap">
                            {s.sellerSku || "—"}
                          </td>
                          <td className="px-2 py-2 align-middle text-right whitespace-nowrap">
                            {s.localPrice != null && priceDiff ? (
                              <span className="text-foreground">
                                <span className="line-through opacity-60">{fmtMoney(Number(s.localPrice))}</span>
                                <span className="mx-1">→</span>
                                <span className="font-semibold">{fmtMoney(s.meliPrice)}</span>
                              </span>
                            ) : (
                              <span className="font-medium">{fmtMoney(s.meliPrice)}</span>
                            )}
                            <div className="text-[10px] text-muted-foreground">se aplicará precio de ML</div>
                          </td>
                          <td className="px-2 py-2 align-middle text-right">{s.meliStock}</td>
                          <td className="px-2 py-2 align-middle text-right">
                            {s.localStock != null ? (
                              stockDiff ? (
                                <span>
                                  <span className="line-through opacity-60">{s.localStock}</span>
                                  <span className="mx-1">→</span>
                                  <span className="font-semibold">{s.meliStock}</span>
                                </span>
                              ) : (
                                s.localStock
                              )
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusBadgeClasses(s.status)}`}>
                              {statusLabelEs(s.status)}
                            </span>
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold ${listingBadgeClasses(s.listingType)}`}>
                              {listingLabelEs(s.listingType)}
                            </span>
                          </td>
                          <td className={`px-2 py-2 align-middle font-semibold ${s.action === "create" ? "text-emerald-700 dark:text-emerald-400" : "text-primary"}`}>
                            {s.action === "create" ? "Crear" : "Actualizar"}
                          </td>
                          <td className="px-2 py-2 align-middle text-center">
                            {pullErr ? (
                              <span className="inline-flex items-center justify-center text-destructive" title={pullErr}>
                                <AlertTriangle className="w-4 h-4" />
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Condición ML: se guarda como {conditionLabelEs("new")} / usado / reacondicionado según corresponda.
                Columna precio: al importar, los valores de Mercado Libre reemplazan el catálogo local para esa
                publicación.
              </p>
            </div>
          )}
        </div>
      )}

      {syncDirection === "export" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Catálogo solo en MADSJEEZ (sin ID Mercado Libre)
            </h3>
            <p className="text-sm text-muted-foreground">
              Para dar de alta una publicación nueva en Mercado Libre con categoría, tipo clásica/premium y fotos, usá el
              flujo de publicaciones del panel. Acá listamos artículos locales que aún no están vinculados a un MLA.
            </p>
            <a
              href="/dashboard/publicaciones"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Ir a Publicaciones <ExternalLink className="w-3 h-3" />
            </a>
            {loadingLocal ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : localUnpublished.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay productos locales sin vínculo MLA recientes.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full text-xs">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="text-left px-2 py-2">Producto</th>
                      <th className="text-left px-2 py-2">SKU</th>
                      <th className="text-right px-2 py-2">Precio local</th>
                      <th className="text-right px-2 py-2">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {localUnpublished.map((p) => (
                      <tr key={p.id}>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            {p.thumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.thumbnailUrl}
                                alt=""
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-md object-cover border border-border bg-muted"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-muted border border-border" />
                            )}
                            <span className="text-foreground font-medium max-w-[280px] truncate">{p.title}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">{p.sku || "—"}</td>
                        <td className="px-2 py-2 text-right">{fmtMoney(p.price)}</td>
                        <td className="px-2 py-2 text-right">{p.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-foreground">Enviar precio y stock locales → Mercado Libre</h3>
            <p className="text-sm text-muted-foreground">
              Solo aplica a publicaciones que ya existen en ML y están vinculadas en tu cuenta. Mercado Libre puede
              rechazar cambios si la publicación no admite edición o falta un requisito; el error se muestra por fila.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!meliStatus?.connected || loadingImportPreview}
                onClick={() => loadImportPreview()}
                className="rounded-lg border border-border bg-background hover:bg-muted px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {loadingImportPreview ? "Leyendo..." : "Refrescar lista desde ML"}
              </button>
              <button
                type="button"
                disabled={!meliStatus?.connected || pushing || selectedPushIds.size === 0}
                onClick={runPushToMeli}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Enviar seleccionadas a ML ({selectedPushIds.size})
              </button>
            </div>

            {!exportUpdateRows.length ? (
              <p className="text-sm text-muted-foreground">
                Cargá la vista previa en la pestaña de importación o tocá “Refrescar lista desde ML” para comparar y
                elegir publicaciones vinculadas.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full text-xs">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="text-left px-2 py-2 w-10">
                        <input
                          type="checkbox"
                          checked={
                            exportUpdateRows.length > 0 &&
                            exportUpdateRows.every((x) => selectedPushIds.has(x.id))
                          }
                          aria-checked={
                            exportUpdateRows.length > 0 &&
                            exportUpdateRows.some((x) => selectedPushIds.has(x.id)) &&
                            !exportUpdateRows.every((x) => selectedPushIds.has(x.id))
                              ? "mixed"
                              : exportUpdateRows.every((x) => selectedPushIds.has(x.id))
                                ? "true"
                                : "false"
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPushIds(new Set(exportUpdateRows.map((x) => x.id)));
                            } else {
                              setSelectedPushIds(new Set());
                            }
                          }}
                        />
                      </th>
                      <th className="text-left px-2 py-2">Publicación</th>
                      <th className="text-right px-2 py-2">Precio local → ML actual</th>
                      <th className="text-right px-2 py-2">Stock local → ML actual</th>
                      <th className="text-center px-2 py-2">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {exportUpdateRows.slice(0, 80).map((s) => {
                      const pushErr = rowPushErrors[s.id];
                      return (
                        <tr key={s.id} className={pushErr ? "bg-destructive/10" : undefined}>
                          <td className="px-2 py-2">
                            <input
                              type="checkbox"
                              checked={selectedPushIds.has(s.id)}
                              onChange={() => togglePush(s.id)}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2 max-w-[300px]">
                              {s.thumbnailUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={s.thumbnailUrl}
                                  alt=""
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded-md object-cover border border-border bg-muted shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-muted border border-border shrink-0" />
                              )}
                              <span className="truncate font-medium text-foreground">{s.title}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-right whitespace-nowrap">
                            <span className="font-semibold">{fmtMoney(s.localPrice ?? 0)}</span>
                            <span className="mx-1 text-muted-foreground">→</span>
                            <span className="opacity-70">{fmtMoney(s.meliPrice)}</span>
                          </td>
                          <td className="px-2 py-2 text-right">
                            <span className="font-semibold">{s.localStock ?? "—"}</span>
                            <span className="mx-1 text-muted-foreground">→</span>
                            <span className="opacity-70">{s.meliStock}</span>
                          </td>
                          <td className="px-2 py-2 text-center">
                            {pushErr ? (
                              <span className="text-destructive inline-flex justify-center" title={pushErr}>
                                <AlertTriangle className="w-4 h-4" />
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {exportUpdateRows.length > 80 && (
              <p className="text-xs text-muted-foreground">
                Mostrando las primeras 80 publicaciones vinculadas. Afiná la selección con la vista completa en la pestaña
                Importar (filtros y paginación) si necesitás más.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Campañas con datos de ML</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Lee las promociones que Mercado Libre devuelve para tu cuenta y creá o actualizá registros en{" "}
          <strong>Campañas</strong> locales (fechas, tipo y descuento estimado). Podés inspeccionar el JSON crudo antes
          de sincronizar.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!meliStatus?.connected}
            onClick={loadPromotionsPreview}
            className="rounded-lg border border-border bg-background hover:bg-muted px-4 py-2 text-sm font-medium disabled:opacity-50"
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
