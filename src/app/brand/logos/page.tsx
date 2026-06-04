import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LOGO_OPTIONS } from "@/components/brand/logos/LogoOptions";

export const metadata: Metadata = {
  title: "Logo options · MadsJeez Brand",
  description: "Opciones de rediseño de identidad para MadsJeez Marketplace.",
  robots: { index: false, follow: false },
};

export default function LogoOptionsPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-slate-900 font-outfit">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-stone-50/80 border-b border-stone-200">
        <div className="max-w-[1200px] mx-auto px-6 py-5 flex items-center justify-between">
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            Volver
          </Link>
          <span className="text-[11px] uppercase tracking-[0.22em] font-bold text-slate-500">
            Brand · 8 directions
          </span>
        </div>
      </header>

      {/* Intro editorial */}
      <section className="max-w-[1200px] mx-auto px-6 pt-16 pb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500 mb-4">
          Logo del marketplace
        </p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.02] max-w-[20ch]">
          Ocho direcciones para la marca, una identidad por elegir.
        </h1>
        <p className="mt-5 text-base text-slate-600 leading-relaxed max-w-[55ch]">
          El logo actual usa una paleta arcoíris que comunica energía pero diluye
          autoría. Acá hay 8 alternativas con criterios distintos. Cada una pensada
          para escalar a favicon, app icon, header oscuro y embalaje. Pickeá la
          que mejor diga lo que queremos ser.
        </p>
      </section>

      {/* Grid de logos */}
      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        <ul className="grid grid-cols-1 gap-6">
          {LOGO_OPTIONS.map((opt, i) => {
            const Comp = opt.Component;
            return (
              <li
                key={opt.id}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_18px_50px_-30px_rgba(15,23,42,0.18)]"
              >
                {/* Meta strip */}
                <div className="flex flex-wrap items-baseline justify-between gap-3 px-6 pt-6">
                  <div className="flex items-baseline gap-3">
                    <span className="font-black text-slate-300 text-[42px] leading-none tabular-nums tracking-tighter">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h2 className="text-xl font-black tracking-tight leading-tight">
                        {opt.name}
                      </h2>
                      <p className="text-[12.5px] text-slate-500 mt-0.5">
                        {opt.family}
                      </p>
                    </div>
                  </div>
                  <p className="text-[13px] text-slate-600 italic max-w-[34ch]">
                    {opt.vibe}
                  </p>
                </div>

                {/* Light render */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 border-t border-stone-200">
                  <div className="px-8 py-14 flex items-center justify-center bg-stone-50 border-r border-stone-200">
                    <Comp isDark={false} />
                  </div>
                  <div className="px-8 py-14 flex items-center justify-center bg-slate-950">
                    <Comp isDark={true} />
                  </div>
                </div>

                {/* Scale preview row */}
                <div className="grid grid-cols-3 border-t border-stone-200 bg-white">
                  <div className="px-6 py-5 flex items-center justify-center border-r border-stone-200">
                    <Comp isDark={false} scale={0.45} />
                  </div>
                  <div className="px-6 py-5 flex items-center justify-center border-r border-stone-200">
                    <Comp isDark={false} scale={0.7} />
                  </div>
                  <div className="px-6 py-5 flex items-center justify-center">
                    <Comp isDark={false} scale={1} />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 flex items-center justify-between border-t border-stone-200 bg-stone-50 text-[12px]">
                  <span className="font-mono uppercase text-slate-400 tracking-[0.18em]">
                    {opt.id}
                  </span>
                  <span className="text-slate-600">
                    Escala probada · light · dark
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Footer decisional */}
      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        <div className="rounded-3xl bg-slate-900 text-white p-10 md:p-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-yellow-300 mb-4">
            Próximo paso
          </p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            ¿Cuál de las 8 te dice más Madsjeez?
          </h2>
          <p className="mt-4 text-[14px] text-white/70 leading-relaxed max-w-[55ch]">
            Una vez elegida, la aplico en navbar, favicon, OG image, manifest PWA
            y email templates. Cada opción ya está pensada para esos formatos.
            Si querés combinar elementos de dos (ej: monograma de la 02 + wordmark
            de la 01), también es válido. Decime el número y avanzamos.
          </p>
        </div>
      </section>
    </main>
  );
}
