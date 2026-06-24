import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Check, ArrowRight } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { PREGUNTAS, getPregunta, getAllPreguntaSlugs, getPreguntasByCategory } from "@/data/preguntas";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPreguntaSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPregunta(slug);
  if (!p) return {};
  const url = `${SITE_URL}/preguntas/${p.slug}`;
  return {
    title: `${p.question} | Madsjeez`,
    description: p.answer.slice(0, 160),
    keywords: p.tags.join(", "),
    alternates: { canonical: `/preguntas/${p.slug}` },
    openGraph: {
      type: "article",
      url,
      siteName: SITE_NAME,
      title: p.question,
      description: p.answer.slice(0, 160),
      locale: "es_AR",
    },
    twitter: {
      card: "summary_large_image",
      title: p.question,
      description: p.answer.slice(0, 160),
    },
  };
}

export default async function PreguntaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pregunta = getPregunta(slug);
  if (!pregunta) notFound();

  const related = getPreguntasByCategory(pregunta.category)
    .filter((p) => p.slug !== pregunta.slug)
    .slice(0, 5);

  const qaLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    name: pregunta.question,
    url: `${SITE_URL}/preguntas/${pregunta.slug}`,
    mainEntity: {
      "@type": "Question",
      name: pregunta.question,
      text: pregunta.question,
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        text: pregunta.answer + " " + pregunta.keyPoints.join(". "),
        author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      },
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Preguntas", item: `${SITE_URL}/preguntas` },
      { "@type": "ListItem", position: 3, name: pregunta.question, item: `${SITE_URL}/preguntas/${pregunta.slug}` },
    ],
  };

  return (
    <main className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(qaLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Breadcrumb */}
      <nav aria-label="Migas de pan" className="mx-auto max-w-3xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li><Link href="/preguntas" className="hover:text-foreground">Preguntas</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="truncate font-medium text-foreground">{pregunta.category}</li>
        </ol>
      </nav>

      {/* Contenido principal */}
      <article className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        {/* Categoría chip */}
        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {pregunta.category}
        </span>

        {/* H1 = la pregunta */}
        <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight md:text-3xl">
          {pregunta.question}
        </h1>

        {/* Respuesta directa (featured snippet) */}
        <div className="mt-6 rounded-2xl border-l-4 border-primary bg-primary/5 px-5 py-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Respuesta rápida</p>
          <p className="mt-2 text-base leading-7 text-foreground">{pregunta.answer}</p>
        </div>

        {/* Puntos clave */}
        {pregunta.keyPoints.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold tracking-tight">Puntos clave</h2>
            <ul className="mt-4 space-y-3">
              {pregunta.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm leading-6 text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {pregunta.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {pregunta.tags.map((t) => (
              <span key={t} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6 md:p-8">
          <h2 className="text-lg font-bold tracking-tight">
            {pregunta.category === "Cómo vender online" || pregunta.category === "Sobre Madsjeez"
              ? "Empezá a vender en Madsjeez — 0% comisión"
              : "Encontrá lo que buscás en Madsjeez"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {pregunta.category === "Cómo vender online"
              ? "Marketplace de herramientas y maquinaria industrial. Sin comisiones por venta, siempre."
              : "Marketplace especializado en herramientas eléctricas, maquinaria industrial y repuestos para todo Argentina."}
          </p>
          <div className="mt-5">
            <Link
              href={pregunta.ctaHref}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              {pregunta.ctaText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>

      {/* Preguntas relacionadas */}
      {related.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-10">
            <h2 className="text-lg font-bold tracking-tight">Preguntas relacionadas</h2>
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/preguntas/${r.slug}`}
                  className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary hover:bg-primary/5"
                >
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                  <span className="text-sm font-medium leading-5 text-foreground group-hover:text-primary">
                    {r.question}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-6">
              <Link
                href="/preguntas"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Ver todas las preguntas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
