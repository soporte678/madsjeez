import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Scale } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { COMPARATIVAS } from "@/data/comparativas";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Comparativas para elegir mejor | Madsjeez",
  description:
    "Comparativas claras para decidir antes de comprar: tipos de desmalezadora, motosierra, motor 2T vs 4T, tanzas y más. Sin vueltas, para que elijas bien.",
  keywords: "comparativas, cuál elegir, desmalezadora, motosierra, motor 2 tiempos 4 tiempos",
  alternates: { canonical: "/comparativas" },
  openGraph: { type: "website", url: `${SITE_URL}/comparativas`, siteName: SITE_NAME, title: "Comparativas para elegir mejor | Madsjeez", description: "Comparativas claras para decidir antes de comprar.", locale: "es_AR" },
};

export default function ComparativasPage() {
  const itemListLd = {
    "@context": "https://schema.org", "@type": "ItemList",
    itemListElement: COMPARATIVAS.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/comparativas/${c.slug}`, name: c.title })),
  };

  return (
    <main className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />

      <nav aria-label="Migas de pan" className="mx-auto max-w-5xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="font-medium text-foreground">Comparativas</li>
        </ol>
      </nav>

      <header className="mx-auto max-w-5xl px-4 pb-8 pt-8 md:pt-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Scale className="h-3.5 w-3.5" /> Comparativas</span>
        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Comparativas para elegir mejor</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
          Antes de comprar, mirá las diferencias reales entre cada opción. Comparativas claras, sin vueltas, para que decidas según tu necesidad.
        </p>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-14">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {COMPARATIVAS.map((c) => (
            <Link key={c.slug} href={`/comparativas/${c.slug}`} className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary">
              <h2 className="font-bold text-foreground group-hover:text-primary">{c.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{c.excerpt}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">Ver comparativa <ChevronRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
