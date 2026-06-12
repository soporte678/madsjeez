"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

type Brand = { id: string; name: string };
type MType = { id: string; name: string };
type Model = { id: string; model_name: string; status: string; brand: { name: string } | null };

export function CatalogPanel() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [types, setTypes] = useState<MType[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState("");
  const [model, setModel] = useState({ brandId: "", machineTypeId: "", modelName: "", engineCc: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, t, m] = await Promise.all([
        fetch("/api/partsvision/admin/catalog?kind=brands").then((r) => r.json()),
        fetch("/api/partsvision/admin/catalog?kind=types").then((r) => r.json()),
        fetch("/api/partsvision/admin/catalog?kind=models").then((r) => r.json()),
      ]);
      setBrands(b.items || []); setTypes(t.items || []); setModels(m.items || []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const createBrand = async () => {
    if (!brandName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/partsvision/admin/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "brand", name: brandName.trim() }) });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Error"); return; }
      toast.success("Marca creada"); setBrandName(""); await load();
    } finally { setBusy(false); }
  };

  const createModel = async () => {
    if (!model.brandId || !model.modelName.trim()) { toast.error("Elegí marca y nombre"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/partsvision/admin/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "model", ...model }) });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Error"); return; }
      toast.success("Modelo creado"); setModel({ brandId: "", machineTypeId: "", modelName: "", engineCc: "" }); await load();
    } finally { setBusy(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Marca */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-bold text-foreground mb-3">Nueva marca</p>
        <div className="flex gap-2">
          <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Ej. Stihl" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <button onClick={() => void createBrand()} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {brands.map((b) => <span key={b.id} className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground">{b.name}</span>)}
        </div>
      </div>

      {/* Modelo */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-bold text-foreground mb-3">Nuevo modelo</p>
        <div className="space-y-2">
          <select value={model.brandId} onChange={(e) => setModel({ ...model, brandId: e.target.value })} className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm">
            <option value="">Marca…</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={model.machineTypeId} onChange={(e) => setModel({ ...model, machineTypeId: e.target.value })} className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm">
            <option value="">Tipo de máquina…</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input value={model.modelName} onChange={(e) => setModel({ ...model, modelName: e.target.value })} placeholder="Modelo (ej. FS 450)" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={model.engineCc} onChange={(e) => setModel({ ...model, engineCc: e.target.value })} placeholder="cc" className="w-16 rounded-lg border border-border bg-background px-2 py-2 text-sm" />
          </div>
          <button onClick={() => void createModel()} disabled={busy} className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"><Plus className="w-4 h-4" /> Crear modelo</button>
        </div>
      </div>

      {/* Lista de modelos */}
      <div className="md:col-span-2">
        <p className="text-sm font-bold text-foreground mb-2">Modelos cargados ({models.length})</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {models.map((m) => (
            <div key={m.id} className="rounded-lg border border-border bg-card p-2.5 text-sm">
              <span className="text-muted-foreground text-xs">{m.brand?.name}</span> <span className="font-medium text-foreground">{m.model_name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
