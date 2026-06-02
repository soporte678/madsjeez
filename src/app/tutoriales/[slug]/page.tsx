import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TUTORIALES, getTutorial, getRelated } from '@/data/tutoriales';
import { TutorialIcon } from '@/components/tutoriales/TutorialIcon';
import { MediaPlaceholder, TutorialHero } from '@/components/tutoriales/MediaPlaceholder';
import { ArrowLeft, ArrowRight, Clock, Tag, CheckCircle2 } from 'lucide-react';

import type { TutorialHeroVariant } from '@/components/tutoriales/MediaPlaceholder';

type Params = { slug: string };
type Search = { style?: string };

function parseVariant(v?: string): TutorialHeroVariant {
  if (v === 'a' || v === 'b' || v === 'c' || v === 'd') return v;
  return 'default';
}

export async function generateStaticParams() {
  return TUTORIALES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { slug } = await params;
  const t = getTutorial(slug);
  if (!t) return { title: 'Tutorial no encontrado | MadsJeez' };
  const url = `https://www.madsjeez.com.ar/tutoriales/${t.slug}`;
  return {
    title: `${t.title} | Tutoriales MadsJeez`,
    description: t.summary,
    alternates: { canonical: url },
    openGraph: {
      title: t.title,
      description: t.summary,
      url,
      type: 'article',
    },
  };
}

const LEVEL_TONE: Record<string, string> = {
  fácil: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  medio: 'bg-amber-50 text-amber-700 ring-amber-200',
  avanzado: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export default async function TutorialDetailPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams?: Promise<Search>;
}) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const variant = parseVariant(sp.style);
  const t = getTutorial(slug);
  if (!t) return notFound();
  const related = getRelated(slug);

  // JSON-LD HowTo para SEO + GEO (citaciones IA)
  const howToLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: t.title,
    description: t.summary,
    totalTime: `PT${t.duration.replace(/\D/g, '') || '5'}M`,
    step: t.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.title,
      text: s.body,
    })),
  };

  return (
    <main className="min-h-screen bg-mesh font-outfit text-slate-900">
      <section className="max-w-[1024px] mx-auto px-4 pt-8 pb-4">
        <Link
          href="/tutoriales"
          prefetch={false}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Volver a todos los tutoriales
        </Link>
      </section>

      <section className="max-w-[1024px] mx-auto px-4">
        <TutorialHero
          title={t.title}
          hint={t.subtitle}
          icon={<TutorialIcon name={t.icon} size={64} className="opacity-95" />}
          variant={variant}
        />
      </section>

      <section className="max-w-[1024px] mx-auto px-4 mt-8">
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} /> {t.duration}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
              LEVEL_TONE[t.level] ?? LEVEL_TONE['fácil']
            }`}
          >
            {t.level}
          </span>
          {t.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500"
            >
              <Tag size={11} /> {tag}
            </span>
          ))}
        </div>

        <p className="mt-6 text-[15.5px] md:text-base text-slate-700 leading-relaxed max-w-prose">
          {t.intro}
        </p>
      </section>

      <section
        aria-label="Pasos del tutorial"
        className="max-w-[1024px] mx-auto px-4 mt-12 mb-16"
      >
        <ol className="space-y-12">
          {t.steps.map((step, i) => (
            <li
              key={i}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10"
            >
              <div className="md:col-span-5 order-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-[13px] font-black tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-[18px] md:text-[20px] font-bold tracking-tight leading-snug">
                    {step.title}
                  </h3>
                </div>
                <p className="text-[14.5px] text-slate-600 leading-relaxed">
                  {step.body}
                </p>
              </div>
              <div className="md:col-span-7 order-2">
                <MediaPlaceholder hint={step.visualHint} media={step.media} />
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="max-w-[1024px] mx-auto px-4 mb-20">
        <div className="rounded-3xl bg-slate-900 text-white p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-md">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-yellow-300 mb-2">
              Siguiente paso
            </p>
            <h3 className="text-2xl md:text-3xl font-black leading-tight">
              Te llevamos directo: {t.ctaLabel}
            </h3>
          </div>
          <Link
            href={t.ctaHref}
            prefetch={false}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black px-7 py-4 text-[14px] transition-colors shadow-[0_8px_24px_-8px_rgba(250,204,21,0.6)]"
          >
            {t.ctaLabel}
            <ArrowRight size={18} strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {related.length > 0 && (
        <section
          aria-label="Tutoriales relacionados"
          className="max-w-[1024px] mx-auto px-4 mb-24"
        >
          <h2 className="text-[13px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-4">
            Seguí aprendiendo
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/tutoriales/${r.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-[#3483FA]/40 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3483FA]/10 text-[#3483FA]">
                    <TutorialIcon name={r.icon} size={18} />
                  </div>
                  <h3 className="mt-3 text-[14.5px] font-bold tracking-tight leading-snug">
                    {r.title}
                  </h3>
                  <p className="mt-1 text-[12px] text-slate-500">
                    {r.duration} · {r.level}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-[#3483FA] group-hover:gap-2 transition-all">
                    Leer
                    <ArrowRight size={12} strokeWidth={2.5} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
      />
    </main>
  );
}
