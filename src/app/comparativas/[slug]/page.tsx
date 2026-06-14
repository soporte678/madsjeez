import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Scale, Search } from "lucide-react";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { getComparativa, allComparativaSlugs, COMPARATIVAS } from "@/data/comparativas";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return allComparativaSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparativa(slug);
  if (!c) return {};
  const url = `${SITE_URL}/comparativas/${c.slug}`;
  return {
    title: c.seoTitle,
    description: c.metaDescription,
    alternates: { canonical: `/comparativas/${c.slug}` },
    openGraph: { type: "article", url, siteName: SITE_NAME, title: c.seoTitle, description: c.metaDescription, locale: "es_AR" },
    twitter: { card: "summary_large_image", title: c.seoTitle, description: c.metaDescription },
  };
}

export default async function ComparativaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getComparativa(slug);
  if (!c) notFound();

  const url = `${SITE_URL}/comparativas/${c.slug}`;
  const related = c.related.map((s) => COMPARATIVAS.find((x) => x.slug === s)).filter(Boolean).slice(0, 3) as typeof COMPARATIVAS;

  const breadcrumb = [
    { name: "Inicio", url: SITE_URL },
    { name: "Comparativas", url: `${SITE_URL}/comparativas` },
    { name: c.title, url },
  ];
  const articleLd = {
    "@context": "https://schema.org", "@type": "Article",
    headline: c.title, description: c.metaDescription, url, inLanguage: "es-AR",
    author: { "@type": "Organization", name: "Madsjeez", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Madsjeez", url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <main className="bg-background text-foreground">
      <BreadcrumbJsonLd items={breadcrumb} />
      <FaqJsonLd faqs={c.faqs} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <nav aria-label="Migas de pan" className="mx-auto max-w-3xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li><Link href="/comparativas" className="hover:text-foreground">Comparativas</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="truncate font-medium text-foreground">{c.title}</li>
        </ol>
      </nav>

      <article className="mx-auto max-w-3xl px-4 pb-10 pt-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"><Scale className="h-3.5 w-3.5" /> Comparativa</span>
        <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-4xl">{c.title}</h1>
        <p className="mt-4 text-lg leading-8 text-foreground">{c.intro}</p>

        {/* Tabla comparativa */}
        <section className="mt-9 scroll-mt-20" id="comparacion">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">Comparación rápida</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-card">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Criterio</th>
                  {c.options.map((o) => (
                    <th key={o.name} className="px-4 py-3 text-left font-bold text-foreground">
                      {o.name}
                      <span className="block text-xs font-normal text-muted-foreground">{o.tagline}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.rows.map((row) => (
                  <tr key={row.criterio} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">{row.criterio}</td>
                    {row.valores.map((v, i) => (
                      <td key={i} className="px-4 py-3 text-muted-foreground">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Veredicto */}
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">Cuándo conviene cada uno</h2>
          <div className="mt-4 space-y-3">
            {c.veredicto.map((v) => (
              <div key={v.option} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-semibold text-foreground">{v.option}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{v.cuando}</p>
              </div>
            ))}
          </div>
        </section>

        {c.notas && c.notas.length > 0 && (
          <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
            <p className="text-sm font-semibold text-foreground">A tener en cuenta</p>
            <ul className="mt-2 space-y-1.5">
              {c.notas.map((n) => <li key={n} className="text-sm leading-6 text-muted-foreground">• {n}</li>)}
            </ul>
          </div>
        )}

        {c.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">Preguntas frecuentes</h2>
            <div className="mt-5 divide-y divide-border rounded-2xl border border-border">
              {c.faqs.map((f) => (
                <details key={f.question} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-foreground">
                    {f.question}<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6">
          <p className="text-sm font-semibold text-foreground">Mirá las opciones disponibles en Madsjeez</p>
          <p className="mt-1 text-sm text-muted-foreground">Según disponibilidad de vendedores. Verificá medidas, modelo y compatibilidad antes de comprar.</p>
          <Link href={`/search?q=${encodeURIComponent(c.searchQuery)}`} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
            <Search className="h-4 w-4" /> Buscar &ldquo;{c.searchQuery}&rdquo;
          </Link>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-10">
            <h2 className="text-lg font-bold tracking-tight">Seguí comparando</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link key={r.slug} href={`/comparativas/${r.slug}`} className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary">{r.title}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
