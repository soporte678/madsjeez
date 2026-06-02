import type { Metadata } from 'next';
import Link from 'next/link';
import { TUTORIALES } from '@/data/tutoriales';
import { TutorialIcon } from '@/components/tutoriales/TutorialIcon';
import { TutorialHero } from '@/components/tutoriales/MediaPlaceholder';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Estilos de tutoriales · A/B testing | MadsJeez',
  description:
    'Comparativa de 4 estilos visuales para el hero de tutoriales: Photoreal, Isometric, Claymorphism y Editorial Dark.',
  robots: { index: false, follow: false },
};

const VARIANTS = [
  {
    key: 'a' as const,
    name: 'Photoreal 3D',
    vibe: 'Apple-product / e-commerce premium',
    notes:
      'Slate-900 con caja 3D realista, etiqueta de envío con barcode, rim light amarillo. Para audiencia que quiere "verlo serio".',
  },
  {
    key: 'b' as const,
    name: 'Isometric',
    vibe: 'Notion / Stripe illustration',
    notes:
      'Fondo claro, proyección 30°, marca ML #3483FA + acentos MJ. Friendly y técnico. Bueno para sellers nuevos.',
  },
  {
    key: 'c' as const,
    name: 'Claymorphism',
    vibe: 'Linear empty-state / soft UI',
    notes:
      'Beige cálido, formas blancas con sombras suaves enormes, single accent dot. Aire, calma, premium silencioso.',
  },
  {
    key: 'd' as const,
    name: 'Editorial Dark',
    vibe: 'Awwwards / Vercel landing',
    notes:
      'Slate-950 con grain, número monumental "06", rim light lateral. Drama editorial. Para taste alto / tech.',
  },
];

export default function EstilosPage() {
  // Usamos un tutorial real como muestra (el primero de la lista)
  const sample = TUTORIALES[0];
  if (!sample) return null;

  return (
    <main className="min-h-screen bg-slate-50 font-outfit text-slate-900">
      <section className="max-w-[1200px] mx-auto px-4 pt-10 pb-6">
        <Link
          href="/tutoriales"
          prefetch={false}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Volver a tutoriales
        </Link>

        <div className="mt-6 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#3483FA] mb-2">
            A/B testing · Hero tutoriales
          </p>
          <h1 className="text-3xl md:text-[2.5rem] font-black tracking-tight leading-[1.05]">
            4 estilos visuales. <span className="text-slate-500">Elegimos según data, no gusto.</span>
          </h1>
          <p className="mt-4 text-[14.5px] text-slate-600 leading-relaxed">
            Misma data, 4 ejecuciones distintas. Cada variante apunta a una
            audiencia diferente. Compartí el link con sellers reales, mirá cuál
            convierte mejor a click en CTA, y esa es la ganadora. Cada hero es
            accesible vía <code className="text-[12.5px] bg-slate-100 px-1.5 py-0.5 rounded">?style=a|b|c|d</code> en cualquier tutorial.
          </p>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-4 pb-24 space-y-14">
        {VARIANTS.map((v) => (
          <article
            key={v.key}
            className="rounded-[28px] bg-white border border-slate-200 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_18px_50px_-30px_rgba(15,23,42,0.18)] p-5 md:p-7"
          >
            <header className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Variante {v.key.toUpperCase()}
                </p>
                <h2 className="mt-1 text-2xl md:text-[1.75rem] font-black tracking-tight">
                  {v.name}
                </h2>
                <p className="text-[12.5px] text-slate-500 italic">{v.vibe}</p>
              </div>
              <Link
                href={`/tutoriales/${sample.slug}?style=${v.key}`}
                prefetch={false}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-[12.5px] font-bold px-4 py-2.5 transition-colors"
              >
                Ver en tutorial completo
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </header>

            <TutorialHero
              title={sample.title}
              hint={sample.subtitle}
              icon={<TutorialIcon name={sample.icon} size={64} className="opacity-95" />}
              variant={v.key}
            />

            <p className="mt-5 text-[13.5px] text-slate-600 leading-relaxed max-w-[68ch]">
              {v.notes}
            </p>
          </article>
        ))}

        <div className="rounded-3xl bg-slate-900 text-white p-8 md:p-10">
          <h3 className="text-xl md:text-2xl font-black tracking-tight">
            Cómo decidimos cuál queda
          </h3>
          <ul className="mt-3 text-[13.5px] text-white/75 leading-relaxed space-y-1.5">
            <li>· CTR en CTA "Te llevamos directo" de cada tutorial.</li>
            <li>· Tiempo en página vs. scroll depth.</li>
            <li>· Feedback cualitativo de 5 sellers fundadores.</li>
            <li>· Gana la que mueve la aguja, no la que "me gusta".</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
