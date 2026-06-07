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
    feature: "Comisión sobre tus ventas",
    madsjeez: { ok: true, label: "0% siempre. Te quedás con todo." },
    others: { ok: false, label: "Hasta 16% por venta" },
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
    madsjeez: { ok: true, label: "Cuotas que vos definís en tu MP" },
    others: { ok: true, label: "Sí, con condiciones del marketplace" },
  },
  {
    feature: "Métodos de pago",
    madsjeez: { ok: true, label: "Mercado Pago + PayPal + transferencia bancaria" },
    others: { ok: false, label: "Solo el método del marketplace" },
  },
  {
    feature: "Retiro del producto en el local",
    madsjeez: { ok: true, label: "Sin envío si el comprador va al local" },
    others: { ok: false, label: "Siempre cobra envío" },
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
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#3483FA] mb-3 dark:text-[#60a5fa]">
          Comparativa honesta
        </p>
        <h2
          id="vs-heading"
          className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[0.95] mb-4 dark:text-white"
        >
          Por qué <span className="text-[#3483FA] dark:text-[#60a5fa]">Madsjeez</span> gana
        </h2>
        <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed dark:text-slate-300">
          Comparamos punto por punto contra el marketplace más grande de Argentina. Sin trucos.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.06)] overflow-hidden dark:border-slate-700 dark:bg-slate-900">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] md:grid-cols-[1.6fr_1fr_1fr] bg-slate-50 border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
          <div className="px-4 md:px-6 py-4 text-[11px] md:text-[12px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
            Característica
          </div>
          <div className="px-3 md:px-6 py-4 text-center border-l border-slate-200 dark:border-slate-700">
            <div className="inline-flex items-center gap-1.5 text-[12px] md:text-[14px] font-black">
              <span className="text-slate-900 dark:text-white">MADS</span>
              <span className="text-[#3483FA] dark:text-[#60a5fa]">JEEZ</span>
            </div>
          </div>
          <div className="px-3 md:px-6 py-4 text-center border-l border-slate-200 dark:border-slate-700">
            <span className="text-[11px] md:text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
              Otros marketplaces
            </span>
          </div>
        </div>

        {rows.map((row, idx) => (
          <div
            key={row.feature}
            className={`grid grid-cols-[1.4fr_1fr_1fr] md:grid-cols-[1.6fr_1fr_1fr] ${
              idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-800/60"
            } ${idx !== rows.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""}`}
          >
            <div className="px-4 md:px-6 py-4 md:py-5 text-[13px] md:text-[15px] font-semibold text-slate-800 dark:text-white flex items-center">
              {row.feature}
            </div>
            <div className="px-3 md:px-6 py-4 md:py-5 border-l border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-1.5">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  row.madsjeez.ok
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300"
                }`}
                aria-hidden="true"
              >
                {row.madsjeez.ok ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  <X size={16} strokeWidth={3} />
                )}
              </span>
              <span className="text-[11px] md:text-[12.5px] font-semibold text-slate-700 leading-tight dark:text-slate-200">
                {row.madsjeez.label}
              </span>
            </div>
            <div className="px-3 md:px-6 py-4 md:py-5 border-l border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-1.5">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  row.others.ok
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300"
                }`}
                aria-hidden="true"
              >
                {row.others.ok ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  <X size={16} strokeWidth={3} />
                )}
              </span>
              <span className="text-[11px] md:text-[12.5px] font-medium text-slate-500 leading-tight dark:text-slate-400">
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
          className="inline-flex items-center gap-2 text-[14px] font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white py-3.5 px-5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
        >
          Ver la historia completa
        </Link>
      </div>
    </section>
  );
}
