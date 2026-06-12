"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

type LinkItem = { id: string; product_id: string; compatibility_claim: string; partName: string | null; product: { title: string; image: string | null } };
type FitItem = { id: string; compatibility_status: string; part: { canonical_name: string } | null; model: { model_name: string } | null };

export function ReviewPanel() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [fitments, setFitments] = useState<FitItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/partsvision/admin/review");
      if (res.ok) { const d = await res.json(); setLinks(d.links || []); setFitments(d.fitments || []); }
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const act = async (kind: string, id: string, action: "approve" | "reject") => {
    const res = await fetch("/api/partsvision/admin/review", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, id, action }),
    });
    if (!res.ok) { toast.error("Error"); return; }
    toast.success(action === "approve" ? "Aprobado" : "Rechazado");
    if (kind === "link") setLinks((l) => l.filter((x) => x.id !== id));
    else setFitments((f) => f.filter((x) => x.id !== id));
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;

  const empty = links.length === 0 && fitments.length === 0;

  return (
    <div className="max-w-3xl space-y-8">
      {empty && <p className="text-sm text-muted-foreground text-center py-10">No hay nada pendiente de revisión.</p>}

      {links.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-foreground mb-3">Vínculos producto ↔ pieza ({links.length})</h2>
          <div className="space-y-2">
            {links.map((l) => (
              <div key={l.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="h-10 w-10 shrink-0 rounded bg-muted overflow-hidden">
                  {l.product.image ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={l.product.image} alt="" className="h-full w-full object-cover" />) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{l.product.title}</p>
                  <p className="text-xs text-muted-foreground">→ {l.partName || "pieza"} · {l.compatibility_claim}</p>
                </div>
                <button onClick={() => void act("link", l.id, "approve")} className="p-1.5 rounded-lg bg-emerald-600 text-white" title="Aprobar"><Check className="w-4 h-4" /></button>
                <button onClick={() => void act("link", l.id, "reject")} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive" title="Rechazar"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </section>
      )}

      {fitments.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-foreground mb-3">Compatibilidades pendientes ({fitments.length})</h2>
          <div className="space-y-2">
            {fitments.map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{f.part?.canonical_name || "pieza"}</p>
                  <p className="text-xs text-muted-foreground">→ {f.model?.model_name || "modelo"} · {f.compatibility_status}</p>
                </div>
                <button onClick={() => void act("fitment", f.id, "approve")} className="p-1.5 rounded-lg bg-emerald-600 text-white"><Check className="w-4 h-4" /></button>
                <button onClick={() => void act("fitment", f.id, "reject")} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
