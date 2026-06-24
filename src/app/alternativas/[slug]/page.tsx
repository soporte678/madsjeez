import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Check, X, ArrowRight, AlertTriangle } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { ALTERNATIVAS, getAlternativa, getAllAlternativaSlugs, getAlternativasByCategory } from "@/data/alternativas";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllAlternativaSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getAlternativa(slug);
  if (!a) return {};
  const url = `${SITE_URL}/alternativas/${a.slug}`;
  return {
    title: a.seoTitle,
    description: a.metaDescription,
    keywords: a.tags.join(", "),
    alternates: { canonical: `/alternativas/${a.slug}` },
    openGraph: {
      type: "article",
      url,
      siteName: SITE_NAME,
      title: a.seoTitle,
      description: a.metaDescription,
      locale: "es_AR",
    },
    twitter: { card: "summary_large_image", title: a.seoTitle, description: a.metaDescription },
  };
}

export default async function AlternativaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const alt = getAlternativa(slug);
  if (!alt) notFound();

  const related = ALTERNATIVAS.filter((a) => alt.relatedSlugs.includes(a.slug)).slice(0, 4);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: alt.h1,
    description: alt.metaDescription,
    url: `${SITE_URL}/alternativas/${alt.slug}`,
    inLanguage: "es-AR",
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/alternativas/${alt.slug}` },
    keywords: alt.tags.join(", "),
  };

  const faqLd = alt.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: alt.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Alternativas", item: `${SITE_URL}/alternativas` },
      { "@type": "ListItem", position: 3, name: alt.h1, item: `${SITE_URL}/alternativas/${alt.slug}` },
    ],
  };

  return (
    <main className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Breadcrumb */}
      <nav aria-label="Migas de pan" className="mx-auto max-w-3xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li><Link href="/alternativas" className="hover:text-foreground">Alternativas</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="truncate font-medium text-foreground">{alt.category}</li>
        </ol>
      </nav>

      <article className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        {/* Chip categoría */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <AlertTriangle className="h-3 w-3" />
          {alt.category}
        </span>

        {/* H1 */}
        <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight md:text-3xl">
          {alt.h1}
        </h1>

        {/* Intro */}
        <p className="mt-5 text-base leading-7 text-muted-foreground">{alt.intro}</p>

        {/* PROBLEMA */}
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight">{alt.problemTitle}</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">{alt.problemBody}</p>
          {alt.problemPoints.length > 0 && (
            <ul className="mt-5 space-y-3">
              {alt.problemPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <X className="mt-1 h-4 w-4 shrink-0 text-destructive" />
                  <span className="text-sm leading-6 text-muted-foreground">{p}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* SOLUCIÓN */}
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight">{alt.solutionTitle}</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">{alt.solutionBody}</p>
          {alt.solutionPoints.length > 0 && (
            <ul className="mt-5 space-y-3">
              {alt.solutionPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm leading-6 text-muted-foreground">{p}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* CTA inline */}
        <div className="mt-10 rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6 md:p-8">
          <h2 className="text-lg font-bold tracking-tight">{alt.ctaTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Marketplace especializado en herramientas, maquinaria y repuestos. 0% de comisión por venta, siempre.
          </p>
          <div className="mt-5">
            <Link
              href={alt.ctaHref}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              {alt.ctaText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* FAQ */}
        {alt.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold tracking-tight">Preguntas frecuentes</h2>
            <div className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border">
              {alt.faqs.map((f) => (
                <details key={f.q} className="group bg-background px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-sm">
                    {f.q}
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        {alt.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {alt.tags.map((t) => (
              <span key={t} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Artículos relacionados */}
      {related.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-10">
            <h2 className="text-lg font-bold tracking-tight">También te puede interesar</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/alternativas/${r.slug}`}
                  className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition hover:border-primary hover:bg-primary/5"
                >
                  <span className="text-sm font-medium leading-5 text-foreground group-hover:text-primary">
                    {r.h1}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-primary">
                    Leer más <ChevronRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/alternativas" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                Ver todos los artículos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
