import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { GUIAS_COMPRA, getGuia } from "@/data/guias-compra";
import { canonicalMeta } from "@/lib/seo/canonical";
import { ArrowRight, ArrowUpRight, CalendarCheck } from "lucide-react";

export const revalidate = 3600;
export const dynamicParams = false;

const SITE_URL = "https://www.madsjeez.com.ar";

export function generateStaticParams() {
  return GUIAS_COMPRA.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guia = getGuia(slug);
  if (!guia) return { title: "Guía no encontrada | Madsjeez" };
  return {
    title: guia.seoTitle,
    description: guia.metaDescription,
    ...canonicalMeta(`/guias/${guia.slug}`),
    openGraph: {
      title: guia.seoTitle,
      description: guia.metaDescription,
      url: `${SITE_URL}/guias/${guia.slug}`,
      siteName: "MADSJEEZ",
      type: "article",
      locale: "es_AR",
    },
  };
}

function toJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function GuiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guia = getGuia(slug);
  if (!guia) notFound();

  const url = `${SITE_URL}/guias/${guia.slug}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Guías de compra", item: `${SITE_URL}/guias` },
      { "@type": "ListItem", position: 3, name: guia.title, item: url },
    ],
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guia.title,
    description: guia.metaDescription,
    inLanguage: "es-AR",
    datePublished: guia.updatedAt,
    dateModified: guia.updatedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: "Madsjeez", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Madsjeez",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/madsjeez-icon-512.png` },
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guia.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const related = guia.related.map(getGuia).filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(faqJsonLd) }} />

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Inicio</Link>
          <span>›</span>
          <Link href="/guias" className="hover:text-foreground">Guías de compra</Link>
          <span>›</span>
          <span className="text-foreground font-medium line-clamp-1">{guia.title}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-4">
          {guia.title}
        </h1>

        {/* Respuesta directa (snippet) */}
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 mb-6">
          <p className="text-[15px] leading-relaxed text-foreground">{guia.answer}</p>
        </div>

        <p className="text-muted-foreground leading-relaxed mb-8">{guia.intro}</p>

        {/* Categorías reales — grilla arriba para que el comprador vaya directo */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
            Ver productos
          </p>
          <div className="flex flex-wrap gap-2">
            {guia.categorias.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                {c.label}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>

        {/* Secciones */}
        <article className="space-y-8">
          {guia.sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-xl font-bold text-foreground mb-3">{s.heading}</h2>
              {s.body.map((p, j) => (
                <p key={j} className="text-[15px] leading-7 text-muted-foreground mb-3">{p}</p>
              ))}
              {s.bullets && (
                <ul className="mt-2 space-y-1.5">
                  {s.bullets.map((b, k) => (
                    <li key={k} className="flex gap-2 text-[15px] text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Preguntas frecuentes</h2>
          <div className="divide-y divide-border rounded-2xl border border-border bg-card">
            {guia.faqs.map((f, i) => (
              <details key={i} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold text-foreground flex items-center justify-between">
                  {f.q}
                  <span className="text-muted-foreground group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-[15px] leading-7 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Revisión + relacionadas */}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-8">
          <CalendarCheck className="w-3.5 h-3.5" />
          Última revisión:{" "}
          {new Date(guia.updatedAt).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        {related.length > 0 && (
          <section className="mt-10 pt-8 border-t border-border">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Guías relacionadas
            </h2>
            <div className="space-y-2">
              {related.map((r) => r && (
                <Link
                  key={r.slug}
                  href={`/guias/${r.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/40 transition-colors"
                >
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{r.title}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
