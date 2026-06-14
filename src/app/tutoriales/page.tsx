import type { Metadata } from 'next';
import Link from 'next/link';
import { TUTORIALES } from '@/data/tutoriales';
import { TutorialIcon } from '@/components/tutoriales/TutorialIcon';
import { Clock, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tutoriales | Aprendé a vender en MadsJeez',
  description:
    'Guías paso a paso para sellers: postularte como fundador, publicar productos, configurar pagos, gestionar preguntas y crecer con Ads.',
  alternates: { canonical: 'https://www.madsjeez.com.ar/tutoriales' },
  openGraph: {
    title: 'Tutoriales MadsJeez para vendedores',
    description:
      'Guías cortas paso a paso para vender y comprar en el marketplace MadsJeez.',
    url: 'https://www.madsjeez.com.ar/tutoriales',
    type: 'website',
  },
};

const LEVEL_TONE: Record<string, string> = {
  fácil: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  medio: 'bg-amber-50 text-amber-700 ring-amber-200',
  avanzado: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export default function TutorialesIndex() {
  const itemsForJsonLd = TUTORIALES.map((t, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: t.title,
    url: `https://www.madsjeez.com.ar/tutoriales/${t.slug}`,
  }));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Tutoriales MadsJeez',
    itemListElement: itemsForJsonLd,
  };

  return (
    <main className="min-h-screen bg-mesh font-outfit text-slate-900">
      <section className="max-w-[1184px] mx-auto px-4 pt-12 pb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3483FA] mb-3">
          Centro de Aprendizaje
        </p>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.02] max-w-3xl">
          De cero a tu primera venta,{' '}
          <span className="relative inline-block">
            <span className="relative z-10">paso por paso</span>
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-1 h-3 -z-0 bg-yellow-300/70 rounded-sm"
            />
          </span>
          .
        </h1>
        <p className="mt-5 text-base md:text-lg text-slate-600 max-w-2xl leading-relaxed">
          Guías cortas, sin vueltas, pensadas para sellers que recién arrancan.
          Cada una toma entre 4 y 8 minutos y se enfoca en una cosa puntual que
          tenés que hacer hoy.
        </p>
      </section>

      <section
        aria-label="Listado de tutoriales"
        className="max-w-[1184px] mx-auto px-4 pb-24"
      >
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TUTORIALES.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/tutoriales/${t.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-[#3483FA]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3483FA]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3483FA]/10 text-[#3483FA]">
                    <TutorialIcon name={t.icon} size={22} />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                      LEVEL_TONE[t.level] ?? LEVEL_TONE['fácil']
                    }`}
                  >
                    {t.level}
                  </span>
                </div>

                <h2 className="mt-5 text-[17px] font-bold text-slate-900 tracking-tight leading-snug">
                  {t.title}
                </h2>
                <p className="mt-2 text-[13.5px] text-slate-600 leading-relaxed">
                  {t.summary}
                </p>

                <div className="mt-auto pt-5 flex items-center justify-between text-[12px]">
                  <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                    <Clock size={12} /> {t.duration}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#3483FA] group-hover:gap-2 transition-all">
                    Leer guía
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
