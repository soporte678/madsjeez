import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Check, ArrowRight, ExternalLink } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import {
  VENDEDORES_SEO_PAGES,
  getVendedorSeoPage,
  getAllVendedoresSeoSlugs,
} from "@/data/vendedores-seo";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllVendedoresSeoSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getVendedorSeoPage(slug);
  if (!page) return {};
  const url = `${SITE_URL}/vendedores/${page.slug}`;
  return {
    title: page.seoTitle,
    description: page.metaDescription,
    keywords: page.keywords.join(", "),
    alternates: { canonical: `/vendedores/${page.slug}` },
    openGraph: {
      type: "article",
      url,
      siteName: SITE_NAME,
      title: page.seoTitle,
      description: page.metaDescription,
      locale: "es_AR",
      publishedTime: page.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: page.seoTitle,
      description: page.metaDescription,
    },
  };
}

export default async function VendedorSeoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getVendedorSeoPage(slug);
  if (!page) notFound();

  const related = VENDEDORES_SEO_PAGES.filter((p) =>
    page.relatedSlugs.includes(p.slug)
  ).slice(0, 4);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.h1,
    description: page.metaDescription,
    url: `${SITE_URL}/vendedores/${page.slug}`,
    inLanguage: "es-AR",
    datePublished: page.publishedAt,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/vendedores/${page.slug}`,
    },
    keywords: page.keywords.join(", "),
  };

  const faqLd =
    page.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: page.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Vendedores",
        item: `${SITE_URL}/vendedores`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: page.h1,
        item: `${SITE_URL}/vendedores/${page.slug}`,
      },
    ],
  };

  return (
    <main className="bg-white text-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Breadcrumb */}
      <nav
        aria-label="Migas de pan"
        className="mx-auto max-w-3xl px-4 pt-6"
      >
        <ol className="flex flex-wrap items-center gap-1 text-xs text-gray-400">
          <li>
            <Link href="/" className="hover:text-gray-700 transition-colors">
              Inicio
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li>
            <Link
              href="/vendedores"
              className="hover:text-gray-700 transition-colors"
            >
              Vendedores
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li className="truncate font-medium text-gray-700">{page.h1}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pb-10 pt-8">
        <h1 className="text-3xl font-black leading-tight tracking-tight text-gray-900 md:text-5xl">
          {page.h1}
        </h1>

        {/* Intro paragraphs */}
        <div className="mt-6 space-y-4">
          {page.intro.split("\n\n").map((paragraph, i) => (
            <p key={i} className="text-base leading-relaxed text-gray-600">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Hero CTA */}
        <div className="mt-8">
          <Link
            href="/vendedores"
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            {page.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Sections */}
      <div className="mx-auto max-w-3xl px-4 pb-16">
        {page.sections.map((section, i) => (
          <section
            key={i}
            className={`py-10 ${i > 0 ? "border-t border-gray-100" : ""}`}
          >
            <h2 className="text-xl font-bold leading-snug text-gray-900 md:text-2xl">
              {section.heading}
            </h2>
            <div className="mt-4 space-y-4">
              {section.content.split("\n\n").map((block, j) => {
                // Render markdown-style bold (**text**) as <strong>
                const rendered = block.replace(
                  /\*\*(.+?)\*\*/g,
                  "<strong>$1</strong>"
                );
                if (block.startsWith("| ")) {
                  // Simple table rendering
                  const rows = block
                    .split("\n")
                    .filter((r) => r.trim() && !r.match(/^\|[-\s|]+\|$/));
                  return (
                    <div key={j} className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-sm">
                        <tbody>
                          {rows.map((row, ri) => {
                            const cells = row
                              .split("|")
                              .filter((c) => c.trim())
                              .map((c) => c.trim());
                            const Tag = ri === 0 ? "th" : "td";
                            return (
                              <tr
                                key={ri}
                                className={
                                  ri === 0
                                    ? "bg-gray-50 font-semibold"
                                    : ri % 2 === 0
                                    ? "bg-gray-50/50"
                                    : "bg-white"
                                }
                              >
                                {cells.map((cell, ci) => (
                                  <Tag
                                    key={ci}
                                    className="px-4 py-2.5 text-left text-gray-700 first:font-medium"
                                  >
                                    {cell}
                                  </Tag>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                return (
                  <p
                    key={j}
                    className="text-base leading-relaxed text-gray-600"
                    dangerouslySetInnerHTML={{ __html: rendered }}
                  />
                );
              })}
            </div>
          </section>
        ))}

        {/* Checklist */}
        {page.checklist && page.checklist.length > 0 && (
          <section className="border-t border-gray-100 py-10">
            <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
              Checklist antes de empezar
            </h2>
            <ul className="mt-5 space-y-3">
              {page.checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <Check className="h-3 w-3 text-orange-600" />
                  </span>
                  <span className="text-sm leading-relaxed text-gray-600">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FAQs */}
        {page.faqs.length > 0 && (
          <section className="border-t border-gray-100 py-10">
            <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
              Preguntas frecuentes
            </h2>
            <div className="mt-5 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200">
              {page.faqs.map((faq) => (
                <details key={faq.q} className="group bg-white px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-gray-900">
                    {faq.q}
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Conversion Banner */}
        <section className="rounded-2xl bg-orange-500 px-6 py-8 md:px-10 md:py-10">
          <h2 className="text-lg font-bold leading-snug text-white md:text-xl">
            ¿Querés sumar Madsjeez como canal de ventas?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-orange-100">
            Estamos cargando hasta 200 publicaciones gratis para los primeros
            1000 vendedores aprobados. Sin comisión por venta, con tu logística,
            sin dejar de vender donde ya estás.
          </p>
          <div className="mt-6">
            <Link
              href="/vendedores"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-orange-600 shadow-sm transition hover:bg-orange-50"
            >
              Sumar mi tienda a Madsjeez
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Sources */}
        {page.sources.length > 0 && (
          <section className="border-t border-gray-100 pt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Fuentes
            </h2>
            <ul className="mt-3 space-y-2">
              {page.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    {source.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50">
          <div className="mx-auto max-w-3xl px-4 py-10">
            <h2 className="text-lg font-bold text-gray-900">
              También te puede interesar
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/vendedores/${r.slug}`}
                  className="group flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-orange-400 hover:bg-orange-50/30"
                >
                  <span className="text-sm font-medium leading-5 text-gray-800 group-hover:text-orange-700">
                    {r.h1}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                    Leer más <ChevronRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-6">
              <Link
                href="/vendedores"
                className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
              >
                Volver a Vendedores
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
