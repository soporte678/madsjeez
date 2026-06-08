"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plug,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Unlink,
  X,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

type Connection = {
  platform: string;
  store_label: string | null;
  store_ref: string | null;
  status: string;
  last_sync_at: string | null;
  last_sync_count: number | null;
};

const PLATFORMS = [
  {
    id: "tiendanube",
    name: "Tienda Nube",
    color: "#2c6ecb",
    method: "oauth" as const,
    blurb: "Conectá con un clic. Autorizás Madsjeez y traemos tus productos.",
  },
  {
    id: "shopify",
    name: "Shopify",
    color: "#95bf47",
    method: "token" as const,
    blurb: "Pegá el token de una app personalizada de tu admin de Shopify.",
    fields: [
      { key: "storeDomain", label: "Dominio (mitienda.myshopify.com)", type: "text" },
      { key: "adminToken", label: "Admin API access token", type: "password" },
    ],
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    color: "#96588a",
    method: "keys" as const,
    blurb: "Generá claves REST en tu WordPress y pegalas acá.",
    fields: [
      { key: "storeUrl", label: "URL de tu tienda (https://...)", type: "text" },
      { key: "consumerKey", label: "Consumer key (ck_...)", type: "text" },
      { key: "consumerSecret", label: "Consumer secret (cs_...)", type: "password" },
    ],
  },
];

export function StoreConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalPlatform, setModalPlatform] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/status", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      }
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // Mensaje al volver del OAuth de Tienda Nube
    const params = new URLSearchParams(window.location.search);
    if (params.get("tn_connected")) {
      toast.success("Tienda Nube conectada. Tocá Sincronizar para traer tus productos.");
    } else if (params.get("tn_error")) {
      toast.error("No se pudo conectar Tienda Nube. Probá de nuevo o usá CSV.");
    }
  }, [load]);

  const connectedMap = new Map(connections.map((c) => [c.platform, c]));

  const openConnect = (platform: string, method: string) => {
    if (method === "oauth") {
      window.location.href = "/api/integrations/tiendanube/start";
      return;
    }
    setForm({});
    setModalPlatform(platform);
  };

  const submitCredentials = async () => {
    if (!modalPlatform) return;
    setBusy(true);
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: modalPlatform, credentials: form }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "No se pudo conectar");
        return;
      }
      toast.success(`Conectado. ${data.productsFound} productos encontrados.`);
      setModalPlatform(null);
      await load();
    } catch {
      toast.error("Error de red");
    } finally {
      setBusy(false);
    }
  };

  const sync = async (platform: string) => {
    setSyncing(platform);
    try {
      const res = await fetch("/api/integrations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al sincronizar");
        return;
      }
      toast.success(`${data.imported} importados · ${data.skipped} saltados`);
      await load();
    } catch {
      toast.error("Error de red al sincronizar");
    } finally {
      setSyncing(null);
    }
  };

  const disconnect = async (platform: string) => {
    if (!confirm("¿Desconectar esta tienda? Tus productos ya importados no se borran.")) return;
    try {
      const res = await fetch(`/api/integrations/status?platform=${platform}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Tienda desconectada");
        await load();
      }
    } catch {
      toast.error("Error de red");
    }
  };

  const modal = modalPlatform ? PLATFORMS.find((p) => p.id === modalPlatform) : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 mb-8">
      <div className="flex items-center gap-2 mb-1">
        <Plug className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-bold text-foreground">Conexión directa (sin archivos)</h2>
      </div>
      <p className="text-[13px] text-muted-foreground mb-5">
        Conectá tu tienda y traé las publicaciones automáticamente. Después sincronizás
        cuando quieras para traer lo nuevo.
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PLATFORMS.map((p) => {
            const conn = connectedMap.get(p.id);
            return (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-background p-4 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="font-bold text-sm text-foreground">{p.name}</span>
                  {conn && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                </div>

                {conn ? (
                  <>
                    <p className="text-[12px] text-muted-foreground mb-1 truncate">
                      {conn.store_ref || "Conectada"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mb-3">
                      {conn.last_sync_at
                        ? `Última sync: ${conn.last_sync_count ?? 0} productos`
                        : "Todavía no sincronizada"}
                    </p>
                    <div className="mt-auto flex gap-2">
                      <button
                        type="button"
                        onClick={() => void sync(p.id)}
                        disabled={syncing === p.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        {syncing === p.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        Sincronizar
                      </button>
                      <button
                        type="button"
                        onClick={() => void disconnect(p.id)}
                        className="inline-flex items-center justify-center rounded-lg border border-border px-2.5 py-2 text-muted-foreground hover:text-destructive"
                        title="Desconectar"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">{p.blurb}</p>
                    <button
                      type="button"
                      onClick={() => openConnect(p.id, p.method)}
                      className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10"
                    >
                      Conectar
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[12px] text-muted-foreground mt-4">
        ¿Usás Empretienda u otra plataforma? Por ahora importá con el archivo CSV de abajo.
      </p>

      {/* Modal credenciales */}
      {modal && modal.fields && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: modal.color }} />
                Conectar {modal.name}
              </h3>
              <button
                type="button"
                onClick={() => setModalPlatform(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {modal.fields.map((f) => (
                <div key={f.key}>
                  <label className="block text-[12px] font-semibold text-foreground mb-1">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    value={form[f.key] || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void submitCredentials()}
              disabled={busy}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
              {busy ? "Conectando…" : "Conectar y validar"}
            </button>
            <p className="text-[11px] text-muted-foreground mt-3 text-center">
              Tus credenciales se guardan cifradas. Validamos la conexión antes de guardar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
