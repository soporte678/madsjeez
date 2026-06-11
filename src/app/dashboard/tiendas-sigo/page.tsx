"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, Loader2, X, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

type FollowedStore = {
  id: string;
  name: string | null;
  storeSlug: string | null;
  image: string | null;
  reputation: string | null;
  productCount: number;
};

export default function TiendasSigoPage() {
  const [stores, setStores] = useState<FollowedStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/follows", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setStores(d.follows || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unfollow = async (sellerId: string) => {
    setStores((prev) => prev.filter((s) => s.id !== sellerId));
    try {
      const res = await fetch(`/api/follows?sellerId=${sellerId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("No se pudo dejar de seguir");
    }
  };

  const filtered = stores.filter((s) =>
    (s.name || "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-[26px] font-semibold text-foreground">Tiendas que sigo</h1>
        <span className="text-sm text-muted-foreground font-medium">
          {stores.length} {stores.length === 1 ? "tienda" : "tiendas"}
        </span>
      </div>

      {stores.length > 0 && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-2">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nombre de la tienda"
            className="w-full max-w-md py-2 px-4 text-sm border border-border rounded-full focus:outline-none focus:border-primary bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm border border-border p-16 flex flex-col items-center justify-center text-center">
          <Store size={40} className="text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No seguís ninguna tienda</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Seguí a tus vendedores favoritos para enterarte de sus novedades.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="h-12 w-12 shrink-0 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                {s.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Store className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{s.name || "Tienda"}</p>
                <p className="text-xs text-muted-foreground">{s.productCount} productos</p>
              </div>
              {s.storeSlug && (
                <Link
                  href={`/tienda/${s.storeSlug}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  Ver <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => void unfollow(s.id)}
                className="text-muted-foreground hover:text-destructive"
                title="Dejar de seguir"
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
