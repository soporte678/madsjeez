"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Check, ExternalLink, Store, Code } from "lucide-react";
import { toast } from "sonner";

type StoreInfo = {
  storeSlug: string | null;
  storeUrl: string | null;
  displayName: string | null;
  productCount: number;
};

export function StorePublicPanel() {
  const [info, setInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [slugInput, setSlugInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seller/public-store");
      if (res.status === 403) {
        setInfo(null);
        return;
      }
      if (!res.ok) {
        setInfo(null);
        return;
      }
      const data = await res.json();
      setInfo(data);
      setSlugInput(data.storeSlug || "");
    } catch {
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const copy = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("Copiado al portapapeles");
    setTimeout(() => setCopied(null), 2000);
  };

  const saveSlug = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/seller/public-store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeSlug: slugInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "No se pudo guardar");
        return;
      }
      toast.success("URL de tienda actualizada");
      await load();
    } catch {
      toast.error("Error de red");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse h-40" />
    );
  }

  if (!info?.storeUrl) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-900">
        Publicá al menos un producto activo con imagen para activar tu tienda pública y el badge
        enlazable.
      </div>
    );
  }

  const badgeHtml = `<a href="${info.storeUrl}" title="${info.displayName || "Tienda"} en MadsJeez Marketplace" rel="noopener"><img src="https://www.madsjeez.com.ar/brand/madsjeez-icon-512.png" alt="MadsJeez Marketplace" width="120" height="40" style="height:40px;width:auto" /> <span>Tienda oficial en MadsJeez</span></a>`;

  const textLink = `<a href="${info.storeUrl}" rel="noopener">Ver nuestra tienda en MadsJeez Marketplace</a>`;

  return (
    <div className="rounded-xl border-2 border-[#3483FA]/30 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm space-y-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-[#3483FA]/10 p-3">
          <Store className="h-6 w-6 text-[#3483FA]" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">Tu tienda pública (SEO + backlinks)</h2>
          <p className="text-sm text-gray-600 mt-1">
            Compartí este enlace en tu web, redes y WhatsApp. Cada enlace suma autoridad real a
            MadsJeez y trae tráfico a tus {info.productCount} productos activos.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={slugInput}
          onChange={(e) => setSlugInput(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
          placeholder="mi-tienda-oficial"
          aria-label="Nombre URL tienda"
        />
        <button
          type="button"
          onClick={() => void saveSlug()}
          disabled={saving}
          className="rounded-lg bg-[#3483FA] px-4 py-2 text-sm font-bold text-white hover:bg-[#2968c8] disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar URL"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={info.storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#3483FA] hover:bg-gray-50"
        >
          <ExternalLink className="h-4 w-4" />
          Ver tienda
        </a>
        <button
          type="button"
          onClick={() => copy(info.storeUrl!, "url")}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          {copied === "url" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          Copiar link
        </button>
        <button
          type="button"
          onClick={() => copy(textLink, "html")}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          {copied === "html" ? <Check className="h-4 w-4 text-green-600" /> : <Code className="h-4 w-4" />}
          Copiar HTML enlace
        </button>
        <button
          type="button"
          onClick={() => copy(badgeHtml, "badge")}
          className="inline-flex items-center gap-2 rounded-lg bg-[#f97316] px-4 py-2 text-sm font-bold text-white hover:bg-[#ea580c]"
        >
          {copied === "badge" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Copiar badge
        </button>
      </div>

      <p className="text-xs text-gray-500 font-mono break-all">{info.storeUrl}</p>
    </div>
  );
}
