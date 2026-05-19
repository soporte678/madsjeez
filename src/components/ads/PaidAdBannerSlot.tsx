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

/** Gradientes más ricos para sostener el slot sobre superficies dark y light */
const gradients = [
  "from-[#0f172a] via-[#14213d] to-[#172554]",
  "from-[#1f2937] via-[#172033] to-[#312e81]",
  "from-[#0f172a] via-[#11263d] to-[#0f766e]",
  "from-[#1e1b4b] via-[#1f2937] to-[#3b0764]",
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
      className={`relative overflow-hidden rounded-[24px] border border-white/12 bg-gradient-to-br ${bg} shadow-[0_18px_48px_rgba(2,6,23,0.30)] ring-1 ring-white/8 ${sizeClasses} ${className}`}
      aria-label="Espacio publicitario disponible - demo MADSJEEZ Ads"
      data-mj-slot="paid-ad-demo"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#60a5fa] via-[#fb923c] to-[#22d3ee]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.11]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            rgba(148, 163, 184, 0.45) 0,
            rgba(148, 163, 184, 0.45) 1px,
            transparent 1px,
            transparent 14px
          )`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-80"
        style={{
          background:
            "radial-gradient(circle at right center, rgba(59,130,246,0.22), transparent 58%)",
        }}
      />
      {isTile ? (
        <div className="relative flex h-full flex-col items-center justify-between gap-3 px-1 pt-3 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-[#7dd3fc]" strokeWidth={2.2} aria-hidden />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-sky-300">
              Tu marca puede estar aqui
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Publicita aqui</p>
            <p className="font-montserrat mt-1.5 text-lg font-black uppercase tracking-tighter text-white">
              MADS<span className="text-[#3483FA]">JEEZ</span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wide text-slate-300">
                Ads
              </span>
            </p>
            <span className="mt-2 inline-block rounded-full border border-sky-400/30 bg-sky-400/15 px-2.5 py-1 text-[9px] font-black uppercase text-sky-100 shadow-sm">
              Demo visible - Espacio en venta
            </span>
          </div>
          <Link
            href="/dashboard#publicidad"
            className="w-full rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#2563eb] py-2 text-center text-xs font-bold text-white shadow-lg shadow-sky-900/30 transition hover:from-[#2563eb] hover:to-[#1d4ed8]"
          >
            Contratar
          </Link>
        </div>
      ) : (
        <div className="relative flex flex-col gap-3 px-1 pb-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white shadow-[0_12px_25px_rgba(37,99,235,0.30)]">
              <Megaphone className="h-6 w-6" strokeWidth={2.2} aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-300">
                MADSJEEZ Ads - Espacio para tu marca
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Publicidad paga en el marketplace
              </p>
              <p className="mt-1.5 text-xl font-black tracking-tight text-white md:text-2xl">
                Publicita aqui
              </p>
              <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-slate-200">
                Este bloque es un <strong className="text-white">demo funcional</strong>: vendedores u otros anunciantes pueden{" "}
                <strong className="text-white">comprar este espacio</strong> para promocionar productos, lanzamientos o la marca dentro del marketplace.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="font-montserrat text-sm font-black uppercase tracking-tighter text-white md:text-base">
                  MADS<span className="text-[#3483FA]">JEEZ</span>
                </span>
                <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-sky-100">
                  Demo - Lugar en venta
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            <Link
              href="/dashboard#publicidad"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#2563eb] px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition hover:from-[#2563eb] hover:to-[#1d4ed8]"
            >
              Contratar espacio
            </Link>
            <Link
              href="/help#contacto"
              className="text-xs font-semibold text-sky-200 underline-offset-2 hover:text-white hover:underline"
            >
              Consulta tarifas
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
