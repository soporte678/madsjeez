"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";

type Variant = "leaderboard" | "rectangle" | "tile";

type PaidAdBannerSlotProps = {
  variant?: Variant;
  className?: string;
  /** Índice demo para rotar levemente el estilo visual entre slots */
  demoIndex?: number;
};

/** Gradientes más marcados para que el demo no se pierda sobre fondos claros */
const gradients = [
  "from-sky-100 via-blue-50 to-indigo-100",
  "from-amber-100 via-orange-50 to-rose-100",
  "from-emerald-100 via-teal-50 to-cyan-100",
  "from-violet-100 via-purple-50 to-fuchsia-100",
];

/**
 * Espacio reservado para publicidad paga. Demo: “Publicitá aquí” + marca MADSJEEZ.
 * En producción se reemplaza por creatividades reales o un componente dinámico por slotId.
 */
export function PaidAdBannerSlot({
  variant = "leaderboard",
  demoIndex = 0,
  className = "",
}: PaidAdBannerSlotProps) {
  const bg = gradients[demoIndex % gradients.length];

  const sizeClasses =
    variant === "leaderboard"
      ? "min-h-[88px] md:min-h-[100px] py-4 px-5 md:px-8"
      : variant === "rectangle"
        ? "min-h-[140px] md:min-h-[160px] py-6 px-6"
        : "min-h-[136px] py-4 px-4";

  const isTile = variant === "tile";

  return (
    <aside
      className={`relative overflow-hidden rounded-xl border-[3px] border-dashed border-[#3483FA]/70 bg-gradient-to-br ${bg} shadow-[0_8px_30px_rgba(52,131,250,0.18)] ring-2 ring-[#3483FA]/20 ${sizeClasses} ${className}`}
      aria-label="Espacio publicitario disponible — demo MADSJEEZ Ads"
      data-mj-slot="paid-ad-demo"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#3483FA] via-[#ff9100] to-[#3483FA]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            #3483FA 0,
            #3483FA 1px,
            transparent 1px,
            transparent 12px
          )`,
        }}
      />
      {isTile ? (
        <div className="relative flex h-full flex-col items-center justify-between gap-3 px-1 pt-3 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-[#3483FA]" strokeWidth={2.2} aria-hidden />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#2968c8]">
              Tu marca puede estar aquí
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600 mt-1">Publicitá aquí</p>
            <p className="font-montserrat mt-1.5 text-lg font-black uppercase tracking-tighter text-slate-900">
              MADS<span className="text-[#3483FA]">JEEZ</span>
              <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-700 mt-0.5">
                Ads
              </span>
            </p>
            <span className="mt-2 inline-block rounded-full bg-[#3483FA] px-2.5 py-1 text-[9px] font-black uppercase text-white shadow-sm">
              Demo visible · Espacio en venta
            </span>
          </div>
          <Link
            href="/dashboard#publicidad"
            className="w-full rounded-lg bg-[#3483FA] py-2 text-center text-xs font-bold text-white shadow-sm transition hover:bg-[#2968c8]"
          >
            Contratar
          </Link>
        </div>
      ) : (
        <div className="relative flex flex-col gap-3 px-1 pb-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#3483FA] text-white shadow-md ring-2 ring-white">
              <Megaphone className="h-6 w-6" strokeWidth={2.2} aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#2968c8]">
                MADSJEEZ Ads · Espacio para tu marca
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                Publicidad paga en el marketplace
              </p>
              <p className="mt-1.5 text-xl font-black tracking-tight text-slate-900 md:text-2xl">
                Publicitá aquí
              </p>
              <p className="mt-2 max-w-lg text-sm leading-snug text-slate-700 font-medium">
                Este bloque es un <strong className="text-slate-900">demo</strong>: vendedores u otros anunciantes pueden{" "}
                <strong className="text-slate-900">comprar este espacio</strong> para promocionar productos o la marca.
                Coordinación comercial MADSJEEZ.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="font-montserrat text-sm font-black uppercase tracking-tighter text-slate-800 md:text-base">
                  MADS<span className="text-[#3483FA]">JEEZ</span>
                </span>
                <span className="rounded-full bg-[#3483FA]/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#2968c8] ring-1 ring-[#3483FA]/40">
                  Demo — lugar en venta
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            <Link
              href="/dashboard#publicidad"
              className="inline-flex items-center justify-center rounded-lg bg-[#3483FA] px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#2968c8]"
            >
              Contratar espacio
            </Link>
            <Link
              href="/help#contacto"
              className="text-xs font-semibold text-[#3483FA] underline-offset-2 hover:underline"
            >
              Consultá tarifas
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
