"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ZoomIn, ZoomOut, Maximize2, X, ArrowUpRight } from "lucide-react";

type Hotspot = {
  id: string;
  part_id: string | null;
  callout_number: string | null;
  shape_type: "circle" | "rect" | "polygon";
  x: number; y: number; width: number | null; height: number | null;
  polygon_points: { x: number; y: number }[] | null;
  tooltip_text: string | null;
};
type Part = {
  id: string; canonical_name: string; part_type: string | null; image_url: string | null;
  oems: string[];
  products: { id: string; title: string; price: number; stock: number; image: string | null; claim: string }[];
};
type Data = {
  diagram: { id: string; title: string; image_url: string };
  hotspots: Hotspot[];
  parts: Record<string, Part>;
};

function money(n: number) { return `$${Number(n || 0).toLocaleString("es-AR")}`; }

export function PartsDiagramViewer({ diagramId }: { diagramId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/partsvision/diagram/${diagramId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [diagramId]);

  const selectHotspot = useCallback((h: Hotspot) => {
    setSelected(h.id);
    // centrar zoom en el hotspot
    setZoom(2);
    setPan({ x: (0.5 - h.x) * 100, y: (0.5 - h.y) * 100 });
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(5, Math.max(1, z + (e.deltaY < 0 ? 0.25 : -0.25))));
  };
  const onDown = (e: React.MouseEvent) => { dragRef.current = { x: e.clientX, y: e.clientY }; };
  const onMove = (e: React.MouseEvent) => {
    if (!dragRef.current || zoom <= 1) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx / 4, y: p.y + dy / 4 }));
  };
  const onUp = () => { dragRef.current = null; };
  const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); setSelected(null); };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!data) {
    return <p className="text-center text-muted-foreground py-16">No se pudo cargar el despiece.</p>;
  }

  const selPart = selected
    ? data.parts[(data.hotspots.find((h) => h.id === selected)?.part_id) || ""]
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
      {/* Visor */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <h2 className="text-sm font-bold text-foreground truncate">{data.diagram.title}</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom((z) => Math.min(5, z + 0.5))} className="p-1.5 rounded-md hover:bg-muted" aria-label="Acercar"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="p-1.5 rounded-md hover:bg-muted" aria-label="Alejar"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={reset} className="p-1.5 rounded-md hover:bg-muted" aria-label="Restablecer"><Maximize2 className="w-4 h-4" /></button>
          </div>
        </div>
        <div
          ref={stageRef}
          className="relative w-full aspect-[4/3] bg-white overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        >
          <div
            className="absolute inset-0 transition-transform duration-150"
            style={{ transform: `scale(${zoom}) translate(${pan.x}%, ${pan.y}%)`, transformOrigin: "center" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.diagram.image_url} alt={data.diagram.title} className="w-full h-full object-contain pointer-events-none" />
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
              {data.hotspots.map((h) => {
                const isSel = h.id === selected;
                const cx = h.x * 100, cy = h.y * 100;
                const common = {
                  className: `cursor-pointer transition-colors ${isSel ? "fill-primary/30 stroke-primary" : "fill-primary/0 stroke-primary/70 hover:fill-primary/20"}`,
                  strokeWidth: 0.5,
                  onClick: () => selectHotspot(h),
                };
                if (h.shape_type === "rect" && h.width && h.height) {
                  return <rect key={h.id} x={cx} y={cy} width={h.width * 100} height={h.height * 100} {...common} />;
                }
                if (h.shape_type === "polygon" && h.polygon_points?.length) {
                  return <polygon key={h.id} points={h.polygon_points.map((p) => `${p.x * 100},${p.y * 100}`).join(" ")} {...common} />;
                }
                return <circle key={h.id} cx={cx} cy={cy} r={2.2} {...common} />;
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Panel lateral */}
      <div className="rounded-2xl border border-border bg-card p-4">
        {selPart ? (
          <div>
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-foreground leading-snug">{selPart.canonical_name}</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            {selPart.oems.length > 0 && (
              <p className="text-xs text-muted-foreground mb-3">OEM: <span className="font-mono text-foreground">{selPart.oems.join(", ")}</span></p>
            )}
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              {selPart.products.length} {selPart.products.length === 1 ? "publicación" : "publicaciones"}
            </p>
            <div className="space-y-2">
              {selPart.products.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className="flex gap-2 rounded-lg border border-border p-2 hover:border-primary/40">
                  <div className="h-12 w-12 shrink-0 rounded bg-muted overflow-hidden">
                    {p.image ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={p.image} alt="" className="h-full w-full object-cover" />) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground line-clamp-2">{p.title}</p>
                    <p className="text-sm font-bold text-foreground">{money(p.price)}</p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                </Link>
              ))}
              {selPart.products.length === 0 && (
                <p className="text-xs text-muted-foreground">Todavía no hay publicaciones de esta pieza.</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm font-bold text-foreground mb-1">Piezas del despiece</p>
            <p className="text-xs text-muted-foreground mb-3">Tocá un punto del diagrama o una fila.</p>
            <div className="space-y-1 max-h-[420px] overflow-auto">
              {data.hotspots.map((h) => {
                const part = h.part_id ? data.parts[h.part_id] : null;
                return (
                  <button
                    key={h.id}
                    onClick={() => selectHotspot(h)}
                    className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    {h.callout_number && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold px-1">{h.callout_number}</span>
                    )}
                    <span className="flex-1 truncate text-foreground">{part?.canonical_name || h.tooltip_text || "Pieza"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
