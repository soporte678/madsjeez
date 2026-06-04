import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { SIGNATURE_MARKS } from "@/components/brand/logos/SignatureMarks";

export const metadata: Metadata = {
  title: "Identidad · Madsjeez Marketplace",
  description:
    "Seis direcciones de marca para Madsjeez. Cada una un concepto, no un truco de color.",
  robots: { index: false, follow: false },
};

export default function LogoOptionsPage() {
  return (
    <main className="min-h-screen bg-[#fafaf7] text-[#0b0f1a] font-outfit">
      {/* HEADER */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#fafaf7]/85 border-b border-[#0b0f1a]/8">
        <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0b0f1a]/70 hover:text-[#0b0f1a] transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Volver al sitio
          </Link>
          <div className="flex items-baseline gap-3 text-[10px] font-bold uppercase tracking-[0.32em] text-[#0b0f1a]/50">
            <span>Identidad</span>
            <span>·</span>
            <span>06 propuestas</span>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="max-w-[1280px] mx-auto px-6 pt-24 pb-20">
          <div className="grid grid-cols-12 gap-8 items-end">
            <div className="col-span-12 md:col-span-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#0b0f1a]/55 mb-6">
                Brand exploration · 2026
              </p>
              <h1 className="text-[44px] md:text-[78px] font-black tracking-[-0.04em] leading-[0.92]">
                Seis maneras de
                <br />
                ser madsjeez.
              </h1>
            </div>
            <div className="col-span-12 md:col-span-4 md:pb-3">
              <p className="text-[14px] text-[#0b0f1a]/70 leading-relaxed">
                Cada propuesta nace de una idea sobre qué es un marketplace. No
                son variaciones tipográficas del mismo wordmark. Son seis marcas
                distintas, cada una construida desde su propio concepto. Pickeá
                la que diga lo que querés que diga.
              </p>
            </div>
          </div>

          {/* Nav anchor */}
          <div className="mt-16 flex items-center gap-2 text-[12px] font-semibold text-[#0b0f1a]/60">
            <ChevronDown size={14} className="animate-bounce" />
            <span>Explorá las seis</span>
          </div>
        </div>
      </section>

      {/* GALERÍA */}
      <section className="border-t border-[#0b0f1a]/8">
        {SIGNATURE_MARKS.map((opt, idx) => {
          const { Mark, Lockup } = opt;
          const isOdd = idx % 2 === 1;
          return (
            <article
              key={opt.id}
              id={opt.id}
              className={`border-b border-[#0b0f1a]/8 ${
                isOdd ? "bg-white" : "bg-[#fafaf7]"
              }`}
            >
              <div className="max-w-[1280px] mx-auto px-6 py-20 md:py-28">
                {/* Strip */}
                <div className="grid grid-cols-12 gap-6 items-baseline mb-14">
                  <div className="col-span-12 md:col-span-1">
                    <span className="font-black text-[40px] leading-none tabular-nums tracking-tighter text-[#0b0f1a]/15">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-5">
                    <h2 className="text-[36px] md:text-[44px] font-black tracking-tight leading-[1]">
                      {opt.name}
                    </h2>
                    <p className="mt-2 text-[12px] uppercase tracking-[0.22em] font-bold text-[#0b0f1a]/45">
                      Concept · {opt.id}
                    </p>
                  </div>
                  <div className="col-span-12 md:col-span-6 space-y-3">
                    <p className="text-[15px] leading-relaxed text-[#0b0f1a]/85">
                      {opt.concept}
                    </p>
                    <p className="text-[12.5px] italic text-[#0b0f1a]/55 leading-relaxed">
                      Inspiración: {opt.inspiration}
                    </p>
                  </div>
                </div>

                {/* Showcase principal: light + dark */}
                <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden border border-[#0b0f1a]/10 shadow-[0_24px_60px_-30px_rgba(11,15,26,0.18)]">
                  {/* Light */}
                  <div className="relative bg-[#fafaf7] aspect-[5/3] flex items-center justify-center">
                    <div className="absolute top-4 left-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#0b0f1a]/45">
                      Light
                    </div>
                    {opt.layout === "vertical" ? (
                      <Lockup size={86} ink="#0b0f1a" />
                    ) : (
                      <Lockup size={64} ink="#0b0f1a" accent="#facc15" />
                    )}
                  </div>
                  {/* Dark */}
                  <div className="relative bg-[#0b0f1a] aspect-[5/3] flex items-center justify-center">
                    <div className="absolute top-4 left-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                      Dark
                    </div>
                    {opt.layout === "vertical" ? (
                      <Lockup size={86} ink="#fafaf7" />
                    ) : (
                      <Lockup size={64} ink="#fafaf7" accent="#facc15" />
                    )}
                  </div>
                </div>

                {/* Construcción y escalas */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
                  {/* Construcción */}
                  <div className="md:col-span-5 rounded-2xl border border-[#0b0f1a]/10 bg-white p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#0b0f1a]/45 mb-4">
                      Construcción · grilla 100×100
                    </p>
                    <div className="flex items-center justify-center bg-[#fafaf7] rounded-xl aspect-square relative">
                      {/* Grilla */}
                      <svg
                        viewBox="0 0 100 100"
                        className="absolute inset-0 w-full h-full text-[#0b0f1a]/10"
                        aria-hidden
                      >
                        <defs>
                          <pattern
                            id={`grid-${opt.id}`}
                            x="0"
                            y="0"
                            width="10"
                            height="10"
                            patternUnits="userSpaceOnUse"
                          >
                            <path
                              d="M 10 0 L 0 0 0 10"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="0.4"
                            />
                          </pattern>
                        </defs>
                        <rect
                          width="100"
                          height="100"
                          fill={`url(#grid-${opt.id})`}
                        />
                        <line
                          x1="50"
                          y1="0"
                          x2="50"
                          y2="100"
                          stroke="currentColor"
                          strokeWidth="0.5"
                          strokeDasharray="2 2"
                        />
                        <line
                          x1="0"
                          y1="50"
                          x2="100"
                          y2="50"
                          stroke="currentColor"
                          strokeWidth="0.5"
                          strokeDasharray="2 2"
                        />
                      </svg>
                      <Mark size={180} ink="#0b0f1a" accent="#facc15" />
                    </div>
                  </div>

                  {/* Escalas — favicon → mark → lockup */}
                  <div className="md:col-span-7 rounded-2xl border border-[#0b0f1a]/10 bg-white p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#0b0f1a]/45 mb-4">
                      Funciona en todas las escalas
                    </p>
                    <div className="grid grid-cols-4 gap-3 items-center">
                      {/* Favicon */}
                      <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#fafaf7]">
                        <Mark size={20} ink="#0b0f1a" accent="#facc15" />
                        <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#0b0f1a]/50">
                          16
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#fafaf7]">
                        <Mark size={32} ink="#0b0f1a" accent="#facc15" />
                        <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#0b0f1a]/50">
                          32
                        </span>
                      </div>
                      {/* App icon */}
                      <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#0b0f1a]">
                        <div className="w-16 h-16 rounded-2xl bg-[#facc15] flex items-center justify-center">
                          <Mark size={42} ink="#0b0f1a" accent="#0b0f1a" />
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-white/70">
                          App icon
                        </span>
                      </div>
                      {/* Round social */}
                      <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#fafaf7]">
                        <div className="w-16 h-16 rounded-full bg-[#0b0f1a] flex items-center justify-center">
                          <Mark size={42} ink="#facc15" accent="#facc15" />
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#0b0f1a]/50">
                          Avatar
                        </span>
                      </div>
                    </div>

                    {/* Inline en frase */}
                    <div className="mt-5 rounded-lg bg-[#fafaf7] p-4">
                      <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#0b0f1a]/45 mb-2">
                        En contexto
                      </p>
                      <p className="text-[14.5px] leading-relaxed text-[#0b0f1a]/85">
                        Bienvenido a&nbsp;
                        <span className="inline-flex items-baseline align-baseline">
                          <Lockup size={28} ink="#0b0f1a" accent="#facc15" />
                        </span>
                        , el marketplace donde encontrás lo que buscás.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* CIERRE */}
      <section className="bg-[#0b0f1a] text-white">
        <div className="max-w-[1280px] mx-auto px-6 py-24">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#facc15] mb-5">
                Próximo paso
              </p>
              <h2 className="text-[36px] md:text-[52px] font-black tracking-[-0.03em] leading-[0.95]">
                ¿Cuál es Madsjeez?
              </h2>
            </div>
            <div className="col-span-12 md:col-span-5 md:pt-6">
              <p className="text-[14.5px] text-white/70 leading-relaxed">
                Una vez elegida, la implemento en navbar, favicon, OG image,
                manifest PWA, icon set completo (16, 32, 192, 512, maskable),
                email templates y wordmark del footer. Si querés combinar el
                mark de una con el lockup de otra, también es válido.
              </p>
              <p className="text-[14.5px] text-white/70 leading-relaxed mt-4">
                Decime el número (o nombre) y avanzo en la misma sesión.
              </p>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-6 gap-3">
            {SIGNATURE_MARKS.map((opt, i) => (
              <a
                key={opt.id}
                href={`#${opt.id}`}
                className="group rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 p-4 transition-colors flex flex-col items-center gap-3"
              >
                <opt.Mark size={48} ink="#fafaf7" accent="#facc15" />
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="text-[13px] font-bold tracking-tight mt-1">
                    {opt.name}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
