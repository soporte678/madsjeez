import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FINISH_VARIANTS } from "@/components/brand/logos/FinishVariants";

export const metadata: Metadata = {
  title: "Acabados del mark · Madsjeez",
  description: "7 acabados del mismo mark Madsjeez para distintos contextos.",
  robots: { index: false, follow: false },
};

export default function FinishesPage() {
  return (
    <main className="min-h-screen bg-[#fafaf7] text-[#0b0f1a] font-outfit">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#fafaf7]/85 border-b border-[#0b0f1a]/8">
        <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/brand/logos"
            prefetch={false}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0b0f1a]/70 hover:text-[#0b0f1a]"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Volver a propuestas
          </Link>
          <div className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#0b0f1a]/50">
            7 acabados · 1 mark
          </div>
        </div>
      </header>

      <section className="max-w-[1280px] mx-auto px-6 pt-24 pb-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#0b0f1a]/55 mb-6">
          Finishes del mark canónico
        </p>
        <h1 className="text-[44px] md:text-[72px] font-black tracking-[-0.04em] leading-[0.95] max-w-[20ch]">
          La misma marca,
          <br />
          siete materiales.
        </h1>
        <p className="mt-6 max-w-[58ch] text-[15px] text-[#0b0f1a]/70 leading-relaxed">
          El mark geométrico de Madsjeez es uno solo: ribbons plegados formando
          una M con shelf J integrada. Pero según el contexto, el material
          cambia. Estos son los 7 acabados aprobados.
        </p>
      </section>

      <section className="max-w-[1280px] mx-auto px-6 pb-24">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FINISH_VARIANTS.map((v, i) => {
            const C = v.Component;
            const showcaseDark = v.background !== "light";
            return (
              <li
                key={v.id}
                className="rounded-2xl border border-[#0b0f1a]/10 bg-white overflow-hidden shadow-[0_18px_50px_-30px_rgba(11,15,26,0.18)]"
              >
                <div className="px-6 pt-6 pb-3 flex items-baseline justify-between">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-black text-[28px] leading-none tabular-nums text-[#0b0f1a]/20">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h2 className="text-[22px] font-black tracking-tight">{v.name}</h2>
                    </div>
                    <p className="mt-2 text-[12.5px] text-[#0b0f1a]/60 leading-snug max-w-[36ch]">
                      {v.context}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0b0f1a]/45 font-mono">
                    {v.id}
                  </span>
                </div>

                <div
                  className="aspect-square flex items-center justify-center border-t border-[#0b0f1a]/10"
                  style={{
                    background: showcaseDark
                      ? "radial-gradient(circle at 50% 40%, #1e293b 0%, #020617 100%)"
                      : "linear-gradient(to bottom, #fafafa, #f1f5f9)",
                  }}
                >
                  <C size={220} />
                </div>

                <div className="grid grid-cols-4 border-t border-[#0b0f1a]/10">
                  <div
                    className="flex items-center justify-center py-4"
                    style={{ background: showcaseDark ? "#020617" : "#fafafa" }}
                  >
                    <C size={20} />
                  </div>
                  <div
                    className="flex items-center justify-center py-4 border-l border-[#0b0f1a]/10"
                    style={{ background: showcaseDark ? "#020617" : "#fafafa" }}
                  >
                    <C size={32} />
                  </div>
                  <div
                    className="flex items-center justify-center py-4 border-l border-[#0b0f1a]/10"
                    style={{ background: showcaseDark ? "#020617" : "#fafafa" }}
                  >
                    <C size={56} />
                  </div>
                  <div
                    className="flex items-center justify-center py-4 border-l border-[#0b0f1a]/10"
                    style={{ background: showcaseDark ? "#020617" : "#fafafa" }}
                  >
                    <C size={80} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bg-[#0b0f1a] text-white">
        <div className="max-w-[1280px] mx-auto px-6 py-20">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#facc15] mb-5">
            Default canonico
          </p>
          <h2 className="text-[32px] md:text-[48px] font-black tracking-[-0.03em] leading-[0.95] max-w-[24ch]">
            El blue gradient es el que vive en el marketplace.
          </h2>
          <p className="mt-6 max-w-[58ch] text-[14.5px] text-white/70 leading-relaxed">
            Navbar, favicon, OG image, manifest PWA, emails. Los otros 6
            acabados son para usos específicos. Si querés cambiar el default,
            decime cuál y cambio el blue por el que elijas en una sola tanda.
          </p>
        </div>
      </section>
    </main>
  );
}
