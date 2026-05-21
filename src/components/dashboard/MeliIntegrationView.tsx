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
  Check,
} from "lucide-react";
import { toast } from "sonner";

type MeliAccountRow = {
  id: string;
  meliUserId: string;
  nickname: string | null;
  label: string | null;
  isPrimary: boolean;
  expiresAt: string;
  lastCatalogImportAt: string | null;
  linkedProducts: number;
};

type MeliStatus = {
  connected: boolean;
  meliUserId: string | null;
  expiresAt: string | null;
  accountId?: string | null;
  accounts?: MeliAccountRow[];
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
  action: "create" | "update" | "skip";
  skipReason?: string;
  meliCategoryId?: string | null;
  hasVariations?: boolean;
  isCatalogListing?: boolean;
};

type ImportPreview = {
  totalFound: number;
  uniqueFound: number;
  alreadyLinked: number;
  toCreate: number;
  toUpdate: number;
  skippedDuplicates: number;
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

type QuickFilter =
  | "all"
  | "standard_only"
  | "active_only"
  | "updates_only"
  | "new_only"
  | "skip_only"
  | "price_diff"
  | "stock_diff";

type MeliListingKind = "standard" | "catalog" | "all";

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

const meliPanel =
  "relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(165deg,rgba(15,23,42,0.94)_0%,rgba(17,24,39,0.9)_50%,rgba(12,18,32,0.96)_100%)] shadow-[0_24px_56px_rgba(2,6,23,0.4)] backdrop-blur-xl";
const meliGlowViolet =
  "border-violet-500/35 shadow-[0_0_56px_rgba(139,92,246,0.22),inset_0_1px_0_rgba(255,255,255,0.06)]";
const meliGlowCyan =
  "border-cyan-400/35 shadow-[0_0_56px_rgba(34,211,238,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]";
const meliBtnGradient =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_32px_rgba(139,92,246,0.4)] transition-all hover:brightness-110 hover:shadow-[0_14px_40px_rgba(34,211,238,0.35)] disabled:opacity-50 disabled:pointer-events-none";
const meliBtnTeal =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_32px_rgba(34,211,238,0.38)] transition-all hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none";
const meliBtnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all hover:border-white/25 hover:bg-white/10 disabled:opacity-50";
const meliInput =
  "w-full rounded-xl border border-white/12 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/25";
const meliSubCard =
  "rounded-xl border border-white/10 bg-slate-950/45 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";
const meliSelect =
  "w-full rounded-lg border border-white/12 bg-slate-950/55 px-3 py-2 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-violet-400/45 focus:outline-none focus:ring-2 focus:ring-violet-500/20";
const meliPagerBtn =
  "rounded-md border border-white/12 bg-slate-950/55 px-2 py-1 text-slate-100 transition-colors hover:bg-slate-900/80 disabled:opacity-40";
