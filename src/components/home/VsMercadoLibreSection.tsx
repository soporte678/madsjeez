"use client";

/**
 * Por qué Madsjeez vs el resto - comparativa visual honesta.
 * Layout: tabla limpia con filas alternadas, NO 3-columnas idénticas.
 * Brand: azul ML #3483FA + amarillo MJ + slate-950.
 */

import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";

const rows = [
  {
    feature: "Comisión para Sellers Fundadores",
    madsjeez: { ok: true, label: "0% los primeros 6 meses" },
    others: { ok: false, label: "Hasta 16% desde día uno" },
  },
  {
    feature: "Soporte humano en Argentina",
    madsjeez: { ok: true, label: "WhatsApp directo con el equipo" },
    others: { ok: false, label: "Tickets y respuestas automáticas" },
  },
  {
    feature: "Badge Fundador permanente",
    madsjeez: { ok: true, label: "Visible en tu tienda para siempre" },
    others: { ok: false, label: "No existe" },
  },
  {
    feature: "Cobros con Mercado Pago",
    madsjeez: { ok: true, label: "Hasta 18 cuotas, integración nativa" },
    others: { ok: true, label: "Sí, con condiciones del marketplace" },
  },
  {
    feature: "Marketing IA incluido",
    madsjeez: { ok: true, label: "Posts, banners y SEO automáticos" },
    others: { ok: false, label: "Pagás aparte cada herramienta" },
  },
  {
    feature: "Retiro de dinero",
    madsjeez: { ok: true, label: "Hasta 24 hs en Plan Platinum" },
    others: { ok: false, label: "14 días promedio" },
  },
  {
    feature: "Exposición en el home",
    madsjeez: { ok: true, label: "Rotación equitativa por categoría" },
    others: { ok: false, label: "Solo pagando publicidad" },
  },
];

export function VsMercadoLibreSection() {
  return (
    <section
      className="max-w-[1184px] mx-auto px-4 mb-20"
      aria-labelledby="vs-heading"
    >
      <div className="text-center mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#3483FA] mb-3">
          Comparativa honesta
        </p>
        <h2
          id="vs-heading"
          className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[0.95] mb-4"
        >
          Por qué <span className="text-[#3483FA]">Madsjeez</span> gana
        </h2>
        <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Comparamos punto por punto contra el marketplace más grande de Argentina. Sin trucos.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.06)] overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] md:grid-cols-[1.6fr_1fr_1fr] bg-slate-50 border-b border-slate-200">
          <div className="px-4 md:px-6 py-4 text-[11px] md:text-[12px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Característica
          </div>
          <div className="px-3 md:px-6 py-4 text-center border-l border-slate-200">
            <div className="inline-flex items-center gap-1.5 text-[12px] md:text-[14px] font-black">
              <span className="text-slate-900">MADS</span>
              <span className="text-[#3483FA]">JEEZ</span>
            </div>
          </div>
          <div className="px-3 md:px-6 py-4 text-center border-l border-slate-200">
            <span className="text-[11px] md:text-[13px] font-bold uppercase tracking-wider text-slate-500">
              Otros marketplaces
            </span>
          </div>
        </div>

        {rows.map((row, idx) => (
          <div
            key={row.feature}
            className={`grid grid-cols-[1.4fr_1fr_1fr] md:grid-cols-[1.6fr_1fr_1fr] ${
              idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
            } ${idx !== rows.length - 1 ? "border-b border-slate-100" : ""}`}
          >
            <div className="px-4 md:px-6 py-4 md:py-5 text-[13px] md:text-[15px] font-semibold text-slate-800 flex items-center">
              {row.feature}
            </div>
            <div className="px-3 md:px-6 py-4 md:py-5 border-l border-slate-100 flex flex-col items-center text-center gap-1.5">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  row.madsjeez.ok
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-rose-100 text-rose-600"
                }`}
                aria-hidden="true"
              >
                {row.madsjeez.ok ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  <X size={16} strokeWidth={3} />
                )}
              </span>
              <span className="text-[11px] md:text-[12.5px] font-semibold text-slate-700 leading-tight">
                {row.madsjeez.label}
              </span>
            </div>
            <div className="px-3 md:px-6 py-4 md:py-5 border-l border-slate-100 flex flex-col items-center text-center gap-1.5">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  row.others.ok
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-rose-100 text-rose-600"
                }`}
                aria-hidden="true"
              >
                {row.others.ok ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  <X size={16} strokeWidth={3} />
                )}
              </span>
              <span className="text-[11px] md:text-[12.5px] font-medium text-slate-500 leading-tight">
                {row.others.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Link
          href="/seller/register"
          prefetch={false}
          className="inline-flex items-center gap-2 bg-[#3483FA] hover:bg-[#1f6fe5] text-white font-bold text-[14px] py-3.5 px-7 rounded-xl shadow-[0_8px_24px_rgba(52,131,250,0.35)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3483FA]"
        >
          Quiero ser Fundador
          <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
        <Link
          href="/quienes-somos"
          prefetch={false}
          className="inline-flex items-center gap-2 text-[14px] font-bold text-slate-700 hover:text-slate-900 py-3.5 px-5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
        >
          Ver la historia completa
        </Link>
      </div>
    </section>
  );
}
