"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

type Product = {
  product_id: string;
  title: string;
  price: number;
  image_url: string | null;
  seller_name: string;
  status: string;
  source: string;
  machine_label: string;
};

const STATUS_META: Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  confirmed: { label: "Compatible confirmado", cls: "text-emerald-600 bg-emerald-500/10", Icon: CheckCircle2 },
  declared: { label: "Declarado por el vendedor", cls: "text-amber-600 bg-amber-500/10", Icon: AlertTriangle },
  pending: { label: "Pendiente de revisión", cls: "text-slate-500 bg-slate-500/10", Icon: Clock },
};

function money(n: number) {
  return `$${Number(n || 0).toLocaleString("es-AR")}`;
}

export function CompatibilityWizard({ initialTypes }: { initialTypes: string[] }) {
  const [type, setType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [results, setResults] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(false);

  const loadOptions = useCallback(async (level: string, params: Record<string, string>) => {
    const qs = new URLSearchParams({ level, ...params });
    const res = await fetch(`/api/compatibility/options?${qs}`);
    if (!res.ok) return [];
    const d = await res.json();
    return (d.options as string[]) || [];
  }, []);

  const onType = async (v: string) => {
    setType(v); setBrand(""); setModel(""); setModels([]); setResults(null);
    setBrands(v ? await loadOptions("brand", { type: v }) : []);
  };
  const onBrand = async (v: string) => {
    setBrand(v); setModel(""); setResults(null);
    setModels(v ? await loadOptions("model", { type, brand: v }) : []);
  };

  const search = async () => {
    if (!type) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ type });
      if (brand) qs.set("brand", brand);
      if (model) qs.set("model", model);
      const res = await fetch(`/api/compatibility/search?${qs}`);
      const d = await res.json();
      setResults(d.products || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Tipo de máquina" value={type} options={initialTypes} onChange={onType} placeholder="Elegí…" />
          <Select label="Marca" value={brand} options={brands} onChange={onBrand} disabled={!type} placeholder={type ? "Todas" : "—"} />
          <Select label="Modelo" value={model} options={models} onChange={setModel} disabled={!brand} placeholder={brand ? "Todos" : "—"} />
        </div>
        <button
          type="button"
          onClick={() => void search()}
          disabled={!type || loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Buscar repuestos compatibles
        </button>
      </div>

      {results && (
        <div className="mt-6">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No encontramos repuestos compatibles cargados para esa máquina todavía.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">
                  {results.length} repuesto{results.length > 1 ? "s" : ""} compatible{results.length > 1 ? "s" : ""}
                </p>
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Verificá las medidas antes de comprar
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.map((p) => {
                  const st = STATUS_META[p.status] || STATUS_META.declared;
                  return (
                    <Link
                      key={p.product_id}
                      href={`/product/${p.product_id}`}
                      className="group flex gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="h-16 w-16 shrink-0 rounded-lg bg-muted overflow-hidden">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary">{p.title}</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{money(p.price)}</p>
                        <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>
                          <st.Icon className="w-3 h-3" /> {st.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Select({
  label, value, options, onChange, disabled, placeholder,
}: {
  label: string; value: string; options: string[];
  onChange: (v: string) => void | Promise<void>; disabled?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold text-foreground mb-1">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => void onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="">{placeholder || "Elegí…"}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
