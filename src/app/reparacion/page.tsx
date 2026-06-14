import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Wrench } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { REP_GUIAS, type RepMaquina } from "@/data/reparacion-guias";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Guías de reparación y mantenimiento | Madsjeez",
  description:
    "Guías claras para diagnosticar y mantener tu desmalezadora o motosierra: no arranca, mezcla 2 tiempos, lubricación, afilado, carburador y más.",
  keywords: "reparación desmalezadora, motosierra no arranca, mezcla 2 tiempos, mantenimiento máquinas jardín",
  alternates: { canonical: "/reparacion" },
  openGraph: { type: "website", url: `${SITE_URL}/reparacion`, siteName: SITE_NAME, title: "Guías de reparación y mantenimiento | Madsjeez", description: "Diagnosticá y mantené tu máquina de jardín con guías claras.", locale: "es_AR" },
};

const GRUPOS: RepMaquina[] = ["Desmalezadora", "Motosierra", "General"];

export default function ReparacionPage() {
  const itemListLd = {
    "@context": "https://schema.org", "@type": "ItemList",
    itemListElement: REP_GUIAS.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/reparacion/${g.slug}`, name: g.title })),
  };

  return (
    <main className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />

      <nav aria-label="Migas de pan" className="mx-auto max-w-5xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="font-medium text-foreground">Reparación y mantenimiento</li>
        </ol>
      </nav>

      <header className="mx-auto max-w-5xl px-4 pb-8 pt-8 md:pt-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Wrench className="h-3.5 w-3.5" /> Reparación y mantenimiento</span>
        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Guías de reparación y mantenimiento</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
          Diagnosticá fallas comunes y mantené tu máquina en buen estado. Orientación general y clara; ante dudas o fallas internas, consultá siempre un service.
        </p>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-14 space-y-10">
        {GRUPOS.map((grupo) => {
          const guias = REP_GUIAS.filter((g) => g.maquina === grupo);
          if (guias.length === 0) return null;
          return (
            <div key={grupo}>
              <h2 className="text-lg font-bold tracking-tight">{grupo === "General" ? "General y mantenimiento" : grupo}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {guias.map((g) => (
                  <Link key={g.slug} href={`/reparacion/${g.slug}`} className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary">
                    <h3 className="font-bold text-foreground group-hover:text-primary">{g.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{g.excerpt}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">Ver guía <ChevronRight className="h-4 w-4" /></span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
