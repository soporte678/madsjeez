"use client";

import Link from "next/link";
import { Package, ShoppingBag, Store, Truck, Users, Quote, Star } from "lucide-react";
import {
  FEATURED_SELLER,
  MARKETPLACE_STATS,
  TESTIMONIALS,
} from "@/lib/social-proof";

const statItems = [
  {
    icon: Package,
    value: MARKETPLACE_STATS.productsPublished,
    label: "Productos publicados",
  },
  {
    icon: Store,
    value: MARKETPLACE_STATS.sellers,
    label: "Vendedores activos",
  },
  {
    icon: Users,
    value: MARKETPLACE_STATS.buyers,
    label: "Compradores en la plataforma",
  },
  {
    icon: ShoppingBag,
    value: MARKETPLACE_STATS.ordersPerMonth,
    label: "Pedidos por mes (aprox.)",
  },
];

export function HomeSocialProof() {
  return (
    <section
      className="max-w-[1184px] mx-auto px-4 mb-14"
      aria-labelledby="social-proof-heading"
    >
      <div className="rounded-[28px] border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 shadow-[0_20px_50px_rgba(15,23,42,0.06)] overflow-hidden dark:border-slate-700/70 dark:from-slate-900 dark:to-slate-900">
        <div className="px-6 py-8 md:px-10 md:py-10 border-b border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f97316] mb-2 dark:text-orange-400">
            Marketplace en crecimiento · Lanzamiento {MARKETPLACE_STATS.launchYear}
          </p>
          <h2
            id="social-proof-heading"
            className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3 dark:text-white"
          >
            Comercios reales, operación activa
          </h2>
          <p className="text-slate-600 text-[15px] md:text-base max-w-3xl leading-relaxed dark:text-slate-300">
            MadsJeez concentra catálogo, pagos y logística para negocios argentinos que ya venden
            online — con métricas que reflejan uso real de la plataforma.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200/80 dark:bg-slate-800">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="bg-white px-5 py-8 flex flex-col items-center text-center dark:bg-slate-900"
            >
              <item.icon className="h-8 w-8 text-[#3483FA] mb-3 dark:text-[#60a5fa]" strokeWidth={1.5} />
              <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight dark:text-white">
                {item.value}
              </span>
              <span className="text-[12px] md:text-sm font-semibold text-slate-500 mt-2 dark:text-slate-400">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="px-6 py-6 md:px-10 bg-gradient-to-r from-emerald-50 to-cyan-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4 dark:from-emerald-500/10 dark:to-cyan-500/10 dark:border-slate-800">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300">
            <Truck className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-black text-slate-900 text-lg dark:text-white">
              {MARKETPLACE_STATS.shippingHighlight}
            </p>
            <p className="text-sm text-slate-600 mt-1 dark:text-slate-300">{MARKETPLACE_STATS.shippingDetail}</p>
          </div>
          <Link
            href="/search"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#3483FA] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2968c8] transition-colors"
          >
            Ver productos
          </Link>
        </div>

        <div className="px-6 py-8 md:px-10 border-b border-slate-100 bg-[#0f172a] text-white">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f97316] to-[#ff9100] font-black text-xl">
              MQ
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300 mb-1">
                {FEATURED_SELLER.category}
              </p>
              <h3 className="text-2xl font-black">{FEATURED_SELLER.name}</h3>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed max-w-2xl">
                {FEATURED_SELLER.description}
              </p>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold hover:bg-white/10 transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
        </div>

        <div className="p-6 md:p-10">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 dark:text-white">
            <Quote className="h-5 w-5 text-[#f97316]" />
            Lo que dicen vendedores y compradores
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <blockquote
                key={`${t.author}-${t.role}`}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-[#3483FA]/25 transition-colors dark:border-slate-700 dark:bg-slate-800/80"
              >
                <div className="flex gap-0.5 mb-3 text-amber-400" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-[14px] text-slate-700 leading-relaxed mb-4 dark:text-slate-200">&ldquo;{t.quote}&rdquo;</p>
                <footer>
                  <cite className="not-italic font-bold text-slate-900 text-sm dark:text-white">{t.author}</cite>
                  <p className="text-[12px] text-slate-500 mt-0.5 dark:text-slate-400">
                    {t.role}
                    {t.location ? ` · ${t.location}` : ""}
                  </p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
