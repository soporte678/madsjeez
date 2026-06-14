import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search, Wrench, Store, Package } from "lucide-react";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { SellerCtaButton } from "@/components/seller/SellerInteractive";

export const revalidate = 86400;
const URL = `${SITE_URL}/maqjeez-y-madsjeez`;

export const metadata: Metadata = {
  title: "Maqjeez y Madsjeez | Marketplace argentino de repuestos y herramientas",
  description:
    "¿Buscás Maqjeez? Madsjeez es el marketplace argentino donde podés comprar y vender repuestos, herramientas y máquinas online. Etapa beta, sumando vendedores.",
  keywords: "maqjeez, madsjeez, repuestos online, marketplace repuestos Argentina, herramientas online",
  alternates: { canonical: "/maqjeez-y-madsjeez" },
  openGraph: {
    type: "website", url: URL, siteName: SITE_NAME,
    title: "Maqjeez y Madsjeez | Marketplace argentino",
    description: "Comprá y vendé repuestos, herramientas y máquinas online en Madsjeez.",
    locale: "es_AR",
  },
};

const FAQS = [
  { question: "¿Qué es Madsjeez?", answer: "Madsjeez es un marketplace argentino, en etapa beta, donde compradores y vendedores publican y compran productos online, con foco inicial en repuestos, herramientas, ferretería y máquinas." },
  { question: "¿Qué relación hay entre Maqjeez y Madsjeez?", answer: "Madsjeez es el marketplace donde podés encontrar repuestos, herramientas y máquinas de distintos vendedores. Si buscás productos relacionados con Maqjeez, es probable que los encuentres publicados acá." },
  { question: "¿Puedo comprar repuestos?", answer: "Sí. Explorá el catálogo por categoría o buscador: repuestos de desmalezadora, motosierra, grupos electrógenos, motobombas, herramientas y ferretería, según las publicaciones vigentes." },
  { question: "¿Puedo vender en Madsjeez?", answer: "Sí. Registrate como vendedor y publicá tu catálogo. Durante la etapa beta no cobramos comisión por venta." },
];

export default function MaqjeezYMadsjeezPage() {
  const breadcrumb = [
    { name: "Inicio", url: SITE_URL },
    { name: "Maqjeez y Madsjeez", url: URL },
  ];
  const webPageLd = {
    "@context": "https://schema.org", "@type": "WebPage",
    name: "Maqjeez y Madsjeez", description: metadata.description, url: URL, inLanguage: "es-AR",
    isPartOf: { "@type": "WebSite", name: "Madsjeez", url: SITE_URL },
  };

  return (
    <main className="bg-background text-foreground">
      <BreadcrumbJsonLd items={breadcrumb} />
      <FaqJsonLd faqs={FAQS} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />

      <nav aria-label="Migas de pan" className="mx-auto max-w-5xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="font-medium text-foreground">Maqjeez y Madsjeez</li>
        </ol>
      </nav>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_15%_0%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent)]" />
        <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Marketplace argentino · beta</span>
          <h1 className="mt-5 max-w-3xl text-3xl font-black leading-[1.08] tracking-tight md:text-5xl">Maqjeez y Madsjeez</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            Madsjeez es el marketplace argentino donde podés comprar y vender repuestos, herramientas y máquinas online.
            Si llegaste buscando <strong className="text-foreground">Maqjeez</strong>, acá encontrás productos del rubro publicados por vendedores.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <SellerCtaButton href="/search" source="maqjeez" event="home_explore_products_click">Explorar productos</SellerCtaButton>
            <SellerCtaButton href="/repuestos" source="maqjeez" event="seller_cta_click" variant="secondary">Ver repuestos</SellerCtaButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { Icon: Search, t: "Comprá online", d: "Explorá por categoría o buscador y consultá al vendedor.", href: "/comprar-en-madsjeez", cta: "Cómo comprar" },
            { Icon: Wrench, t: "Repuestos y herramientas", d: "Repuestos de desmalezadora, motosierra, grupos, motobombas, ferretería.", href: "/repuestos", cta: "Ver repuestos" },
            { Icon: Store, t: "Vendé tus productos", d: "Publicá tu catálogo. 0% comisión durante la beta.", href: "/vender-en-madsjeez", cta: "Quiero vender" },
          ].map((c) => (
            <div key={c.t} className="flex flex-col rounded-2xl border border-border bg-card p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><c.Icon className="h-5 w-5" /></span>
              <h2 className="mt-3 font-bold text-foreground">{c.t}</h2>
              <p className="mt-1 flex-1 text-sm leading-6 text-muted-foreground">{c.d}</p>
              <Link href={c.href} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">{c.cta} <ChevronRight className="h-4 w-4" /></Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-6">
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">Qué es Madsjeez</h2>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Madsjeez es un marketplace argentino en etapa beta, pensado para que comercios, repuesteros, ferreterías y
          emprendedores puedan vender online con catálogo ordenado, pagos con Mercado Pago y un link para compartir.
          Estamos sumando productos y vendedores progresivamente.
        </p>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          El foco inicial está en repuestos de máquinas (desmalezadora, motosierra, grupos electrógenos, motobombas),
          herramientas y ferretería. La disponibilidad depende de los vendedores activos y las publicaciones vigentes.
          Si tenés dudas sobre un producto, consultá al vendedor antes de comprar.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-12 md:pb-16">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Preguntas frecuentes</h2>
        <div className="mt-6 divide-y divide-border rounded-2xl border border-border">
          {FAQS.map((f) => (
            <details key={f.question} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-foreground">
                {f.question}
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{f.answer}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6 text-center">
          <h2 className="text-xl font-black tracking-tight"><Package className="mr-1 inline h-5 w-5 text-primary" /> Empezá en Madsjeez</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <SellerCtaButton href="/search" source="maqjeez" event="home_explore_products_click">Explorar productos</SellerCtaButton>
            <SellerCtaButton href="/vender-en-madsjeez" source="maqjeez" event="seller_cta_click" variant="secondary">Vender en Madsjeez</SellerCtaButton>
          </div>
        </div>
      </section>
    </main>
  );
}
