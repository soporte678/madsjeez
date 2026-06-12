"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Search, X, Plus, Wrench, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Product = { id: string; title: string; image: string | null; price: number };
type PartHit = { id: string; canonical_name: string; part_type: string | null };
type Link = { id: string; part_id: string; compatibility_claim: string; link_status: string; part: { canonical_name: string } | null };

const CLAIMS = [
  { v: "original", label: "Original" },
  { v: "alternative", label: "Alternativo" },
  { v: "used", label: "Usado" },
];

export default function DashboardPartsVisionPage() {
  const { data: session } = useSession();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Product | null>(null);

  useEffect(() => {
    fetch("/api/partsvision/flags").then((r) => r.json()).then((d) => setEnabled(!!d.partsvision_seller_fitments_enabled)).catch(() => setEnabled(false));
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    fetch(`/api/products?seller=${uid}&limit=100`)
      .then((r) => r.json())
      .then((d) => {
        const list = (d.products || []).map((p: { id: string; title: string; price: number; product_images?: { url: string }[] }) => ({
          id: p.id, title: p.title, price: p.price, image: p.product_images?.[0]?.url ?? null,
        }));
        setProducts(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  if (enabled === false) {
    return (
      <div className="flex-1 max-w-3xl">
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Wrench className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">PartsVision — próximamente</h2>
          <p className="text-sm text-muted-foreground">Pronto vas a poder vincular tus repuestos a los despieces de cada máquina para que te encuentren más fácil.</p>
        </div>
      </div>
    );
  }

  const filtered = products.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex-1 max-w-4xl">
      <h1 className="text-[26px] font-semibold text-foreground mb-1">Vincular repuestos a despieces</h1>
      <p className="text-sm text-muted-foreground mb-6">Asociá tus publicaciones a la pieza técnica para aparecer en el explorador de máquinas.</p>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar mi producto…" className="w-full rounded-full border border-border bg-card pl-9 pr-4 py-2 text-sm" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filtered.slice(0, 60).map((p) => (
            <button key={p.id} onClick={() => setActive(p)} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 text-left hover:border-primary/40">
              <div className="h-10 w-10 shrink-0 rounded bg-muted overflow-hidden">
                {p.image ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={p.image} alt="" className="h-full w-full object-cover" />) : null}
              </div>
              <span className="flex-1 text-sm font-medium text-foreground line-clamp-2">{p.title}</span>
            </button>
          ))}
        </div>
      )}

      {active && <LinkerModal product={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function LinkerModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [links, setLinks] = useState<Link[]>([]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PartHit[]>([]);
  const [claim, setClaim] = useState("alternative");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/seller/partsvision/links?productId=${product.id}`);
    if (res.ok) setLinks((await res.json()).links || []);
  }, [product.id]);
  useEffect(() => { void load(); }, [load]);

  const search = async (v: string) => {
    setQuery(v);
    if (v.trim().length < 2) { setHits([]); return; }
    const res = await fetch(`/api/partsvision/parts/search?q=${encodeURIComponent(v)}`);
    if (res.ok) setHits((await res.json()).parts || []);
  };

  const addLink = async (partId: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/seller/partsvision/links", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, partId, claim }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Error"); return; }
      toast.success("Vinculado. Queda pendiente de revisión.");
      setQuery(""); setHits([]); await load();
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    await fetch(`/api/seller/partsvision/links?id=${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-5 shadow-2xl">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-foreground leading-snug line-clamp-2">{product.title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {links.length > 0 && (
          <div className="mb-4 space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Piezas vinculadas</p>
            {links.map((l) => (
              <div key={l.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                <span className="flex-1 text-sm text-foreground truncate">{l.part?.canonical_name || "Pieza"}</span>
                <span className="text-[10px] rounded-full bg-amber-500/10 text-amber-600 px-2 py-0.5 font-bold">{l.link_status}</span>
                <button onClick={() => void remove(l.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Agregar pieza</p>
        <div className="flex gap-2 mb-2">
          <select value={claim} onChange={(e) => setClaim(e.target.value)} className="rounded-lg border border-border bg-background px-2 py-2 text-xs">
            {CLAIMS.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <input value={query} onChange={(e) => void search(e.target.value)} placeholder="Buscar pieza por nombre u OEM…" className="w-full rounded-lg border border-border bg-background pl-7 pr-2 py-2 text-xs" />
          </div>
        </div>
        {hits.length > 0 && (
          <div className="rounded-lg border border-border divide-y divide-border max-h-44 overflow-auto">
            {hits.map((p) => (
              <button key={p.id} disabled={busy} onClick={() => void addLink(p.id)} className="w-full flex items-center gap-2 px-2 py-2 text-left text-xs hover:bg-muted disabled:opacity-50">
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span className="flex-1 text-foreground">{p.canonical_name}</span>
                {p.part_type && <span className="text-muted-foreground">{p.part_type}</span>}
              </button>
            ))}
          </div>
        )}
        {query.trim().length >= 2 && hits.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">No se encontró esa pieza en el catálogo técnico publicado.</p>
        )}
      </div>
    </div>
  );
}
