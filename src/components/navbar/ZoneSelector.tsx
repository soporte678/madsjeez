"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ARGENTINA_PROVINCES } from "@/lib/seo/argentina-locations";

const LS_KEY = "madsjeez_zone_preference";

type ZonePref = { provinceSlug: string; provinceName: string; localitySlug?: string; localityName?: string };

/**
 * ZoneSelector
 *
 * Pill compacto para el navbar que muestra "Comprar en mi zona" cuando no hay
 * zona elegida, o el nombre de la zona elegida cuando hay. Al hacer click abre
 * un popover con buscador + lista de provincias/localidades.
 *
 * Persiste en localStorage para que la próxima visita arranque con la zona,
 * y dispara navegación a /marketplace/[provincia]/[localidad] cuando aplica.
 */
export function ZoneSelector({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState<ZonePref | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setZone(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  /** Filtro fuzzy sobre provincias + localidades */
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Sin query: mostrar todas las provincias collapsed
      return ARGENTINA_PROVINCES.map((p) => ({
        type: "province" as const,
        provinceSlug: p.slug,
        provinceName: p.name,
      }));
    }
    const out: Array<
      | { type: "province"; provinceSlug: string; provinceName: string }
      | {
          type: "locality";
          provinceSlug: string;
          provinceName: string;
          localitySlug: string;
          localityName: string;
        }
    > = [];
    for (const p of ARGENTINA_PROVINCES) {
      if (p.name.toLowerCase().includes(q)) {
        out.push({ type: "province", provinceSlug: p.slug, provinceName: p.name });
      }
      for (const l of p.localities) {
        if (l.name.toLowerCase().includes(q)) {
          out.push({
            type: "locality",
            provinceSlug: p.slug,
            provinceName: p.name,
            localitySlug: l.slug,
            localityName: l.name,
          });
        }
      }
    }
    return out.slice(0, 24);
  }, [query]);

  const pick = (next: ZonePref) => {
    setZone(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    setOpen(false);
    setQuery("");
    if (next.localitySlug) {
      router.push(`/marketplace/${next.provinceSlug}/${next.localitySlug}`);
    } else {
      router.push(`/marketplace/${next.provinceSlug}`);
    }
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZone(null);
    localStorage.removeItem(LS_KEY);
  };

  const label = zone
    ? zone.localityName
      ? `${zone.localityName}, ${zone.provinceName}`
      : zone.provinceName
    : "Comprar en mi zona";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-full transition-all ${
          compact
            ? "px-3 py-1.5 text-[12px]"
            : "px-3.5 py-2 text-[13px]"
        } border border-white/15 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white`}
        aria-expanded={open}
        aria-label="Elegir zona del marketplace"
      >
        <MapPin size={14} className="text-emerald-300 flex-shrink-0" />
        <span className="font-semibold truncate max-w-[200px]">{label}</span>
        {zone ? (
          <span onClick={clear} className="ml-0.5 rounded-full p-0.5 hover:bg-white/15" aria-label="Quitar zona">
            <X size={12} />
          </span>
        ) : (
          <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-[340px] max-w-[90vw] rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40 z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-700">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar provincia o localidad…"
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <div className="max-h-[340px] overflow-y-auto py-1">
            {matches.length === 0 ? (
              <p className="px-4 py-6 text-[12px] text-slate-400 text-center">
                Sin resultados para «{query}»
              </p>
            ) : (
              matches.map((m, i) =>
                m.type === "province" ? (
                  <button
                    key={`p-${m.provinceSlug}-${i}`}
                    type="button"
                    onClick={() =>
                      pick({ provinceSlug: m.provinceSlug, provinceName: m.provinceName })
                    }
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-[13px] text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  >
                    <MapPin size={13} className="text-emerald-400 flex-shrink-0" />
                    <span className="font-semibold">{m.provinceName}</span>
                    <span className="text-[11px] text-slate-500 ml-auto">Provincia</span>
                  </button>
                ) : (
                  <button
                    key={`l-${m.localitySlug}-${i}`}
                    type="button"
                    onClick={() =>
                      pick({
                        provinceSlug: m.provinceSlug,
                        provinceName: m.provinceName,
                        localitySlug: m.localitySlug,
                        localityName: m.localityName,
                      })
                    }
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-[13px] text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  >
                    <span className="ml-5">{m.localityName}</span>
                    <span className="text-[11px] text-slate-500 ml-auto">{m.provinceName}</span>
                  </button>
                )
              )
            )}
          </div>
          <Link
            href="/marketplace"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-center text-[12px] text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/60 border-t border-slate-700 font-semibold"
          >
            Ver todas las zonas del marketplace
          </Link>
        </div>
      )}
    </div>
  );
}
