import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Tag } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { MARCAS } from "@/data/marcas";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Repuestos por marca de máquina | Madsjeez",
  description:
    "Buscá productos y repuestos compatibles por marca de máquina: Niwa, Gamma, Stihl, Lusqtoff, Omaha, Honda y más. Verificá compatibilidad antes de comprar.",
  keywords: "repuestos por marca, repuestos compatibles, Niwa, Gamma, Stihl, Honda",
  alternates: { canonical: "/marcas" },
  openGraph: { type: "website", url: `${SITE_URL}/marcas`, siteName: SITE_NAME, title: "Repuestos por marca de máquina | Madsjeez", description: "Productos y repuestos compatibles por marca, de distintos vendedores.", locale: "es_AR" },
};

export default function MarcasPage() {
  const itemListLd = {
    "@context": "https://schema.org", "@type": "ItemList",
    itemListElement: MARCAS.map((m, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/marcas/${m.slug}`, name: m.name })),
  };

  return (
    <main className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />

      <nav aria-label="Migas de pan" className="mx-auto max-w-5xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="font-medium text-foreground">Marcas</li>
        </ol>
      </nav>

      <header className="mx-auto max-w-5xl px-4 pb-6 pt-8 md:pt-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Tag className="h-3.5 w-3.5" /> Marcas</span>
        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Repuestos por marca de máquina</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
          Elegí la marca de tu máquina para buscar productos y repuestos compatibles publicados por distintos vendedores.
        </p>
        <p className="mt-3 max-w-2xl text-xs leading-6 text-muted-foreground">
          Madsjeez es un marketplace; no somos distribuidores oficiales de estas marcas. Los productos pueden ser originales o compatibles según el vendedor. Verificá siempre compatibilidad, modelo y medidas antes de comprar.
        </p>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-14">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {MARCAS.map((m) => (
            <Link key={m.slug} href={`/marcas/${m.slug}`} className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary">
              <span className="text-lg font-black text-foreground group-hover:text-primary">{m.name}</span>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{m.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
