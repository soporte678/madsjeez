import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search, MessageCircle, ShieldCheck, Truck, Heart, Tag, Wrench, Hammer, Home as HomeIcon, Boxes, Tv } from "lucide-react";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { SellerCtaButton } from "@/components/seller/SellerInteractive";

export const revalidate = 86400;
const URL = `${SITE_URL}/comprar-en-madsjeez`;

export const metadata: Metadata = {
  title: "Comprá en Madsjeez | Marketplace argentino para comprar online",
  description:
    "Comprá productos online en Madsjeez: explorá por categoría, consultá al vendedor, pagá con los medios disponibles y seguí tu compra. Marketplace argentino.",
  keywords: "comprar online Argentina, comprar en marketplace, comprar repuestos online, ofertas online Argentina",
  alternates: { canonical: "/comprar-en-madsjeez" },
  openGraph: {
    type: "website", url: URL, siteName: SITE_NAME,
    title: "Comprá en Madsjeez | Marketplace argentino",
    description: "Explorá productos, descubrí tiendas y comprá online en Argentina.",
    locale: "es_AR",
  },
  twitter: { card: "summary_large_image", title: "Comprá en Madsjeez", description: "Marketplace argentino para comprar online." },
};

const STEPS = [
  { Icon: Search, title: "Buscá lo que necesitás", desc: "Explorá por categoría o escribí qué buscás en el buscador." },
  { Icon: MessageCircle, title: "Consultá al vendedor", desc: "¿Dudas sobre un producto? Preguntale directo al vendedor antes de comprar." },
  { Icon: Tag, title: "Comprá con los medios disponibles", desc: "Cada publicación indica los medios de pago que acepta el vendedor." },
  { Icon: Truck, title: "Seguí tu compra", desc: "Seguís el estado de tu pedido desde tu cuenta hasta que llega." },
];

const CATS = [
  { name: "Repuestos", Icon: Boxes }, { name: "Herramientas", Icon: Wrench }, { name: "Ferretería", Icon: Hammer },
  { name: "Hogar", Icon: HomeIcon }, { name: "Tecnología", Icon: Tv }, { name: "Ofertas", Icon: Tag },
];

const FAQS = [
  { question: "¿Cómo compro en Madsjeez?", answer: "Buscás el producto por categoría o por el buscador, entrás a la publicación, consultás al vendedor si tenés dudas y comprás con los medios de pago disponibles. Después seguís tu pedido desde tu cuenta." },
  { question: "¿Cómo pago?", answer: "Cada publicación indica los medios de pago que acepta el vendedor. Pagás de forma segura y queda registro de tu compra." },
  { question: "¿Los envíos están incluidos?", answer: "El costo y la forma de envío dependen de cada publicación y vendedor. Lo ves antes de confirmar la compra." },
  { question: "¿Puedo hablar con el vendedor?", answer: "Sí. Desde la ficha del producto podés hacer preguntas al vendedor antes y después de comprar." },
  { question: "¿Qué pasa si hay un problema con mi compra?", answer: "Podés abrir un reclamo desde tu pedido y el equipo de soporte ayuda a resolverlo según las condiciones de cada caso." },
  { question: "¿Necesito cuenta para comprar?", answer: "Tener tu cuenta te permite seguir tus compras, guardar favoritos y contactar vendedores más fácil." },
];

export default function ComprarEnMadsjeezPage() {
  const breadcrumb = [
    { name: "Inicio", url: SITE_URL },
    { name: "Comprar en Madsjeez", url: URL },
  ];
  const webPageLd = {
    "@context": "https://schema.org", "@type": "WebPage",
    name: "Comprá en Madsjeez", description: metadata.description, url: URL, inLanguage: "es-AR",
    isPartOf: { "@type": "WebSite", name: "Madsjeez", url: SITE_URL },
  };

  return (
    <main className="bg-background text-foreground">
      <BreadcrumbJsonLd items={breadcrumb} />
      <FaqJsonLd faqs={FAQS} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />

      <nav aria-label="Migas de pan" className="mx-auto max-w-6xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="font-medium text-foreground">Comprar en Madsjeez</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_15%_0%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Marketplace argentino</span>
          <h1 className="mt-5 max-w-3xl text-3xl font-black leading-[1.08] tracking-tight md:text-5xl">Comprá online en Madsjeez</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            Encontrá productos, descubrí tiendas y comprá con atención directa del vendedor. Explorá por categoría, compará y seguí tu compra desde tu cuenta.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <SellerCtaButton href="/search" source="comprar_en_madsjeez" event="home_explore_products_click">Explorar productos</SellerCtaButton>
            <SellerCtaButton href="/coupons/public" source="comprar_en_madsjeez" event="seller_cta_click" variant="secondary">Ver cupones</SellerCtaButton>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Explorá por categoría</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATS.map((c) => (
            <Link key={c.name} href={c.name === "Ofertas" ? "/offers" : `/search?q=${encodeURIComponent(c.name.toLowerCase())}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition hover:border-primary">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><c.Icon className="h-5 w-5" /></span>
              <span className="text-sm font-semibold text-foreground group-hover:text-primary">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Cómo comprar */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Cómo comprar, paso a paso</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-border bg-background p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                  <s.Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Confianza */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Comprá con más información</h2>
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { Icon: MessageCircle, title: "Atención directa", desc: "Consultá al vendedor desde la publicación antes y después de comprar." },
            { Icon: ShieldCheck, title: "Compra con respaldo", desc: "Si algo falla, abrís un reclamo desde tu pedido y soporte ayuda según el caso." },
            { Icon: Heart, title: "Guardá favoritos", desc: "Seguí tiendas y productos, y enterate de ofertas y novedades." },
          ].map((t) => (
            <div key={t.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><t.Icon className="h-5 w-5" /></span>
              <h3 className="mt-3 font-semibold text-foreground">{t.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Los medios de pago, envíos y condiciones dependen de cada publicación y vendedor.</p>
      </section>

      {/* FAQ */}
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
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-8 text-center md:p-12">
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">Encontrá lo que buscás</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">Miles de productos de vendedores de todo el país, en un solo lugar.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <SellerCtaButton href="/search" source="comprar_en_madsjeez" event="home_explore_products_click">Explorar productos</SellerCtaButton>
            <SellerCtaButton href="/comprar" source="comprar_en_madsjeez" event="seller_cta_click" variant="secondary">Comprar por ciudad</SellerCtaButton>
          </div>
        </div>
      </section>
    </main>
  );
}
