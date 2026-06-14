"use client";

/**
 * Visual del hero de las landings de vendedores. Tarjetas de producto REALES
 * del catálogo flotando (tilt + float), una notificación de consulta y un chip
 * de stat honesto. Sin "dashboard fake" de divs. GPU-only, reduced-motion safe,
 * mobile degradado (sin float ni tilt en pantallas chicas).
 */

import { motion, useReducedMotion } from "motion/react";
import { MessageSquareText, BadgeCheck, TrendingUp } from "lucide-react";
import { TiltCard } from "./motion-primitives";

export type HeroProduct = { id: string; title: string; price: number; image: string | null };

const ars = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

function Float({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      animate={reduce ? undefined : { y: [0, -10, 0] }}
      transition={reduce ? undefined : { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {children}
    </motion.div>
  );
}

function ProductCard({ p, index }: { p: HeroProduct; index: number }) {
  return (
    <TiltCard className="w-[220px] rounded-2xl border border-white/10 bg-white/95 p-3 shadow-2xl shadow-blue-950/40 backdrop-blur">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.image}
            alt=""
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain p-2"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <BadgeCheck className="h-8 w-8" />
          </div>
        )}
      </div>
      <p className="mt-2.5 line-clamp-1 text-sm font-semibold text-slate-900">{p.title}</p>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-base font-black text-blue-700">{ars(p.price)}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          <BadgeCheck className="h-3 w-3" /> Envío
        </span>
      </div>
    </TiltCard>
  );
}

export function SellerHeroVisual({ products }: { products: HeroProduct[] }) {
  const reduce = useReducedMotion();
  const items = products.slice(0, 2);

  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[440px] select-none md:h-[460px]" aria-hidden="true">
      {/* halo eléctrico detrás del stack */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/20 blur-3xl" />

      {/* notificación de consulta */}
      <motion.div
        initial={reduce ? false : { opacity: 0, x: 20, y: -8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute right-0 top-2 z-20 flex items-center gap-2.5 rounded-xl border border-white/15 bg-slate-900/80 px-3 py-2 shadow-xl backdrop-blur"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
          <MessageSquareText className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-semibold text-white">Nueva consulta recibida</p>
          <p className="text-[11px] text-slate-400">de un comprador interesado</p>
        </div>
      </motion.div>

      {/* tarjeta de producto 1 */}
      {items[0] && (
        <Float delay={0} className="absolute left-0 top-16 z-10">
          <div className="-rotate-3">
            <ProductCard p={items[0]} index={0} />
          </div>
        </Float>
      )}

      {/* tarjeta de producto 2 */}
      {items[1] && (
        <Float delay={1.2} className="absolute bottom-16 right-2 z-10 hidden sm:block">
          <div className="rotate-3">
            <ProductCard p={items[1]} index={1} />
          </div>
        </Float>
      )}

      {/* chip de stat honesto */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-2 left-2 z-20 flex items-center gap-2.5 rounded-xl border border-white/15 bg-slate-900/80 px-3 py-2 shadow-xl backdrop-blur"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
          <TrendingUp className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-semibold text-white">0% comisión por venta</p>
          <p className="text-[11px] text-slate-400">durante la etapa beta</p>
        </div>
      </motion.div>
    </div>
  );
}
