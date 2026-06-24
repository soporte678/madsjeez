import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, Clock, Star, Zap, Crown, Shield, TrendingUp } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "6 Meses Gratis para Nuevos Vendedores | Madsjeez",
  description:
    "Oferta exclusiva: probá el plan PRO de Madsjeez gratis durante 6 meses. Vendé maquinaria, herramientas y repuestos sin comisiones en Argentina.",
  keywords:
    "vender online gratis, marketplace gratis Argentina, publicar herramientas gratis, maquinaria online, oferta vendedores",
  alternates: { canonical: "/oferta-vendedores" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/oferta-vendedores`,
    siteName: SITE_NAME,
    title: "6 Meses Gratis para Nuevos Vendedores — Madsjeez",
    description:
      "Oferta exclusiva de lanzamiento: 6 meses gratis en el plan PRO. Vendé maquinaria, herramientas y repuestos en Argentina sin pagar comisiones.",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "6 Meses Gratis — Madsjeez Marketplace",
    description: "Publicá hasta 200 productos gratis durante 6 meses. Sin comisiones, sin letra chica.",
  },
};

const proFeatures = [
  "200 publicaciones activas",
  "0% comisión por venta — siempre",
  "Soporte prioritario por WhatsApp",
  "Estadísticas avanzadas de tu tienda",
  "App móvil con IA integrada",
  "Chat con IA para tus compradores",
  "Integración WhatsApp + Meta API",
  "Badge PRO visible en tu perfil",
  "Promociones automáticas",
];

const steps = [
  { n: "1", title: "Creá tu cuenta gratis", desc: "Registrate en menos de 2 minutos con tu email o Google." },
  { n: "2", title: "Activá la oferta", desc: "Al registrarte como vendedor, el plan PRO se activa automáticamente por 6 meses." },
  { n: "3", title: "Publicá tus productos", desc: "Subí fotos, precio y descripción. Llegás a compradores de todo el país." },
  { n: "4", title: "Vendé y cobrás vos", desc: "Recibís el pago directo en tu Mercado Pago. Nosotros no tocamos tu plata." },
];

const faqs = [
  {
    q: "¿Cuánto dura la oferta de 6 meses gratis?",
    a: "Los 6 meses empiezan desde que activás tu cuenta como vendedor. Al vencer, podés continuar con el plan PRO a $2.999/mes o bajar al plan Básico gratuito.",
  },
  {
    q: "¿Necesito ingresar una tarjeta de crédito?",
    a: "No. Los 6 meses son completamente gratis sin necesidad de método de pago. Solo te pedimos tu email.",
  },
  {
    q: "¿Madsjeez cobra comisión por mis ventas?",
    a: "No. Madsjeez tiene 0% de comisión en todos los planes, siempre. El precio que ponés en tu publicación es el dinero que recibís.",
  },
  {
    q: "¿Qué pasa después de los 6 meses?",
    a: "Te avisamos con 15 días de anticipación. Podés continuar con el plan PRO a $2.999/mes o quedarte en el plan Básico gratis con hasta 50 publicaciones.",
  },
  {
    q: "¿Qué tipo de productos puedo vender?",
    a: "Maquinaria industrial, herramientas eléctricas y manuales, repuestos, equipos de construcción, soldadoras, compresores, y más. Si tiene que ver con trabajo y producción, está en Madsjeez.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Offer",
  name: "6 Meses Gratis Plan PRO Madsjeez",
  description: "Oferta de lanzamiento para nuevos vendedores: 6 meses del plan PRO sin costo.",
  url: `${SITE_URL}/oferta-vendedores`,
  seller: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  price: "0",
  priceCurrency: "ARS",
  availability: "https://schema.org/InStock",
  validFrom: "2026-06-01",
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function OfertaVendedoresPage() {
  return (
    <main className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-background px-4 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-3xl text-center">
          {/* Badge urgencia */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <Clock className="h-4 w-4" />
            Oferta de lanzamiento — tiempo limitado
          </div>

          <h1 className="text-4xl font-black leading-tight tracking-tight text-foreground md:text-6xl">
            Vendé en Madsjeez
            <br />
            <span className="text-primary">6 meses gratis</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-muted-foreground">
            Plan PRO completo, sin pagar nada durante 6 meses. Publicá hasta 200 productos, llegá a compradores de todo el país y cobrás directo en tu Mercado Pago.
          </p>

          {/* Precio tachado */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 px-8 py-5">
              <p className="text-sm text-muted-foreground">Valor normal</p>
              <p className="text-2xl font-black text-muted-foreground line-through">$2.999/mes</p>
            </div>
            <ArrowRight className="h-6 w-6 text-primary" />
            <div className="rounded-2xl border-2 border-primary bg-primary/10 px-8 py-5">
              <p className="text-sm font-semibold text-primary">Tus primeros 6 meses</p>
              <p className="text-3xl font-black text-primary">$0/mes</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/seller/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg transition hover:bg-primary/90 hover:shadow-primary/25"
            >
              Empezar gratis ahora
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/subscriptions"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-4 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-foreground"
            >
              Ver todos los planes
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Sin tarjeta de crédito · Sin contrato · Cancelás cuando quieras
          </p>
        </div>
      </section>

      {/* QUÉ INCLUYE EL PLAN PRO */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Crown className="h-4 w-4" />
            Plan PRO — lo que recibís gratis
          </div>
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">Todo lo que necesitás para vender</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            El mismo plan PRO que después vale $2.999/mes, gratis durante 6 meses.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {proFeatures.map((f) => (
            <div key={f} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm font-medium">{f}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center">
          <Shield className="mx-auto mb-2 h-6 w-6 text-primary" />
          <p className="font-semibold">0% comisión por venta — en todos los planes, siempre.</p>
          <p className="mt-1 text-sm text-muted-foreground">El precio que ponés es el dinero que recibís. Sin letra chica.</p>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="border-t border-border bg-card/50 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">Cómo activar la oferta</h2>
            <p className="mt-2 text-muted-foreground">Cuatro pasos, menos de 5 minutos.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-black text-primary">
                  {s.n}
                </span>
                <h3 className="font-bold">{s.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/seller/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg transition hover:bg-primary/90"
            >
              Registrarme y activar oferta
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF / STATS */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { label: "Vendedores activos", value: "+500" },
            { label: "Comisión por venta", value: "0%" },
            { label: "Categorías", value: "+80" },
            { label: "Compradores en Argentina", value: "+10k" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-3xl font-black text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: TrendingUp, title: "Llegás a más compradores", desc: "Tus productos aparecen en búsquedas de maquinaria, herramientas y repuestos en toda Argentina." },
            { icon: Zap, title: "Publicás en minutos", desc: "Subí fotos desde el celular, ponés el precio y listo. El proceso tarda menos de 3 minutos por producto." },
            { icon: Star, title: "Soporte real en WhatsApp", desc: "En el plan PRO tenés acceso a soporte prioritario por WhatsApp. Una persona real, no un bot." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-6">
              <item.icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-card/50 px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-3xl font-black tracking-tight">Preguntas frecuentes</h2>
          <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden">
            {faqs.map((f) => (
              <details key={f.q} className="group bg-background px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                  {f.q}
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-border px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            Empezá a vender hoy,<br />
            <span className="text-primary">gratis por 6 meses</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Sin tarjeta de crédito, sin contratos, sin comisiones. Si no te convence, te quedás en el plan gratuito sin costo alguno.
          </p>
          <Link
            href="/seller/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-10 py-4 text-lg font-bold text-white shadow-xl transition hover:bg-primary/90 hover:shadow-primary/30"
          >
            Quiero mis 6 meses gratis
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-xs text-muted-foreground">
            Oferta válida solo para cuentas nuevas · Después del período, $2.999/mes o plan gratuito
          </p>
        </div>
      </section>
    </main>
  );
}