const meliTableShell = "overflow-x-auto rounded-lg border border-white/10 bg-slate-950/35";
const meliTableHead = "bg-slate-950/70 text-slate-400";
const meliTableBody = "divide-y divide-white/10 bg-slate-950/30";

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
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [listingKind, setListingKind] = useState<MeliListingKind>("standard");

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const r = await fetch("/api/meli/status");
      const d = (await r.json()) as MeliStatus;
      if (r.ok) {
        setMeliStatus(d);
        const primary = d.accounts?.find((a) => a.isPrimary) || d.accounts?.[0];
        setSelectedAccountId((prev) => {
          if (prev && d.accounts?.some((a) => a.id === prev)) return prev;
          return d.accountId || primary?.id || null;
        });
      } else {
        setMeliStatus({ connected: false, meliUserId: null, expiresAt: null });
        setSelectedAccountId(null);
      }
    } catch {
      setMeliStatus({ connected: false, meliUserId: null, expiresAt: null });
      setSelectedAccountId(null);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      const t = setTimeout(() => {
        void loadStatus();
      }, 0);
      return () => clearTimeout(t);
    }
    return;
  }, [status, loadStatus]);

  useEffect(() => {
    const err = searchParams.get("error");
    const ok = searchParams.get("connected");
    const cleanQuery = () =>
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
    const errorMessages: Record<string, string> = {
      meli_db_schema:
        "Falta esquema de Mercado Libre en la base (tabla/columnas). Si acabás de desplegar, esperá el pre-deploy de migraciones; si no, ejecutá prisma migrate deploy con la DATABASE_URL de producción y reconectá ML.",
      invalid_state: "La sesión de OAuth caducó o es inválida. Probá “Conectar Mercado Libre” de nuevo.",
      meli_not_configured: "Faltan variables MELI_APP_ID / MELI_CLIENT_SECRET / MELI_REDIRECT_URI en el servidor.",
      users_me_failed: "Mercado Libre no devolvió tu usuario. Reintentá o revisá permisos de la app.",
      no_meli_user: "No se pudo leer tu ID de usuario en Mercado Libre.",
      oauth_error: "Error al guardar la conexión. Revisá logs del servidor.",
    };

    if (ok) {
      toast.success("Mercado Libre conectado correctamente.");
      cleanQuery();
      return;
    }

    if (!err) return;

    if (status === "loading") return;

    if (status !== "authenticated") return;

    const decoded = decodeURIComponent(err).replace(/\s+/g, " ").trim();
    const isSchemaErr = decoded === "meli_db_schema" || err === "meli_db_schema";

    if (isSchemaErr && meliStatus?.connected) {
      cleanQuery();
      return;
    }

    void (async () => {
      if (isSchemaErr) {
        try {
          const r = await fetch("/api/meli/status", { credentials: "include" });
          const d = (await r.json()) as { connected?: boolean };
          if (r.ok && d.connected) {
            cleanQuery();
            return;
          }
        } catch {
          /* seguir y mostrar toast */
        }
      }
      toast.error(errorMessages[decoded] || errorMessages[err] || decoded.slice(0, 280));
      cleanQuery();
    })();
  }, [searchParams, status, meliStatus]);

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
    if (status === "authenticated" && syncDirection === "export") {
      const t = setTimeout(() => {
        void loadLocalUnpublished();
      }, 0);
      return () => clearTimeout(t);
    }
    return;
  }, [status, syncDirection, loadLocalUnpublished]);

  const connectMeli = () => {
    window.location.href = "/api/meli/oauth/authorize";
  };

  const loadImportPreview = async (preserveErrors = false) => {
    if (!selectedAccountId) {
      toast.error("Seleccioná una cuenta de Mercado Libre");
      return;
    }
    setLoadingImportPreview(true);
    try {
      const qs = new URLSearchParams({
        maxPages: "50",
        sampleSize: "2000",
        accountId: selectedAccountId,
        listingKind,
      });
      const r = await fetch(`/api/meli/import?${qs.toString()}`);
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
        setSelectedPullIds(new Set(preview.rows.filter((x) => x.action !== "skip").map((x) => x.id)));
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
    if (quickFilter === "standard_only") rows = rows.filter((x) => !x.isCatalogListing);
    if (quickFilter === "active_only") rows = rows.filter((x) => x.status.toLowerCase() === "active");
    if (quickFilter === "updates_only") rows = rows.filter((x) => x.action === "update");
    if (quickFilter === "new_only") rows = rows.filter((x) => x.action === "create");
    if (quickFilter === "skip_only") rows = rows.filter((x) => x.action === "skip");
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
    setSelectedPullIds(new Set(filteredRows.filter((x) => x.action !== "skip").map((x) => x.id)));
  };

  const clearPullSelection = () => setSelectedPullIds(new Set());

  const headerPullChecked =
    filteredRows.length > 0 && filteredRows.every((x) => selectedPullIds.has(x.id));
  const headerPullIndeterminate =
    filteredRows.some((x) => selectedPullIds.has(x.id)) && !headerPullChecked;

  const runImportAllStandard = async () => {
    if (!selectedAccountId) {
      toast.error("Seleccioná una cuenta de Mercado Libre");
      return;
    }
    if (
      !window.confirm(
        "¿Importar automáticamente TODAS las publicaciones estándar de esta cuenta ML? (sin catálogo ML). Puede tardar varios minutos."
      )
    ) {
      return;
    }
    setImporting(true);
    setRowPullErrors({});
    try {
      const r = await fetch("/api/meli/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxPages: 50,
          accountId: selectedAccountId,
          persistImages: true,
          listingKind: "standard",
          importAll: true,
          confirmed: true,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        toast.error(d.error || "Error al importar");
        return;
      }
      const skippedN = Number(d.skipped) || 0;
      toast.success(
        `Importación automática: ${d.imported} nuevas, ${d.updated} actualizadas` +
          (skippedN > 0 ? `, ${skippedN} omitidas` : "")
      );
      await loadImportPreview(true);
      await loadStatus();
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
        body: JSON.stringify({
          maxPages: 50,
          accountId: selectedAccountId,
          persistImages: true,
          listingKind,
          requireConfirm: true,
          confirmed: true,
          itemIds: ids,
        }),
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
      const skippedN = Number(d.skipped) || 0;
      toast.success(
        `Importadas: ${d.imported}, actualizadas: ${d.updated}` +
          (skippedN > 0 ? `, omitidas (duplicado): ${skippedN}` : "")
      );
      const errMap: Record<string, string> = {};
      for (const ir of (d.itemResults || []) as Array<{ itemId: string; ok: boolean; error?: string }>) {
        if (!ir.ok && ir.error) errMap[ir.itemId] = ir.error;
      }
      setRowPullErrors(errMap);
      await loadImportPreview(true);
      await loadStatus();
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
        body: JSON.stringify({ meliItemIds: ids, accountId: selectedAccountId }),
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
    return <p className="text-slate-400">Iniciá sesión para usar Mercado Libre.</p>;
  }

  const activeAccount = meliStatus?.accounts?.find((a) => a.id === selectedAccountId);
  const linkedCount = activeAccount?.linkedProducts ?? 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.09),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(3,7,18,0.98)_100%)] p-4 pb-8 shadow-[0_32px_80px_rgba(2,6,23,0.38)] md:p-6">
      <section className={`${meliPanel} ${meliGlowViolet} p-6 md:p-8`}>
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-400/40 bg-[linear-gradient(145deg,#ffe600_0%,#f5c400_100%)] text-lg font-black text-slate-900 shadow-[0_8px_24px_rgba(245,196,0,0.35)]">
            ML
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              <span className="bg-gradient-to-r from-white via-violet-100 to-cyan-200 bg-clip-text text-transparent">
                Mercado Libre
              </span>
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
              Conectá una o varias cuentas ML. Importá publicaciones completas (categorías, atributos, variaciones e
              imágenes en nuestra base) o enviá cambios a ML. El stock se sincroniza automáticamente; Mercado Libre es la
              referencia principal. No se duplican título ni SKU en tu catálogo.
            </p>
            <a
              href="/dashboard#meli-ads-studio"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-cyan-400 hover:text-cyan-300"
            >
              Mercado Libre Ads · datos en vivo y análisis
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </a>
          </div>
        </div>
      </section>

      <section className={`${meliPanel} ${meliGlowViolet} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-300/90">Estado de conexión</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {meliStatus?.connected ? (
                <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  {meliStatus.accounts?.length ?? 1} cuenta(s) conectada(s)
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-slate-500/40 bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-400">
                  Sin conectar
                </span>
              )}
            </div>
            {meliStatus?.accounts && meliStatus.accounts.length > 0 && (
              <div className="mt-4 max-w-md space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Cuenta activa
                </label>
                <select
                  value={selectedAccountId || ""}
                  onChange={(e) => {
                    setSelectedAccountId(e.target.value || null);
                    setImportPreview(null);
                    setSelectedPullIds(new Set());
                  }}
                  className={meliInput}
                >
                  {meliStatus.accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label || a.nickname || `ML ${a.meliUserId}`}
                      {a.isPrimary ? " · principal" : ""} ({a.linkedProducts} vinculadas)
                    </option>
                  ))}
                </select>
              </div>
            )}
            <p className="mt-3 text-xs text-slate-400">
              Última importación exitosa:{" "}
              <span className="font-medium text-slate-200">{formatRelativeSync(lastSuccessfulImportAt)}</span>
            </p>
          </div>
          <button type="button" onClick={connectMeli} className={meliBtnGradient}>
            <Link2 className="h-4 w-4" />
            {meliStatus?.connected ? "Conectar otra cuenta ML" : "Conectar Mercado Libre"}
          </button>
        </div>
        <a
          href="https://developers.mercadolibre.com.ar/es_ar/autenticacion-y-autorizacion"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-xs text-cyan-400/90 hover:text-cyan-300"
        >
          Documentación OAuth ML <ExternalLink className="h-3 w-3" />
        </a>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setSyncDirection("import")}
          className={`group relative flex items-center gap-4 rounded-2xl border p-5 text-left transition-all ${
            syncDirection === "import"
              ? `${meliPanel} ${meliGlowViolet} ring-1 ring-violet-400/40`
              : "border-white/10 bg-slate-900/60 hover:border-violet-500/30 hover:bg-slate-900/80"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-300 shadow-[0_0_24px_rgba(139,92,246,0.25)]">
            <Download className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white">Importar desde ML</p>
            <p className="text-xs text-slate-400">Catálogo ML {"→"} MADSJEEZ</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-300" />
        </button>
        <button
          type="button"
          onClick={() => setSyncDirection("export")}
          className={`group relative flex items-center gap-4 rounded-2xl border p-5 text-left transition-all ${
            syncDirection === "export"
              ? `${meliPanel} ${meliGlowCyan} ring-1 ring-cyan-400/40`
              : "border-white/10 bg-slate-900/60 hover:border-cyan-500/30 hover:bg-slate-900/80"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.22)]">
            <Upload className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white">Exportar hacia ML</p>
            <p className="text-xs text-slate-400">Precio y stock {"→"} Mercado Libre</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-300" />
        </button>
      </div>

      {syncDirection === "import" && (
        <section className={`${meliPanel} ${meliGlowViolet} p-6 md:p-8 space-y-5`}>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-violet-300">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Importar publicaciones (Mercado Libre {"→"} MADSJEEZ)
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Traé título, fotos, precio y stock desde Mercado Libre. Por defecto solo publicaciones{" "}
                <strong className="text-slate-200">estándar</strong> (sin catálogo ML).
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <span>Tipo en ML:</span>
              <select
                value={listingKind}
                onChange={(e) => setListingKind(e.target.value as MeliListingKind)}
                className={meliSelect}
              >
                <option value="standard">Solo estándar (sin catálogo)</option>
                <option value="catalog">Solo catálogo ML</option>
                <option value="all">Todas</option>
              </select>
            </label>
            <button
              type="button"
              disabled={!meliStatus?.connected || loadingImportPreview || importing}
              onClick={() => loadImportPreview()}
              className={meliBtnGhost}
            >
              {loadingImportPreview ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {loadingImportPreview ? "Leyendo catálogo..." : "Cargar / refrescar vista previa"}
            </button>
            <button
              type="button"
              disabled={!meliStatus?.connected || importing}
              onClick={runImportAllStandard}
              className={meliBtnGradient}
              title="Importa todas las publicaciones estándar de la cuenta activa sin seleccionar fila por fila"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Importar todas (solo estándar)
            </button>
            <button
              type="button"
              disabled={!meliStatus?.connected || importing || !importPreview?.rows?.length}
              onClick={runImport}
              className={meliBtnTeal}
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Aplicar seleccionadas ({selectedPullIds.size})
            </button>
          </div>

          {importPreview && (
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="text-xs font-medium text-slate-200">
                Resumen: {importPreview.uniqueFound} publicaciones únicas escaneadas ({importPreview.totalFound}{" "}
                registros en respuesta paginada de ML).
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className={meliSubCard}>
                  <span className="text-slate-400">Nuevas en MADSJEEZ</span>
                  <div className="text-base font-bold text-emerald-400">{importPreview.toCreate}</div>
                </div>
                <div className={meliSubCard}>
                  <span className="text-slate-400">Actualizar desde ML</span>
                  <div className="text-base font-bold text-cyan-300">{importPreview.toUpdate}</div>
                </div>
                <div className={meliSubCard}>
                  <span className="text-slate-400">Omitidas (duplicado)</span>
                  <div className="text-base font-bold text-amber-300">
                    {importPreview.skippedDuplicates ?? 0}
                  </div>
                </div>
                <div className={meliSubCard}>
                  <span className="text-slate-400">Ya vinculadas</span>
                  <div className="text-base font-bold text-white">{importPreview.alreadyLinked}</div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1 block text-xs font-medium text-slate-400">Buscar por título, MLA o SKU</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className={`${meliInput} pl-9`}
                      placeholder="Ej. bujía, MLA123..."
                    />
                  </div>
                </div>
                <div className="w-full sm:w-56">
                  <label className="mb-1 block text-xs font-medium text-slate-400">Filtro rápido</label>
                  <select
                    value={quickFilter}
                    onChange={(e) => {
                      setQuickFilter(e.target.value as QuickFilter);
                      setPage(1);
                    }}
                    className={meliSelect}
                  >
                    <option value="all">Todas</option>
                    <option value="standard_only">Solo estándar (sin catálogo)</option>
                    <option value="active_only">Solo activas</option>
                    <option value="updates_only">Solo para actualizar</option>
                    <option value="new_only">Solo nuevas (crear)</option>
                    <option value="skip_only">Omitidas (duplicado título/SKU)</option>
                    <option value="price_diff">Precio distinto al local</option>
                    <option value="stock_diff">Stock distinto al local</option>
                  </select>
                </div>
                <div className="w-full sm:w-44">
                  <label className="mb-1 block text-xs font-medium text-slate-400">Por página</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value) as 20 | 50 | 100);
                      setPage(1);
                    }}
                    className={meliSelect}
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
                  className={meliPagerBtn}
                >
                  Seleccionar todas (filtradas)
                </button>
                <button
                  type="button"
                  onClick={clearPullSelection}
                  className={meliPagerBtn}
                >
                  Limpiar selección
                </button>
                <span className="self-center text-slate-400">
                  Mostrando {pageRows.length} de {filteredRows.length} filtradas · página {safePage} / {totalPages}
                </span>
              </div>

              <div className={meliTableShell}>
                <table className="min-w-full text-xs">
                  <thead className={meliTableHead}>
                    <tr>
                      <th className="text-left px-2 py-2 w-10">
                        <input
                          className="rounded border-border bg-slate-950/70 text-cyan-300"
                          checked={headerPullChecked}
                          aria-checked={
                            headerPullIndeterminate ? "mixed" : headerPullChecked ? "true" : "false"
                          }
                          onChange={(e) => {
                            if (e.target.checked) selectAllFilteredPull();
                            else clearPullSelection();
                          }}
                          title="Seleccionar o quitar todas las filas del filtro actual"
                        />
                      </th>
                      <th className="text-left px-2 py-2">Publicación</th>
                      <th className="text-left px-2 py-2">SKU</th>
                      <th className="text-right px-2 py-2">Precio</th>
                      <th className="text-right px-2 py-2">Stock local</th>
                      <th className="text-left px-2 py-2">Estado</th>
                      <th className="text-left px-2 py-2">Tipo</th>
                      <th className="text-left px-2 py-2">Acción</th>
                      <th className="text-center px-2 py-2">Estado / error</th>
                    </tr>
                  </thead>
                  <tbody className={meliTableBody}>
                    {pageRows.map((s) => {
                      const pullErr = rowPullErrors[s.id];
                      const priceDiff =
                        s.localPrice != null && Math.abs(Number(s.localPrice) - Number(s.meliPrice)) > 0.009;
                      const stockDiff =
                        s.localStock != null && Number(s.localStock) !== Number(s.meliStock);
                      return (
                        <tr
                          key={s.id}
                          className={
                            pullErr
                              ? "bg-destructive/10"
                              : s.action === "skip"
                                ? "bg-amber-500/5 opacity-75"
                                : undefined
                          }
                        >
                          <td className="px-2 py-2 align-middle">
                            <input
                              type="checkbox"
                              checked={selectedPullIds.has(s.id)}
                              disabled={s.action === "skip"}
                              onChange={() => togglePull(s.id)}
                              className="rounded border-border disabled:opacity-40"
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
                            <div className="text-[10px] text-muted-foreground">Se aplicará precio de ML</div>
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
                          <td
                            className={`px-2 py-2 align-middle font-semibold ${
                              s.action === "create"
                                ? "text-emerald-700 dark:text-emerald-400"
                                : s.action === "skip"
                                  ? "text-amber-700 dark:text-amber-400"
                                  : "text-primary"
                            }`}
                          >
                            {s.action === "create"
                              ? "Crear"
                              : s.action === "skip"
                                ? "Omitir"
                                : "Actualizar"}
                          </td>
                          <td className="px-2 py-2 align-middle text-center">
                            {pullErr || s.skipReason ? (
                              <span
                                className={`inline-flex items-center justify-center ${pullErr ? "text-destructive" : "text-amber-600"}`}
                                title={pullErr || s.skipReason}
                              >
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
        </section>
      )}

      {syncDirection === "export" && (
        <div className="space-y-6">
          <section className={`${meliPanel} ${meliGlowCyan} space-y-4 p-6`}>
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <Upload className="h-5 w-5 text-cyan-400" />
              Catálogo solo en MADSJEEZ (sin ID Mercado Libre)
            </h3>
            <p className="text-sm text-slate-400">
              Para dar de alta una publicación nueva en Mercado Libre con categoría, tipo clásica/premium y fotos, usá el
              flujo de publicaciones del panel. Acá listamos artículos locales que aún no están vinculados a un MLA.
            </p>
            <a
              href="/dashboard/publicaciones"
              className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200"
            >
              Ir a Publicaciones <ExternalLink className="h-3 w-3" />
            </a>
            {loadingLocal ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
              </div>
            ) : localUnpublished.length === 0 ? (
              <p className="text-sm text-slate-400">No hay productos locales sin vínculo MLA recientes.</p>
            ) : (
              <div className={meliTableShell}>
                <table className="min-w-full text-xs">
                  <thead className={meliTableHead}>
                    <tr>
                      <th className="px-2 py-2 text-left">Producto</th>
                      <th className="px-2 py-2 text-left">SKU</th>
                      <th className="px-2 py-2 text-right">Precio local</th>
                      <th className="px-2 py-2 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className={meliTableBody}>
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
                                className="h-10 w-10 rounded-md border border-white/10 bg-slate-900/70 object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-md border border-white/10 bg-slate-900/70" />
                            )}
                            <span className="max-w-[280px] truncate font-medium text-white">{p.title}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-slate-400">{p.sku || "---"}</td>
                        <td className="px-2 py-2 text-right text-slate-100">{fmtMoney(p.price)}</td>
                        <td className="px-2 py-2 text-right text-slate-100">{p.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={`${meliPanel} ${meliGlowCyan} space-y-4 p-6`}>
            <h3 className="font-semibold text-white">Enviar precio y stock locales a Mercado Libre</h3>
            <p className="text-sm text-slate-400">
              Solo aplica a publicaciones que ya existen en ML y están vinculadas en tu cuenta. Mercado Libre puede
              rechazar cambios si la publicación no admite edición o falta un requisito; el error se muestra por fila.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!meliStatus?.connected || loadingImportPreview}
                onClick={() => loadImportPreview()}
                className={meliBtnGhost}
              >
                {loadingImportPreview ? "Leyendo..." : "Refrescar lista desde ML"}
              </button>
              <button
                type="button"
                disabled={!meliStatus?.connected || pushing || selectedPushIds.size === 0}
                onClick={runPushToMeli}
                className={meliBtnTeal}
              >
                {pushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Enviar seleccionadas a ML ({selectedPushIds.size})
              </button>
            </div>

            {!exportUpdateRows.length ? (
              <p className="text-sm text-slate-400">
                Cargá la vista previa en la pestaña de importación o tocá “Refrescar lista desde ML” para comparar y
                elegir publicaciones vinculadas.
              </p>
            ) : (
              <div className={meliTableShell}>
                <table className="min-w-full text-xs">
                  <thead className={meliTableHead}>
                    <tr>
                      <th className="w-10 px-2 py-2 text-left">
                        <input
                          type="checkbox"
                          className="rounded border-white/15 bg-slate-950/70 text-cyan-300"
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
                      <th className="px-2 py-2 text-left">Publicación</th>
                      <th className="px-2 py-2 text-right">Precio local - ML actual</th>
                      <th className="px-2 py-2 text-right">Stock local - ML actual</th>
                      <th className="px-2 py-2 text-center">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className={meliTableBody}>
                    {exportUpdateRows.slice(0, 80).map((s) => {
                      const pushErr = rowPushErrors[s.id];
                      return (
                        <tr key={s.id} className={pushErr ? "bg-red-500/10" : undefined}>
                          <td className="px-2 py-2">
                            <input
                              type="checkbox"
                              className="rounded border-white/15 bg-slate-950/70 text-cyan-300"
                              checked={selectedPushIds.has(s.id)}
                              onChange={() => togglePush(s.id)}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex max-w-[300px] items-center gap-2">
                              {s.thumbnailUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={s.thumbnailUrl}
                                  alt=""
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 shrink-0 rounded-md border border-white/10 bg-slate-900/70 object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 shrink-0 rounded-md border border-white/10 bg-slate-900/70" />
                              )}
                              <span className="truncate font-medium text-white">{s.title}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-right">
                            <span className="font-semibold text-slate-100">{fmtMoney(s.localPrice ?? 0)}</span>
                            <span className="mx-1 text-slate-500">-&gt;</span>
                            <span className="text-slate-400">{fmtMoney(s.meliPrice)}</span>
                          </td>
                          <td className="px-2 py-2 text-right">
                            <span className="font-semibold text-slate-100">{s.localStock ?? "---"}</span>
                            <span className="mx-1 text-slate-500">-&gt;</span>
                            <span className="text-slate-400">{s.meliStock}</span>
                          </td>
                          <td className="px-2 py-2 text-center">
                            {pushErr ? (
                              <span className="inline-flex justify-center text-red-300" title={pushErr}>
                                <AlertTriangle className="h-4 w-4" />
                              </span>
                            ) : (
                              <span className="text-slate-500">---</span>
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
              <p className="text-xs text-slate-500">
                Mostrando las primeras 80 publicaciones vinculadas. Afiná la selección con la vista completa en la pestaña
                Importar si necesitás más.
              </p>
            )}
          </section>
        </div>
      )}

      <section className={`${meliPanel} space-y-4 p-6`}>
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-violet-400" />
          <h3 className="font-semibold text-white">Campañas con datos de ML</h3>
        </div>
        <p className="text-sm text-slate-400">
          Lee las promociones que Mercado Libre devuelve para tu cuenta y creá o actualizá registros en{" "}
          <strong className="text-slate-200">Campañas</strong> locales (fechas, tipo y descuento estimado).
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!meliStatus?.connected}
            onClick={loadPromotionsPreview}
            className={meliBtnGhost}
          >
            Ver JSON promociones ML
          </button>
          <button
            type="button"
            disabled={!meliStatus?.connected || syncingCamp}
            onClick={syncCampaigns}
            className={`${meliBtnGradient} w-full sm:w-auto`}
          >
            {syncingCamp ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sincronizar con campañas MADSJEEZ
          </button>
        </div>
        {promoPreview && (
          <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-950/90 p-4 text-[11px] text-slate-100">
            {promoPreview}
          </pre>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Publicaciones detectadas",
            value: importPreview ? String(importPreview.uniqueFound) : "Sin vista previa",
            sub: importPreview ? "En catálogo ML escaneado" : "Cargá vista previa",
          },
          {
            label: "Sincronizadas",
            value: String(linkedCount),
            sub: "Vinculadas a cuenta activa",
          },
          {
            label: "Campañas activas",
            value: promoPreview ? "1" : "0",
            sub: promoPreview ? "Promociones cargadas desde ML" : "Sin promociones sincronizadas",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-white/10 bg-slate-950/45 p-4 shadow-[0_16px_30px_rgba(2,6,23,0.22),inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{m.label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{m.value}</p>
            <p className="mt-0.5 text-xs text-slate-400">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

