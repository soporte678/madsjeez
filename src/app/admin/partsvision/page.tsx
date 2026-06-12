"use client";

import { useEffect, useState, useCallback } from "react";
import { HotspotEditor } from "@/components/partsvision/HotspotEditor";
import { Loader2, Plus, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Diagram = {
  id: string; title: string; image_url: string;
  publication_status: string; copyright_status: string; hotspotCount: number;
};

const COPYRIGHT = ["unknown", "owned", "licensed", "public_domain", "permission_pending", "restricted"];

export default function AdminPartsVisionPage() {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Diagram | null>(null);
  const [form, setForm] = useState({ title: "", imageUrl: "", copyrightStatus: "unknown" });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/partsvision/admin/diagrams");
      if (res.ok) setDiagrams((await res.json()).diagrams || []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!form.title.trim() || !/^https?:\/\//i.test(form.imageUrl)) { toast.error("Completá título e imagen (URL)"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/partsvision/admin/diagrams", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Error"); return; }
      toast.success("Despiece creado");
      setForm({ title: "", imageUrl: "", copyrightStatus: "unknown" });
      await load();
    } finally { setCreating(false); }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/partsvision/admin/diagrams/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error || "Error"); return false; }
    await load();
    return true;
  };

  if (editing) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <button onClick={() => { setEditing(null); void load(); }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold text-foreground">{editing.title}</h1>
          <div className="flex items-center gap-2">
            <select defaultValue={editing.copyright_status} onChange={(e) => patch(editing.id, { copyrightStatus: e.target.value })}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
              {COPYRIGHT.map((c) => <option key={c} value={c}>copyright: {c}</option>)}
            </select>
            {editing.publication_status !== "published" ? (
              <button onClick={async () => { if (await patch(editing.id, { publicationStatus: "published" })) setEditing({ ...editing, publication_status: "published" }); }}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">Publicar</button>
            ) : (
              <a href={`/despieces/${editing.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">
                Ver público <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        <HotspotEditor diagramId={editing.id} imageUrl={editing.image_url} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-1">PartsVision — Despieces</h1>
      <p className="text-sm text-muted-foreground mb-6">Cargá un despiece, dibujá los puntos y vinculá las piezas. Publicá solo con copyright resuelto.</p>

      <div className="rounded-xl border border-border bg-card p-4 mb-6">
        <p className="text-sm font-bold text-foreground mb-3">Nuevo despiece</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título (ej. Stihl FS 450 — Carburador)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="URL de la imagen del despiece" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <select value={form.copyrightStatus} onChange={(e) => setForm({ ...form, copyrightStatus: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-2 text-xs">
            {COPYRIGHT.map((c) => <option key={c} value={c}>copyright: {c}</option>)}
          </select>
          <button onClick={() => void create()} disabled={creating} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Crear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {diagrams.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Todavía no hay despieces.</p>}
          {diagrams.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="h-12 w-16 shrink-0 rounded bg-white overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.image_url} alt="" className="h-full w-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{d.title}</p>
                <p className="text-xs text-muted-foreground">{d.hotspotCount} puntos · {d.publication_status} · copyright {d.copyright_status}</p>
              </div>
              <button onClick={() => setEditing(d)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">Editar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
