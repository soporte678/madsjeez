import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Check, Store, Palette, Package, Share2, Globe, Smartphone } from "lucide-react";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { SellerCtaButton, SellerWhatsApp } from "@/components/seller/SellerInteractive";

export const revalidate = 86400;

const URL = `${SITE_URL}/crear-tienda-online`;

export const metadata: Metadata = {
  title: "Creá tu tienda online en Madsjeez | Vendé con tu propia vidriera digital",
  description:
    "Creá tu tienda online en Madsjeez: elegí el nombre, personalizá tu vidriera, publicá tus productos y compartí tu link. Ideal para emprendedores, comercios y mayoristas en Argentina.",
  keywords: "crear tienda online, tienda online para emprendedores, vender online con tienda propia, tienda online con dominio propio, marketplace con tienda propia",
  alternates: { canonical: "/crear-tienda-online" },
  openGraph: {
    type: "website", url: URL, siteName: SITE_NAME,
    title: "Creá tu tienda online en Madsjeez",
    description: "Tu propia vidriera digital dentro de Madsjeez. Personalizala, publicá productos y compartí tu link.",
    locale: "es_AR",
  },
  twitter: { card: "summary_large_image", title: "Creá tu tienda online en Madsjeez", description: "Tu propia vidriera digital dentro de Madsjeez." },
};

const BENEFITS = [
  { icon: Store, title: "Tu vidriera propia", desc: "Una tienda con tu nombre, tu logo y tus colores dentro de Madsjeez." },
  { icon: Palette, title: "Personalizable", desc: "Elegí plantilla, colores y banner. Sin saber programar." },
  { icon: Package, title: "Tus productos, ordenados", desc: "Mostrá tu catálogo con categorías propias y productos destacados." },
  { icon: Share2, title: "Link para compartir", desc: "Un solo link para tu WhatsApp, Instagram, Facebook o un QR." },
  { icon: Globe, title: "Dominio propio (avanzado)", desc: "Conectá un dominio que ya compraste, como www.tumarca.com.ar." },
  { icon: Smartphone, title: "Mobile y rápida", desc: "Tu tienda se ve perfecta en el celular y carga rápido." },
];

const STEPS = [
  { n: 1, title: "Elegí el nombre", desc: "Definí el nombre de tu tienda y tu dirección dentro de Madsjeez." },
  { n: 2, title: "Personalizala", desc: "Subí tu logo y banner, elegí colores y plantilla." },
  { n: 3, title: "Cargá tus productos", desc: "Sumá tu catálogo y armá tus categorías." },
  { n: 4, title: "Compartí tu link", desc: "Publicá tu tienda y compartila por WhatsApp, redes o QR." },
];

const FAQS = [
  { question: "¿Puedo crear mi tienda online en Madsjeez?", answer: "Sí. Como vendedor podés crear tu propia tienda dentro de Madsjeez, con tu nombre, tu catálogo y tu link para compartir." },
  { question: "¿Puedo usar mi propio dominio?", answer: "Sí, en la etapa avanzada podés conectar un dominio que ya compraste (por ejemplo www.tumarca.com.ar). El panel te muestra paso a paso los registros DNS a configurar." },
  { question: "¿Necesito saber programación?", answer: "No. Configurás tu tienda desde el panel: nombre, logo, banner, colores y productos, sin escribir código." },
  { question: "¿Puedo vender por WhatsApp desde mi tienda?", answer: "Sí. Tu tienda muestra un botón de WhatsApp para que los compradores te consulten directo." },
  { question: "¿Puedo publicar productos mayoristas?", answer: "Sí. Podés mostrar tu catálogo mayorista y aclarar condiciones de venta por cantidad." },
  { question: "¿Puedo usar Madsjeez junto con Mercado Libre o Instagram?", answer: "Sí. Tu tienda en Madsjeez suma un canal más; seguís vendiendo donde ya lo hacés." },
  { question: "¿Qué pasa si ya tengo un dominio comprado?", answer: "Podés conectarlo a tu tienda. Te mostramos qué registros DNS agregar y, una vez verificado, tu tienda funciona con tu dominio y HTTPS." },
  { question: "¿Puedo cambiar el nombre de mi tienda?", answer: "Sí, podés actualizar el nombre y los datos de tu tienda desde el panel cuando lo necesites." },
  { question: "¿Mi tienda aparece en Google?", answer: "Sí. Las tiendas activas con productos son indexables, con su propio título, descripción y datos para compartir." },
];

export default function CrearTiendaOnlinePage() {
  const breadcrumb = [
    { name: "Inicio", url: SITE_URL },
    { name: "Creá tu tienda online", url: URL },
  ];
  const webPageLd = {
    "@context": "https://schema.org", "@type": "WebPage",
    name: "Creá tu tienda online en Madsjeez", description: metadata.description, url: URL, inLanguage: "es-AR",
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
          <li className="font-medium text-foreground">Creá tu tienda online</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_15%_0%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Madsjeez Tiendas
          </span>
          <h1 className="mt-5 max-w-3xl text-3xl font-black leading-[1.08] tracking-tight md:text-5xl">Creá tu tienda online en Madsjeez</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            Elegí el nombre de tu tienda, publicá tus productos y compartí tu propia vidriera online. Ideal para
            emprendedores, comercios, mayoristas y vendedores que quieren vender por internet sin complicarse.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <SellerCtaButton href="/seller/register" source="crear_tienda_online" event="seller_register_click">Crear mi tienda</SellerCtaButton>
            <SellerCtaButton href="#que-incluye" source="crear_tienda_online" event="seller_cta_click" variant="secondary">Ver qué incluye</SellerCtaButton>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section id="que-incluye" className="mx-auto max-w-6xl px-4 py-12 md:py-16 scroll-mt-20">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Tu tienda online, con tu identidad</h2>
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">{b.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Cómo funciona</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-background p-6">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{s.n}</span>
                <h3 className="mt-4 font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8"><SellerCtaButton href="/seller/register" source="crear_tienda_online" event="seller_register_click">Crear mi tienda</SellerCtaButton></div>
        </div>
      </section>

      {/* Dominio propio */}
      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <div className="space-y-9">
          <div>
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">¿Ya tenés un dominio comprado?</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Podés conectar tu dominio a tu tienda de Madsjeez y usar una dirección propia como www.tumarca.com.ar.
              Te mostramos paso a paso qué registros DNS configurar para verificarlo y activar tu tienda con HTTPS.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">Compartí tu tienda y vendé más</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Cada tienda tiene su propio link para compartir por WhatsApp, Instagram, Facebook o imprimir en un QR.
              Tu tienda ayuda a vender tus productos y también atrae nuevos compradores a Madsjeez.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">Para emprendedores, comercios y mayoristas</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Lo mismo si arrancás un emprendimiento, tenés un comercio con stock o vendés por mayor: tu tienda te da una
              vidriera ordenada y profesional, sin depender de una sola red social.
            </p>
          </div>
        </div>
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
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">Creá tu tienda online hoy</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            Tu propia vidriera dentro de Madsjeez. Personalizala, publicá tus productos y empezá a compartir tu link.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <SellerCtaButton href="/seller/register" source="crear_tienda_online" event="seller_register_click">Crear mi tienda</SellerCtaButton>
            <SellerWhatsApp source="crear_tienda_online" label="Consultar por WhatsApp" />
          </div>
        </div>
      </section>
    </main>
  );
}
