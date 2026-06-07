"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { ARGENTINA_PROVINCES } from "@/lib/seo/argentina-locations";

interface GeoFilterProps {
  province: string;
  locality: string;
  onChange: (province: string, locality: string) => void;
}

/**
 * Selector "Zona del vendedor" para el sidebar de /search.
 * - Provincia y localidad dependen entre sí (al cambiar provincia, limpia localidad).
 * - Persiste como ?province=&locality= en la URL.
 */
export function GeoFilter({ province, locality, onChange }: GeoFilterProps) {
  const provinceData = useMemo(
    () => ARGENTINA_PROVINCES.find((p) => p.slug === province) ?? null,
    [province]
  );

  return (
    <div className="space-y-3 pt-4 mt-2 border-t border-[#eaeaea] dark:border-slate-700">
      <h3 className="text-[13px] font-bold uppercase tracking-wide text-[#666] dark:text-slate-300 flex items-center gap-1.5">
        <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
        Ubicación del vendedor
      </h3>

      <label className="block">
        <span className="block text-[11px] font-semibold text-[#888] dark:text-slate-400 mb-1">
          Provincia
        </span>
        <select
          value={province}
          onChange={(e) => onChange(e.target.value, "")}
          className="w-full rounded-md border border-[#ddd] bg-white px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        >
          <option value="">Todas las provincias</option>
          {ARGENTINA_PROVINCES.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="block text-[11px] font-semibold text-[#888] dark:text-slate-400 mb-1">
          Localidad
        </span>
        <select
          value={locality}
          onChange={(e) => onChange(province, e.target.value)}
          disabled={!provinceData}
          className="w-full rounded-md border border-[#ddd] bg-white px-2.5 py-1.5 text-[13px] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        >
          <option value="">
            {provinceData ? "Todas las localidades" : "Elegí provincia"}
          </option>
          {provinceData?.localities.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
