/**
 * Template de las landings de captación de vendedores (server component).
 * Compone: breadcrumb, hero, beneficios, cómo funciona, rubros, comparativa,
 * prosa SEO, formulario, FAQ, enlazado interno y CTA final.
 * Schema: BreadcrumbList + FAQPage (componentes existentes) + WebPage/ItemList inline.
 */

import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, Check, Store, PackageCheck, MessagesSquare } from "lucide-react";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo";
import { SITE_URL } from "@/lib/seo/site";
import {
  getSellerLanding,
  HOW_IT_WORKS,
  RUBROS,
  HUB_SLUG,
  DEFAULT_PRIMARY_CTA,
  type SellerLanding as Landing,
} from "@/data/seller-landings";
import { SellerLeadForm } from "./SellerLeadForm";
import { SellerCtaButton, SellerWhatsApp, SellerPageView } from "./SellerInteractive";

const STEP_ICONS = [Store, PackageCheck, MessagesSquare];

export function SellerLanding({ slug }: { slug: string }) {
  const data = getSellerLanding(slug);
  if (!data) return null;
  return <Body data={data} />;
}

function Body({ data }: { data: Landing }) {
  const primaryCta = data.primaryCta || DEFAULT_PRIMARY_CTA;
  const steps = data.steps || HOW_IT_WORKS;
  const pageUrl = `${SITE_URL}/${data.slug}`;

  const breadcrumbItems = [
    { name: "Inicio", url: SITE_URL },
    { name: data.breadcrumb, url: pageUrl },
  ];

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.h1,
    description: data.metaDescription,
    url: pageUrl,
    inLanguage: "es-AR",
    isPartOf: { "@type": "WebSite", name: "Madsjeez", url: SITE_URL },
  };

  return (
    <main className="bg-background text-foreground">
      <Suspense fallback={null}>
        <SellerPageView source={data.slug} />
      </Suspense>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <FaqJsonLd faqs={data.faqs} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />

      {/* Breadcrumb visible */}
      <nav aria-label="Migas de pan" className="mx-auto max-w-6xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="font-medium text-foreground">{data.breadcrumb}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_15%_0%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {data.heroEyebrow}
          </span>
          <h1 className="mt-5 max-w-3xl text-3xl font-black leading-[1.08] tracking-tight md:text-5xl">{data.h1}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">{data.heroSubtitle}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <SellerCtaButton href="#lead-form" source={data.slug} event="seller_cta_click">{primaryCta}</SellerCtaButton>
            {!data.campaign && (
              <SellerCtaButton href="#como-funciona" source={data.slug} event="seller_cta_click" variant="secondary">
                Ver cómo funciona
              </SellerCtaButton>
            )}
          </div>
        </div>
      </section>

      {data.intro && (
        <section className="mx-auto max-w-3xl px-4 pb-2">
          <p className="text-base leading-7 text-muted-foreground">{data.intro}</p>
        </section>
      )}

      {/* Beneficios */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Por qué vender en Madsjeez</h2>
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.benefits.map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">{b.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="border-y border-border bg-card/40 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Cómo funciona en 3 pasos</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((s, i) => {
              const Icon = STEP_ICONS[i % STEP_ICONS.length];
              return (
                <div key={s.title} className="relative rounded-2xl border border-border bg-background p-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{s.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8">
            <SellerCtaButton href="/seller/register" source={data.slug} event="seller_register_click">Crear cuenta de vendedor</SellerCtaButton>
          </div>
        </div>
      </section>

      {/* Rubros */}
      {data.showCategories && (
        <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Rubros que pueden vender</h2>
          <p className="mt-2 text-sm text-muted-foreground">Si vendés productos físicos, probablemente entren en Madsjeez.</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {RUBROS.map((r) =>
              r.slug ? (
                <Link key={r.name} href={`/${r.slug}`} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary">
                  {r.name}
                </Link>
              ) : (
                <span key={r.name} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground">{r.name}</span>
              )
            )}
          </div>
        </section>
      )}

      {/* Comparativa */}
      {data.comparison && (
        <section className="border-y border-border bg-card/40">
          <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{data.comparison.title}</h2>
            <div className="mt-7 overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold"> </th>
                    <th className="px-4 py-3 font-semibold">Un solo canal</th>
                    <th className="px-4 py-3 font-semibold text-primary">Sumar Madsjeez</th>
                  </tr>
                </thead>
                <tbody>
                  {data.comparison.rows.map((row, i) => (
                    <tr key={row.label} className={i % 2 ? "bg-card/40" : ""}>
                      <td className="px-4 py-3 font-medium text-foreground">{row.label}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.single}</td>
                      <td className="px-4 py-3 text-foreground">{row.mads}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Prosa SEO */}
      {data.content.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <div className="space-y-9">
            {data.content.map((c) => (
              <div key={c.h2}>
                <h2 className="text-xl font-bold tracking-tight md:text-2xl">{c.h2}</h2>
                <p className="mt-3 text-base leading-7 text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Formulario */}
      <section id="lead-form" className="border-y border-border bg-card/40 scroll-mt-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{data.ctaTitle}</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">{data.ctaSubtitle}</p>
            <ul className="mt-6 space-y-2.5 text-sm text-foreground">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Te contactamos para ayudarte a empezar.</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Sin compromiso y para cualquier rubro.</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Sumás un canal sin dejar los que ya usás.</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <SellerWhatsApp source={data.slug} />
            </div>
          </div>
          <Suspense fallback={<div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Cargando formulario…</div>}>
            <SellerLeadForm source={data.slug} title="Dejanos tus datos" subtitle="El equipo de Madsjeez te contacta para ayudarte a vender." />
          </Suspense>
        </div>
      </section>

      {/* FAQ */}
      {data.faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Preguntas frecuentes</h2>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border">
            {data.faqs.map((f) => (
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

      {/* Enlazado interno */}
      <RelatedLinks slugs={data.related} currentSlug={data.slug} />

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-8 text-center md:p-12">
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">{data.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">{data.ctaSubtitle}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <SellerCtaButton href="#lead-form" source={data.slug} event="seller_cta_click">{primaryCta}</SellerCtaButton>
            <SellerCtaButton href="/seller/register" source={data.slug} event="seller_register_click" variant="secondary">Crear cuenta de vendedor</SellerCtaButton>
          </div>
        </div>
      </section>
    </main>
  );
}

function RelatedLinks({ slugs, currentSlug }: { slugs: string[]; currentSlug: string }) {
  const items = slugs
    .filter((s) => s !== currentSlug)
    .map((s) => getSellerLanding(s))
    .filter((l): l is Landing => Boolean(l))
    .slice(0, 5);
  if (!items.length) return null;
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-lg font-bold tracking-tight">También puede interesarte</h2>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => (
            <Link key={l.slug} href={`/${l.slug}`} className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary">
              <span className="text-sm font-medium text-foreground group-hover:text-primary">{l.breadcrumb}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </Link>
          ))}
          {currentSlug !== HUB_SLUG && (
            <Link href={`/${HUB_SLUG}`} className="group flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 transition hover:border-primary">
              <span className="text-sm font-bold text-primary">Vender en Madsjeez</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export default SellerLanding;
