import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock } from "lucide-react";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { getBlogPost, allBlogSlugs, type BlogPost } from "@/data/blog-posts";
import { getSellerLanding } from "@/data/seller-landings";
import { SellerCtaButton } from "@/components/seller/SellerInteractive";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return allBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.seoTitle,
    description: post.metaDescription,
    keywords: post.tags.join(", "),
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url,
      siteName: SITE_NAME,
      title: post.seoTitle,
      description: post.metaDescription,
      locale: "es_AR",
      publishedTime: post.updatedAt,
      modifiedTime: post.updatedAt,
      tags: post.tags,
    },
    twitter: { card: "summary_large_image", title: post.seoTitle, description: post.metaDescription },
  };
}

function anchor(s: string): string {
  return s.toLowerCase()
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const landing = getSellerLanding(post.ctaLanding);
  const related = post.related.map((s) => getBlogPost(s)).filter((p): p is BlogPost => Boolean(p)).slice(0, 3);

  const breadcrumbItems = [
    { name: "Inicio", url: SITE_URL },
    { name: "Blog", url: `${SITE_URL}/blog` },
    { name: post.title, url },
  ];

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    url,
    inLanguage: "es-AR",
    datePublished: post.updatedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: "Madsjeez", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Madsjeez", url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: post.tags.join(", "),
  };

  return (
    <main className="bg-background text-foreground">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <FaqJsonLd faqs={post.faqs} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <nav aria-label="Migas de pan" className="mx-auto max-w-3xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="truncate font-medium text-foreground">{post.title}</li>
        </ol>
      </nav>

      <article className="mx-auto max-w-3xl px-4 pb-8 pt-6">
        <header>
          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{post.category}</span>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-4xl">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {post.readingMinutes} min de lectura</span>
            <span>Actualizado el {formatDate(post.updatedAt)}</span>
          </div>
        </header>

        {/* Índice */}
        {post.sections.length > 1 && (
          <nav aria-label="Índice" className="mt-7 rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">En esta nota</p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {post.sections.map((s) => (
                <li key={s.h2}>
                  <a href={`#${anchor(s.h2)}`} className="text-foreground hover:text-primary">{s.h2}</a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Intro */}
        <p className="mt-7 text-lg leading-8 text-foreground">{post.intro}</p>

        {/* Secciones */}
        <div className="mt-2">
          {post.sections.map((s) => (
            <section key={s.h2} id={anchor(s.h2)} className="mt-9 scroll-mt-20">
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">{s.h2}</h2>
              {s.paragraphs.map((p, i) => (
                <p key={i} className="mt-3 text-base leading-7 text-muted-foreground">{p}</p>
              ))}
              {s.list && (
                <ul className="mt-4 space-y-2">
                  {s.list.map((li) => (
                    <li key={li} className="flex items-start gap-2 text-base leading-7 text-muted-foreground">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {li}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* CTA al landing */}
        <div className="mt-10 rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6 md:p-8">
          <h2 className="text-xl font-bold tracking-tight">{landing?.ctaTitle ?? "Empezá a vender en Madsjeez"}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{landing?.ctaSubtitle ?? "Publicá tus productos y llegá a más clientes."}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <SellerCtaButton href={`/${post.ctaLanding}`} source={`blog_${post.slug}`} event="seller_cta_click">
              {landing?.primaryCta ?? "Quiero vender en Madsjeez"}
            </SellerCtaButton>
          </div>
        </div>

        {/* FAQ */}
        {post.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">Preguntas frecuentes</h2>
            <div className="mt-5 divide-y divide-border rounded-2xl border border-border">
              {post.faqs.map((f) => (
                <details key={f.question} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-foreground">
                    {f.question}
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </article>

      {/* Notas relacionadas */}
      {related.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-10">
            <h2 className="text-lg font-bold tracking-tight">Seguí leyendo</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary">
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
