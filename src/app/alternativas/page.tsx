import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, AlertTriangle, TrendingDown, Shield, Zap } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { ALTERNATIVAS, ALT_CATEGORIES } from "@/data/alternativas";

export const metadata: Metadata = {
  title: "Alternativas a los grandes marketplaces para vendedores | Madsjeez",
  description:
    "Comisiones altas, cuentas bloqueadas, pagos retenidos: lo que los grandes marketplaces no te cuentan. Conocé la alternativa especializada para vender herramientas y maquinaria en Argentina.",
  keywords:
    "alternativa mercadolibre vendedores, marketplace sin comision argentina, vender herramientas online, problemas mercadolibre vendedores",
  alternates: { canonical: "/alternativas" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/alternativas`,
    siteName: SITE_NAME,
    title: "La alternativa para vendedores que buscan más que un marketplace masivo",
    description:
      "0% de comisión, sin algoritmos opacos, sin cuentas bloqueadas de golpe. Madsjeez es el marketplace especializado en herramientas y maquinaria industrial.",
    locale: "es_AR",
  },
};

const stats = [
  { value: "0%", label: "Comisión por venta", icon: TrendingDown },
  { value: "∞", label: "Cuentas activas sin suspensión arbitraria", icon: Shield },
  { value: "Hoy", label: "Cobrás el mismo día con tu Mercado Pago", icon: Zap },
  { value: "+80", label: "Categorías especializadas en industrial", icon: AlertTriangle },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Alternativas a los grandes marketplaces — Madsjeez",
  description: "20 problemas reales de vender en grandes plataformas y cómo resolverlos con Madsjeez.",
  url: `${SITE_URL}/alternativas`,
  publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
};

export default function AlternativasHubPage() {
  return (
    <main className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-background px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <AlertTriangle className="h-4 w-4" />
            Lo que nadie te cuenta sobre los grandes marketplaces
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
            Vendés mucho, pero ganás poco.
            <br />
            <span className="text-primary">¿Por qué?</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-7 text-muted-foreground">
            Comisiones que crecen, pagos retenidos, cuentas bloqueadas sin aviso, algoritmos que favorecen a los más grandes. Si vendés herramientas o maquinaria, hay una alternativa especializada.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/oferta-vendedores"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-primary/90"
            >
              Probá Madsjeez gratis 6 meses
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3.5 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-foreground"
            >
              Ver cómo funciona
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card/30 px-4 py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className="mx-auto mb-2 h-5 w-5 text-primary" />
              <p className="text-3xl font-black text-primary">{s.value}</p>
              <p className="mt-1 text-xs leading-4 text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categorías con artículos */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        {ALT_CATEGORIES.map((cat) => {
          const items = ALTERNATIVAS.filter((a) => a.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat} className="mb-12">
              <h2 className="mb-5 border-b border-border pb-3 text-xl font-bold tracking-tight">
                {cat}
                <span className="ml-2 text-sm font-normal text-muted-foreground">({items.length} artículos)</span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/alternativas/${a.slug}`}
                    className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-5 transition hover:border-primary hover:bg-primary/5"
                  >
                    <h3 className="text-sm font-bold leading-5 text-foreground group-hover:text-primary">
                      {a.h1}
                    </h3>
                    <p className="text-xs leading-5 text-muted-foreground line-clamp-2">
                      {a.intro}
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      Leer más <ChevronRight className="h-3 w-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* CTA final */}
      <section className="border-t border-border bg-card/30 px-4 py-14 text-center">
        <h2 className="text-2xl font-black tracking-tight md:text-3xl">
          Suficiente. Hay una mejor opción.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Madsjeez es el marketplace especializado en herramientas, maquinaria y repuestos industriales. 0% de comisión, siempre. Sin sorpresas.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/oferta-vendedores"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg transition hover:bg-primary/90"
          >
            Empezar gratis por 6 meses
            <ChevronRight className="h-5 w-5" />
          </Link>
          <Link
            href="/subscriptions"
            className="rounded-xl border border-border px-6 py-4 text-sm font-medium text-muted-foreground transition hover:border-primary"
          >
            Ver planes
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Sin tarjeta · 0% comisión · Cancelás cuando quieras</p>
      </section>
    </main>
  );
}
