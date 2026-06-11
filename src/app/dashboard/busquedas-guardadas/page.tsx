"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Loader2, X, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

type SavedSearch = {
  id: string;
  label: string | null;
  query: string | null;
  category_slug: string | null;
  filters: Record<string, unknown> | null;
  notify: boolean;
  created_at: string;
};

function buildHref(s: SavedSearch): string {
  const params = new URLSearchParams();
  if (s.query) params.set("q", s.query);
  if (s.category_slug) params.set("category", s.category_slug);
  const f = s.filters || {};
  for (const [k, v] of Object.entries(f)) {
    if (v != null && v !== "") params.set(k, String(v));
  }
  return `/search?${params.toString()}`;
}

export default function BusquedasGuardadasPage() {
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/saved-searches", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.searches || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/saved-searches?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <h1 className="text-[26px] font-semibold text-foreground">Búsquedas guardadas</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm border border-border p-16 flex flex-col items-center justify-center text-center">
          <Search size={48} className="text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No tenés búsquedas guardadas</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Guardá una búsqueda desde los resultados para volver a ella y recibir avisos de novedades.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            Ir a buscar
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Search className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{s.label || s.query || "Búsqueda"}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {s.notify ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                  {s.notify ? "Avisos activados" : "Sin avisos"}
                </p>
              </div>
              <Link
                href={buildHref(s)}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
              >
                Ver resultados
              </Link>
              <button
                type="button"
                onClick={() => void remove(s.id)}
                className="text-muted-foreground hover:text-destructive"
                title="Eliminar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
