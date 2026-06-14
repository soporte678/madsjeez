import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Wrench, Search, ShieldAlert } from "lucide-react";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { getRepGuia, allRepGuiaSlugs, REP_GUIAS } from "@/data/reparacion-guias";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return allRepGuiaSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getRepGuia(slug);
  if (!g) return {};
  const url = `${SITE_URL}/reparacion/${g.slug}`;
  return {
    title: g.seoTitle,
    description: g.metaDescription,
    alternates: { canonical: `/reparacion/${g.slug}` },
    openGraph: { type: "article", url, siteName: SITE_NAME, title: g.seoTitle, description: g.metaDescription, locale: "es_AR" },
    twitter: { card: "summary_large_image", title: g.seoTitle, description: g.metaDescription },
  };
}

export default async function ReparacionGuiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getRepGuia(slug);
  if (!g) notFound();

  const url = `${SITE_URL}/reparacion/${g.slug}`;
  const related = g.related.map((s) => REP_GUIAS.find((x) => x.slug === s)).filter(Boolean).slice(0, 3) as typeof REP_GUIAS;

  const breadcrumb = [
    { name: "Inicio", url: SITE_URL },
    { name: "Reparación", url: `${SITE_URL}/reparacion` },
    { name: g.title, url },
  ];
  // HowTo schema (los pasos son reales y secuenciales)
  const howToLd = {
    "@context": "https://schema.org", "@type": "HowTo",
    name: g.title, description: g.metaDescription, inLanguage: "es-AR",
    step: g.pasos.map((p, i) => ({ "@type": "HowToStep", position: i + 1, name: p.titulo, text: p.detalle })),
  };

  return (
    <main className="bg-background text-foreground">
      <BreadcrumbJsonLd items={breadcrumb} />
      <FaqJsonLd faqs={g.faqs} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />

      <nav aria-label="Migas de pan" className="mx-auto max-w-3xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li><Link href="/reparacion" className="hover:text-foreground">Reparación</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="truncate font-medium text-foreground">{g.title}</li>
        </ol>
      </nav>

      <article className="mx-auto max-w-3xl px-4 pb-10 pt-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"><Wrench className="h-3.5 w-3.5" /> {g.maquina}</span>
        <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-4xl">{g.title}</h1>
        <p className="mt-4 text-lg leading-8 text-foreground">{g.intro}</p>

        {g.causas && g.causas.length > 0 && (
          <section className="mt-9">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">Causas más comunes</h2>
            <ul className="mt-4 space-y-2">
              {g.causas.map((c) => (
                <li key={c} className="flex items-start gap-2 text-base leading-7 text-muted-foreground">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{c}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">Paso a paso</h2>
          <ol className="mt-5 space-y-5">
            {g.pasos.map((p, i) => (
              <li key={p.titulo} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                <div>
                  <h3 className="font-bold text-foreground">{p.titulo}</h3>
                  <p className="mt-1 text-base leading-7 text-muted-foreground">{p.detalle}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-9 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldAlert className="h-4 w-4 text-amber-500" /> Seguridad</p>
          <ul className="mt-2 space-y-1.5">
            {g.seguridad.map((s) => <li key={s} className="text-sm leading-6 text-muted-foreground">• {s}</li>)}
          </ul>
        </div>

        {g.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">Preguntas frecuentes</h2>
            <div className="mt-5 divide-y divide-border rounded-2xl border border-border">
              {g.faqs.map((f) => (
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
          <p className="text-sm font-semibold text-foreground">¿Necesitás el repuesto?</p>
          <p className="mt-1 text-sm text-muted-foreground">Según disponibilidad de vendedores. Verificá siempre medidas, modelo y tipo de encastre antes de comprar.</p>
          <Link href={`/search?q=${encodeURIComponent(g.searchQuery)}`} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
            <Search className="h-4 w-4" /> Buscar &ldquo;{g.searchQuery}&rdquo;
          </Link>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-10">
            <h2 className="text-lg font-bold tracking-tight">Guías relacionadas</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link key={r.slug} href={`/reparacion/${r.slug}`} className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary">
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
