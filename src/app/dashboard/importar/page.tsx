"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ImageIcon,
  Package,
  ArrowRight,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type NormalizedRow = {
  externalId: string | null;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  sku: string | null;
  condition: string;
  freeShipping: boolean;
  isActive: boolean;
  category: string | null;
  images: string[];
};

type ParseResult = {
  platform: string;
  platformName: string;
  detected: boolean;
  totalRows: number;
  validProducts: number;
  stats: { withImages: number; withPrice: number; withStock: number };
  rows: NormalizedRow[];
};

const PLATFORMS = [
  { id: "tiendanube", name: "Tienda Nube", color: "#2c6ecb" },
  { id: "shopify", name: "Shopify", color: "#95bf47" },
  { id: "empretienda", name: "Empretienda", color: "#7c3aed" },
  { id: "woocommerce", name: "WooCommerce", color: "#96588a" },
  { id: "generic", name: "CSV genérico", color: "#475569" },
];

function money(n: number) {
  return `$${Number(n || 0).toLocaleString("es-AR")}`;
}

export default function ImportarPage() {
  const [stage, setStage] = useState<"upload" | "preview" | "done">("upload");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [forcedPlatform, setForcedPlatform] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [doneStats, setDoneStats] = useState<{ imported: number; skipped: number; imagesAdded: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastFileRef = useRef<File | null>(null);

  const handleFile = useCallback(
    async (file: File, platform = "") => {
      if (!file) return;
      lastFileRef.current = file;
      setFileName(file.name);
      setParsing(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        if (platform) fd.append("platform", platform);
        const res = await fetch("/api/import/parse", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "No se pudo leer el archivo");
          return;
        }
        if (data.validProducts === 0) {
          toast.error("No se detectaron productos válidos en el archivo");
        }
        setResult(data);
        setForcedPlatform(data.platform);
        setStage("preview");
      } catch {
        toast.error("Error de red al procesar el archivo");
      } finally {
        setParsing(false);
      }
    },
    [],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) void handleFile(f);
    },
    [handleFile],
  );

  const reparseWith = (platform: string) => {
    setForcedPlatform(platform);
    if (lastFileRef.current) void handleFile(lastFileRef.current, platform);
  };

  const doImport = async () => {
    if (!result) return;
    setImporting(true);
    try {
      const res = await fetch("/api/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: result.rows, platform: result.platform }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al importar");
        return;
      }
      setDoneStats({ imported: data.imported, skipped: data.skipped, imagesAdded: data.imagesAdded });
      setStage("done");
      toast.success(`${data.imported} productos importados`);
    } catch {
      toast.error("Error de red al importar");
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setStage("upload");
    setResult(null);
    setDoneStats(null);
    setFileName("");
    lastFileRef.current = null;
  };

  return (
    <div className="max-w-[1100px] w-full pb-16">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-2">
          <UploadCloud className="w-4 h-4" />
          Importación de catálogo
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Traé tus productos en minutos
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Subí el archivo que exportás de tu tienda actual. Detectamos la plataforma
          automáticamente, te mostramos una vista previa y publicás todo en tu catálogo
          Madsjeez. Sin límite de cantidad.
        </p>
      </div>

      {/* Platform chips + tutorial link */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {PLATFORMS.filter((p) => p.id !== "generic").map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-semibold text-foreground"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
        ))}
        <Link
          href="/tutoriales/importar-catalogo"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-[13px] font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          ¿Cómo exporto mi tienda?
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* STAGE: UPLOAD */}
      {stage === "upload" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
            dragOver
              ? "border-primary bg-primary/5 scale-[1.005]"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <div className="flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                {parsing ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                )}
              </div>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {parsing ? "Analizando tu archivo…" : "Arrastrá tu CSV o Excel acá"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              {fileName || "Aceptamos .csv, .xlsx y .xls hasta 12MB"}
            </p>
            <button
              type="button"
              disabled={parsing}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              Elegir archivo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
          </div>
        </div>
      )}

      {/* STAGE: PREVIEW */}
      {stage === "preview" && result && (
        <div className="space-y-6">
          {/* Detection banner */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {result.detected ? "Plataforma detectada" : "Plataforma seleccionada"}
                  </p>
                  <p className="text-lg font-bold text-foreground">{result.platformName}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => reparseWith(p.id)}
                    disabled={parsing}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                      forcedPlatform === p.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Productos válidos", value: result.validProducts, icon: Package, accent: "text-primary" },
              { label: "Con imágenes", value: result.stats.withImages, icon: ImageIcon, accent: "text-violet-500" },
              { label: "Con precio", value: result.stats.withPrice, icon: CheckCircle2, accent: "text-emerald-500" },
              { label: "Filas en archivo", value: result.totalRows, icon: FileSpreadsheet, accent: "text-amber-500" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                <s.icon className={`w-5 h-5 mb-2 ${s.accent}`} />
                <p className="text-2xl font-bold text-foreground tabular-nums">{s.value}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Preview table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Vista previa <span className="text-muted-foreground font-medium">(primeros 8)</span>
              </h3>
              <button type="button" onClick={reset} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Cambiar archivo
              </button>
            </div>
            <div className="divide-y divide-border">
              {result.rows.slice(0, 8).map((row, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <div className="h-12 w-12 shrink-0 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                    {row.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{row.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.category || "Sin categoría"} · Stock {row.stock} · {row.images.length} img
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground tabular-nums">{money(row.price)}</p>
                    {row.originalPrice ? (
                      <p className="text-[11px] text-muted-foreground line-through tabular-nums">
                        {money(row.originalPrice)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            {result.validProducts > 8 && (
              <div className="px-5 py-3 border-t border-border text-center text-xs text-muted-foreground">
                + {result.validProducts - 8} productos más se importarán
              </div>
            )}
          </div>

          {/* Import CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <p className="text-sm text-foreground">
              Vas a importar <span className="font-bold">{result.validProducts} productos</span> a tu
              catálogo. Los duplicados por título se saltean.
            </p>
            <button
              type="button"
              onClick={() => void doImport()}
              disabled={importing || result.validProducts === 0}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {importing ? "Importando…" : `Importar ${result.validProducts} productos`}
            </button>
          </div>
        </div>
      )}

      {/* STAGE: DONE */}
      {stage === "done" && doneStats && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 mb-5">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">¡Importación completa!</h2>
          <p className="text-muted-foreground mt-2 mb-6">
            Tus productos ya están en el catálogo Madsjeez.
          </p>
          <div className="flex justify-center gap-8 mb-8">
            <div>
              <p className="text-3xl font-bold text-emerald-500 tabular-nums">{doneStats.imported}</p>
              <p className="text-xs text-muted-foreground mt-1">Importados</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-violet-500 tabular-nums">{doneStats.imagesAdded}</p>
              <p className="text-xs text-muted-foreground mt-1">Imágenes</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-muted-foreground tabular-nums">{doneStats.skipped}</p>
              <p className="text-xs text-muted-foreground mt-1">Saltados</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard/publicaciones"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Ver mis publicaciones
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Importar otro archivo
            </button>
          </div>
          {doneStats.skipped > 0 && (
            <p className="text-xs text-muted-foreground mt-5 flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {doneStats.skipped} se saltearon por estar duplicados o sin precio válido.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
