"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Trash2, Save, Plus, Search } from "lucide-react";
import { toast } from "sonner";

type EditorHotspot = {
  tmpId: string;
  partId: string | null;
  partName: string;
  calloutNumber: string;
  shapeType: "circle";
  x: number; y: number;
};
type PartHit = { id: string; canonical_name: string };

/** Editor de hotspots sobre un despiece. Coords normalizadas 0-1 (click = punto). */
export function HotspotEditor({ diagramId, imageUrl }: { diagramId: string; imageUrl: string }) {
  const [hotspots, setHotspots] = useState<EditorHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [partQuery, setPartQuery] = useState("");
  const [partHits, setPartHits] = useState<PartHit[]>([]);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/partsvision/admin/diagrams/${diagramId}`)
      .then((r) => r.json())
      .then((d) => {
        const hs: EditorHotspot[] = (d.hotspots || [])
          .filter((h: { shape_type: string }) => h.shape_type === "circle")
          .map((h: { id: string; part_id: string | null; callout_number: string | null; x: number; y: number }) => ({
            tmpId: h.id, partId: h.part_id, partName: "", calloutNumber: h.callout_number || "",
            shapeType: "circle", x: h.x, y: h.y,
          }));
        setHotspots(hs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [diagramId]);

  const addHotspot = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const next: EditorHotspot = {
      tmpId: `tmp-${Date.now()}`, partId: null, partName: "",
      calloutNumber: String(hotspots.length + 1), shapeType: "circle",
      x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)),
    };
    setHotspots((h) => [...h, next]);
    setActiveIdx(hotspots.length);
  };

  const searchParts = useCallback(async (q: string) => {
    setPartQuery(q);
    if (q.trim().length < 2) { setPartHits([]); return; }
    const res = await fetch(`/api/partsvision/admin/parts?q=${encodeURIComponent(q)}`);
    if (res.ok) setPartHits((await res.json()).parts || []);
  }, []);

  const createPart = async () => {
    if (activeIdx == null || !partQuery.trim()) return;
    const res = await fetch("/api/partsvision/admin/parts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canonicalName: partQuery.trim() }),
    });
    const d = await res.json();
    if (res.ok) {
      linkPart(d.id, partQuery.trim());
      toast.success("Pieza creada (borrador)");
    } else toast.error(d.error || "No se pudo crear");
  };

  const linkPart = (partId: string, partName: string) => {
    if (activeIdx == null) return;
    setHotspots((hs) => hs.map((h, i) => (i === activeIdx ? { ...h, partId, partName } : h)));
    setPartHits([]); setPartQuery("");
  };

  const removeHotspot = (idx: number) => {
    setHotspots((hs) => hs.filter((_, i) => i !== idx));
    if (activeIdx === idx) setActiveIdx(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/partsvision/admin/hotspots", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagramId,
          hotspots: hotspots.map((h) => ({
            partId: h.partId, calloutNumber: h.calloutNumber, shapeType: "circle", x: h.x, y: h.y,
          })),
        }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Error al guardar"); return; }
      toast.success(`${d.saved} hotspots guardados`);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      <div className="rounded-xl border border-border overflow-hidden">
        <p className="px-3 py-2 text-xs text-muted-foreground border-b border-border">Tocá la imagen para agregar un punto.</p>
        <div ref={imgRef} onClick={addHotspot} className="relative w-full aspect-[4/3] bg-white cursor-crosshair">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="w-full h-full object-contain pointer-events-none" />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
            {hotspots.map((h, i) => (
              <g key={h.tmpId}>
                <circle cx={h.x * 100} cy={h.y * 100} r={2.2}
                  className={i === activeIdx ? "fill-primary/40 stroke-primary" : "fill-primary/15 stroke-primary/70"} strokeWidth={0.5} />
                {h.calloutNumber && <text x={h.x * 100} y={h.y * 100 - 3} textAnchor="middle" className="fill-primary text-[3px] font-bold">{h.calloutNumber}</text>}
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-foreground">{hotspots.length} puntos</span>
          <button onClick={() => void save()} disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Guardar
          </button>
        </div>
        <div className="space-y-1.5 overflow-auto max-h-[340px]">
          {hotspots.map((h, i) => (
            <div key={h.tmpId} onClick={() => setActiveIdx(i)}
              className={`rounded-lg border p-2 cursor-pointer ${i === activeIdx ? "border-primary bg-primary/5" : "border-border"}`}>
              <div className="flex items-center gap-2">
                <input value={h.calloutNumber} onChange={(e) => setHotspots((hs) => hs.map((x, j) => j === i ? { ...x, calloutNumber: e.target.value } : x))}
                  className="w-10 rounded border border-border bg-background px-1 py-0.5 text-xs text-center" onClick={(e) => e.stopPropagation()} />
                <span className="flex-1 text-xs truncate text-foreground">{h.partName || (h.partId ? "Pieza vinculada" : "Sin pieza")}</span>
                <button onClick={(e) => { e.stopPropagation(); removeHotspot(i); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>

        {activeIdx != null && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Vincular pieza</p>
            <div className="relative">
              <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={partQuery} onChange={(e) => void searchParts(e.target.value)} placeholder="Buscar o crear pieza…"
                className="w-full rounded-lg border border-border bg-background pl-7 pr-2 py-1.5 text-xs" />
            </div>
            {partHits.length > 0 && (
              <div className="mt-1 rounded-lg border border-border bg-background divide-y divide-border max-h-32 overflow-auto">
                {partHits.map((p) => (
                  <button key={p.id} onClick={() => linkPart(p.id, p.canonical_name)} className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted text-foreground">{p.canonical_name}</button>
                ))}
              </div>
            )}
            {partQuery.trim().length >= 2 && partHits.length === 0 && (
              <button onClick={() => void createPart()} className="mt-1 w-full inline-flex items-center justify-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2 py-1.5 text-xs font-bold text-primary">
                <Plus className="w-3.5 h-3.5" /> Crear "{partQuery.trim()}"
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
