"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ARGENTINA_PROVINCES } from "@/lib/seo/argentina-locations";

/**
 * SellerLocationPanel
 *
 * UI para que el seller configure su zona de operación. Lo que tipea acá
 * persiste en User.sellerProvince / sellerLocality / sellerPartido /
 * sellerPostalCode y se usa para:
 *   - Mostrar chip de ubicación en cada card de producto
 *   - Filtros /search?province= / ?locality=
 *   - Páginas /marketplace/[provincia]/[localidad] listando sellers reales
 *
 * Autocomplete contra la lib argentina-locations (provincias + localidades).
 * Persiste via PATCH /api/user/me.
 */
export function SellerLocationPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provinceSlug, setProvinceSlug] = useState("");
  const [localitySlug, setLocalitySlug] = useState("");
  const [partido, setPartido] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const province = useMemo(
    () => ARGENTINA_PROVINCES.find((p) => p.slug === provinceSlug) ?? null,
    [provinceSlug]
  );
  const locality = useMemo(
    () => province?.localities.find((l) => l.slug === localitySlug) ?? null,
    [province, localitySlug]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/me", { cache: "no-store" });
        if (!res.ok) return;
        const u = await res.json();
        if (cancelled) return;
        setProvinceSlug(u.sellerProvinceSlug || "");
        setLocalitySlug(u.sellerLocalitySlug || "");
        setPartido(u.sellerPartido || "");
        setPostalCode(u.sellerPostalCode || "");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    if (!province) {
      toast.error("Elegí una provincia");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerProvince: province.name,
          sellerProvinceSlug: province.slug,
          sellerLocality: locality?.name || "",
          sellerLocalitySlug: locality?.slug || "",
          sellerPartido: partido,
          sellerPostalCode: postalCode,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "No se pudo guardar");
        return;
      }
      toast.success("Zona de operación actualizada");
      setSavedAt(Date.now());
    } catch {
      toast.error("Error de red");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse h-40 dark:border-slate-700 dark:bg-slate-900" />
    );
  }

  return (
    <div className="rounded-xl border-2 border-emerald-300/60 bg-gradient-to-br from-emerald-50/70 to-white p-6 shadow-sm space-y-5 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-slate-900">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-emerald-500/15 p-3 text-emerald-700 dark:text-emerald-300">
          <MapPin className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Tu zona de operación
          </h2>
          <p className="text-sm text-gray-600 mt-1 dark:text-slate-300">
            Decile a los compradores dónde estás. Aparece como chip en cada producto, te suma
            visibilidad en búsquedas locales y habilita filtros por provincia / localidad.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400 mb-1">
            Provincia
          </span>
          <select
            value={provinceSlug}
            onChange={(e) => {
              setProvinceSlug(e.target.value);
              setLocalitySlug("");
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">Seleccioná provincia…</option>
            {ARGENTINA_PROVINCES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400 mb-1">
            Localidad / Ciudad
          </span>
          <select
            value={localitySlug}
            onChange={(e) => setLocalitySlug(e.target.value)}
            disabled={!province}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">
              {province ? "Seleccioná localidad…" : "Elegí provincia primero"}
            </option>
            {province?.localities.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400 mb-1">
            Partido / Barrio (opcional)
          </span>
          <input
            type="text"
            value={partido}
            onChange={(e) => setPartido(e.target.value)}
            placeholder="Ej: La Matanza, Palermo…"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        </label>

        <label className="block">
          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400 mb-1">
            Código postal
          </span>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="Ej: 1812"
            inputMode="numeric"
            maxLength={8}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500 dark:text-slate-400">
          {province && locality
            ? `Aparecerá: 📍 ${locality.name}, ${province.name}`
            : province
              ? `Aparecerá: 📍 ${province.name}`
              : "Completá al menos la provincia"}
        </p>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !province}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : savedAt ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Guardando…" : savedAt ? "Guardado" : "Guardar zona"}
        </button>
      </div>
    </div>
  );
}
