import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Store } from "lucide-react";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { getSellerHelpArticle, allSellerHelpSlugs } from "@/data/help-seller-articles";
import type { HelpArticle } from "@/data/help-articles";
import { SellerCtaButton } from "@/components/seller/SellerInteractive";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return allSellerHelpSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getSellerHelpArticle(slug);
  if (!a) return {};
  const url = `${SITE_URL}/ayuda-vendedores/${a.slug}`;
  return {
    title: a.seoTitle,
    description: a.metaDescription,
    alternates: { canonical: `/ayuda-vendedores/${a.slug}` },
    openGraph: { type: "article", url, siteName: SITE_NAME, title: a.seoTitle, description: a.metaDescription, locale: "es_AR" },
    twitter: { card: "summary_large_image", title: a.seoTitle, description: a.metaDescription },
  };
}

function anchor(s: string): string {
  return s.toLowerCase()
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i").replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function AyudaVendedoresArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getSellerHelpArticle(slug);
  if (!a) notFound();

  const url = `${SITE_URL}/ayuda-vendedores/${a.slug}`;
  const related = a.related.map((s) => getSellerHelpArticle(s)).filter((x): x is HelpArticle => Boolean(x)).slice(0, 3);

  const breadcrumb = [
    { name: "Inicio", url: SITE_URL },
    { name: "Ayuda para vendedores", url: `${SITE_URL}/ayuda-vendedores` },
    { name: a.title, url },
  ];
  const articleLd = {
    "@context": "https://schema.org", "@type": "Article",
    headline: a.title, description: a.metaDescription, url, inLanguage: "es-AR",
    author: { "@type": "Organization", name: "Madsjeez", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Madsjeez", url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <main className="bg-background text-foreground">
      <BreadcrumbJsonLd items={breadcrumb} />
      <FaqJsonLd faqs={a.faqs} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <nav aria-label="Migas de pan" className="mx-auto max-w-3xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li><Link href="/ayuda-vendedores" className="hover:text-foreground">Ayuda para vendedores</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="truncate font-medium text-foreground">{a.title}</li>
        </ol>
      </nav>

      <article className="mx-auto max-w-3xl px-4 pb-10 pt-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"><Store className="h-3.5 w-3.5" /> {a.category}</span>
        <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-4xl">{a.title}</h1>
        <p className="mt-4 text-lg leading-8 text-foreground">{a.intro}</p>

        {a.sections.length > 1 && (
          <nav aria-label="Índice" className="mt-7 rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">En esta nota</p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {a.sections.map((s) => (
                <li key={s.h2}><a href={`#${anchor(s.h2)}`} className="text-foreground hover:text-primary">{s.h2}</a></li>
              ))}
            </ol>
          </nav>
        )}

        <div className="mt-2">
          {a.sections.map((s) => (
            <section key={s.h2} id={anchor(s.h2)} className="mt-9 scroll-mt-20">
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">{s.h2}</h2>
              {s.paragraphs.map((p, i) => <p key={i} className="mt-3 text-base leading-7 text-muted-foreground">{p}</p>)}
              {s.list && (
                <ul className="mt-4 space-y-2">
                  {s.list.map((li) => (
                    <li key={li} className="flex items-start gap-2 text-base leading-7 text-muted-foreground">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{li}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {a.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">Preguntas frecuentes</h2>
            <div className="mt-5 divide-y divide-border rounded-2xl border border-border">
              {a.faqs.map((f) => (
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
          <p className="text-sm font-semibold text-foreground">¿Listo para empezar?</p>
          <p className="mt-1 text-sm text-muted-foreground">Creá tu cuenta de vendedor y empezá a publicar. Durante la beta, sin comisión por venta.</p>
          <div className="mt-4"><SellerCtaButton href="/seller/register" source={`ayuda_vendedores_${a.slug}`} event="seller_register_click">Crear cuenta de vendedor</SellerCtaButton></div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-10">
            <h2 className="text-lg font-bold tracking-tight">Seguí leyendo</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link key={r.slug} href={`/ayuda-vendedores/${r.slug}`} className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary">
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
