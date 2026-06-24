import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { PREGUNTAS, CATEGORIES } from "@/data/preguntas";

export const metadata: Metadata = {
  title: "Preguntas frecuentes sobre herramientas y maquinaria industrial | Madsjeez",
  description:
    "Respondemos las 100 preguntas más frecuentes sobre compra, venta, uso y mantenimiento de herramientas eléctricas, maquinaria industrial y repuestos en Argentina.",
  keywords:
    "preguntas herramientas argentina, donde comprar maquinaria industrial, como vender herramientas online, marketplace herramientas",
  alternates: { canonical: "/preguntas" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/preguntas`,
    siteName: SITE_NAME,
    title: "100 Preguntas sobre herramientas y maquinaria — Madsjeez",
    description:
      "Dónde comprar, cómo vender, comparativas de marcas, mantenimiento: las respuestas que buscás sobre herramientas y maquinaria en Argentina.",
    locale: "es_AR",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Preguntas frecuentes sobre herramientas y maquinaria",
  description: "100 preguntas respondidas sobre compra, venta y uso de herramientas industriales en Argentina.",
  url: `${SITE_URL}/preguntas`,
  publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
};

export default function PreguntasHubPage() {
  return (
    <main className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <section className="border-b border-border bg-card/30 px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Search className="h-4 w-4" />
            Preguntas frecuentes
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            Todo lo que necesitás saber sobre
            <br />
            <span className="text-primary">herramientas y maquinaria</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Respondemos las preguntas más buscadas en Argentina sobre dónde comprar, cómo vender, comparativas de marcas y uso técnico de herramientas industriales.
          </p>
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        {CATEGORIES.map((cat) => {
          const items = PREGUNTAS.filter((p) => p.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat} className="mb-12">
              <h2 className="mb-5 text-xl font-bold tracking-tight border-b border-border pb-3">
                {cat}
                <span className="ml-2 text-sm font-normal text-muted-foreground">({items.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {items.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/preguntas/${p.slug}`}
                    className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary hover:bg-primary/5"
                  >
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                    <span className="text-sm font-medium leading-5 text-foreground group-hover:text-primary">
                      {p.question}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card/30 px-4 py-12 text-center">
        <h2 className="text-xl font-bold">¿No encontraste lo que buscabas?</h2>
        <p className="mt-2 text-sm text-muted-foreground">Buscá herramientas y maquinaria en el marketplace o contactanos.</p>
        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/marketplace" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary/90">
            Ver el marketplace
          </Link>
          <Link href="/ayuda" className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition hover:border-primary">
            Centro de ayuda
          </Link>
        </div>
      </section>
    </main>
  );
}
