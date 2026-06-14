/**
 * Template de las landings de captación de vendedores (server component).
 * Compone: breadcrumb, hero, beneficios, cómo funciona, rubros, comparativa,
 * prosa SEO, formulario, FAQ, enlazado interno y CTA final.
 * Schema: BreadcrumbList + FAQPage (componentes existentes) + WebPage/ItemList inline.
 */

import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, Check, Store, PackageCheck, MessagesSquare, Sparkles, ShieldCheck, Truck, CreditCard, LifeBuoy } from "lucide-react";
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
import { Reveal, TiltCard, CountUp } from "./premium/motion-primitives";
import { SellerHeroVisual, type HeroProduct } from "./premium/SellerHeroVisual";
import { AnimatedPipeline } from "./premium/AnimatedPipeline";
import { LogisticsCard } from "./premium/LogisticsCard";
import { getHeroProducts } from "@/lib/seo/hero-products";

const STEP_ICONS = [Store, PackageCheck, MessagesSquare];

const TRUST = [
  { icon: CreditCard, label: "0% comisión", sub: "durante la beta" },
  { icon: ShieldCheck, label: "Mercado Pago", sub: "cobrás en tu cuenta" },
  { icon: Truck, label: "Envíos", sub: "los define cada vendedor" },
  { icon: LifeBuoy, label: "Soporte", sub: "te ayudamos a empezar" },
];

export async function SellerLanding({ slug }: { slug: string }) {
  const data = getSellerLanding(slug);
  if (!data) return null;
  const heroProducts = await getHeroProducts(4);
  return <Body data={data} heroProducts={heroProducts} />;
}

function Body({ data, heroProducts }: { data: Landing; heroProducts: HeroProduct[] }) {
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

      {/* Hero (dark premium, split asimétrico). Texto estático para LCP/SEO. */}
      <section className="relative overflow-hidden bg-[#0a1226] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_18%_-5%,rgba(59,130,246,0.30),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_45%_at_105%_110%,rgba(37,99,235,0.20),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 pb-14 pt-12 md:pb-20 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-200">
              <Sparkles className="h-3.5 w-3.5" /> {data.heroEyebrow}
            </span>
            <h1 className="mt-5 max-w-xl text-3xl font-black leading-[1.08] tracking-tight md:text-5xl">{data.h1}</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 md:text-lg">{data.heroSubtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <SellerCtaButton href="#lead-form" source={data.slug} event="seller_cta_click">{primaryCta}</SellerCtaButton>
              {!data.campaign && (
                <SellerCtaButton href="#como-funciona" source={data.slug} event="seller_cta_click" variant="secondary">
                  Ver cómo funciona
                </SellerCtaButton>
              )}
            </div>
          </div>
          <div className="lg:pl-4">
            <SellerHeroVisual products={heroProducts} />
          </div>
        </div>
      </section>

      {/* Tira de confianza */}
      <section className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <ul className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {TRUST.map((t) => {
              const Icon = t.icon;
              return (
                <li key={t.label} className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.sub}</p>
                  </div>
                </li>
              );
            })}
          </ul>
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
          {data.benefits.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.06} className="h-full">
              <TiltCard className="group h-full rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{b.desc}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="border-y border-border bg-card/40 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Cómo funciona en 3 pasos</h2>
          <p className="mt-2 text-sm text-muted-foreground">Del producto al cobro, en un solo flujo.</p>
          <div className="mt-7 rounded-2xl border border-border bg-background p-5 md:p-6">
            <AnimatedPipeline />
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((s, i) => {
              const Icon = STEP_ICONS[i % STEP_ICONS.length];
              return (
                <Reveal key={s.title} delay={i * 0.08} className="h-full">
                  <div className="relative h-full rounded-2xl border border-border bg-background p-6">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mt-4 font-semibold text-foreground">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{s.desc}</p>
                  </div>
                </Reveal>
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
            <Reveal className="mt-7 overflow-hidden rounded-2xl border border-border">
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
            </Reveal>
          </div>
        </section>
      )}

      {/* Madsjeez Flash + stats honestos */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Despachá con Madsjeez Flash</h2>
            <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">
              Si tu zona tiene cobertura, coordinamos el retiro y la entrega para que te enfoques en vender. Según disponibilidad de la zona.
            </p>
            <div className="mt-7 grid grid-cols-3 gap-4">
              <div>
                <p className="text-3xl font-black text-primary"><CountUp to={700} prefix="+" /></p>
                <p className="mt-1 text-xs text-muted-foreground">productos en el catálogo</p>
              </div>
              <div>
                <p className="text-3xl font-black text-primary"><CountUp to={0} suffix="%" /></p>
                <p className="mt-1 text-xs text-muted-foreground">comisión en la beta</p>
              </div>
              <div>
                <p className="text-3xl font-black text-primary"><CountUp to={100} suffix="%" /></p>
                <p className="mt-1 text-xs text-muted-foreground">del importe para vos</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <LogisticsCard />
          </Reveal>
        </div>
      </section>

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
        <Reveal className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-8 text-center md:p-12">
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">{data.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">{data.ctaSubtitle}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <SellerCtaButton href="#lead-form" source={data.slug} event="seller_cta_click">{primaryCta}</SellerCtaButton>
            <SellerCtaButton href="/seller/register" source={data.slug} event="seller_register_click" variant="secondary">Crear cuenta de vendedor</SellerCtaButton>
          </div>
        </Reveal>
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
