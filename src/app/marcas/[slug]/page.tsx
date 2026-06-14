import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Tag, Search, Info } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/seo";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { getMarca, allMarcaSlugs, MARCAS } from "@/data/marcas";
import { getRepGuia } from "@/data/reparacion-guias";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return allMarcaSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = getMarca(slug);
  if (!m) return {};
  const url = `${SITE_URL}/marcas/${m.slug}`;
  return {
    title: m.seoTitle,
    description: m.metaDescription,
    alternates: { canonical: `/marcas/${m.slug}` },
    openGraph: { type: "website", url, siteName: SITE_NAME, title: m.seoTitle, description: m.metaDescription, locale: "es_AR" },
    twitter: { card: "summary", title: m.seoTitle, description: m.metaDescription },
  };
}

export default async function MarcaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = getMarca(slug);
  if (!m) notFound();

  const url = `${SITE_URL}/marcas/${m.slug}`;
  const relatedMarcas = m.related.map((s) => MARCAS.find((x) => x.slug === s)).filter(Boolean).slice(0, 3) as typeof MARCAS;
  const repGuias = m.repRelated.map((s) => getRepGuia(s)).filter(Boolean).slice(0, 3);

  const breadcrumb = [
    { name: "Inicio", url: SITE_URL },
    { name: "Marcas", url: `${SITE_URL}/marcas` },
    { name: m.name, url },
  ];

  return (
    <main className="bg-background text-foreground">
      <BreadcrumbJsonLd items={breadcrumb} />

      <nav aria-label="Migas de pan" className="mx-auto max-w-3xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li><Link href="/marcas" className="hover:text-foreground">Marcas</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="truncate font-medium text-foreground">{m.name}</li>
        </ol>
      </nav>

      <article className="mx-auto max-w-3xl px-4 pb-10 pt-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"><Tag className="h-3.5 w-3.5" /> Marca</span>
        <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-4xl">Productos y repuestos {m.name}</h1>
        <p className="mt-4 text-lg leading-8 text-foreground">{m.intro}</p>

        <div className="mt-6 flex items-start gap-2 rounded-2xl border border-border bg-card p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-6 text-muted-foreground">
            Madsjeez es un marketplace; no somos distribuidores oficiales de {m.name}. Los productos pueden ser originales o compatibles según el vendedor. Verificá siempre compatibilidad, modelo y medidas antes de comprar.
          </p>
        </div>

        <section className="mt-9">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">Qué vas a encontrar</h2>
          <ul className="mt-4 space-y-2">
            {m.tipos.map((t) => (
              <li key={t} className="flex items-start gap-2 text-base leading-7 text-muted-foreground">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{t}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-9">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">Cómo asegurar la compatibilidad</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Antes de comprar, confirmá el modelo exacto de tu máquina {m.name} y, si podés, el número de parte de la pieza. Para repuestos de corte, verificá medidas (paso y calibre de cadena, diámetro de tanza, largo de espada y tipo de encastre).
          </p>
          <Link href="/reparacion/identificar-repuesto-por-medidas" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Cómo identificar el repuesto correcto <ChevronRight className="h-4 w-4" />
          </Link>
        </section>

        <div className="mt-10 rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6">
          <p className="text-sm font-semibold text-foreground">Ver publicaciones {m.name} en Madsjeez</p>
          <p className="mt-1 text-sm text-muted-foreground">Según disponibilidad de vendedores activos.</p>
          <Link href={`/search?q=${encodeURIComponent(m.searchQuery)}`} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
            <Search className="h-4 w-4" /> Buscar &ldquo;{m.name}&rdquo;
          </Link>
        </div>

        {repGuias.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-bold tracking-tight">Guías útiles</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {repGuias.map((r) => r && (
                <Link key={r.slug} href={`/reparacion/${r.slug}`} className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary">{r.title}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      {relatedMarcas.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-10">
            <h2 className="text-lg font-bold tracking-tight">Otras marcas</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {relatedMarcas.map((r) => (
                <Link key={r.slug} href={`/marcas/${r.slug}`} className="group rounded-xl border border-border bg-card p-4 text-center transition hover:border-primary">
                  <span className="font-bold text-foreground group-hover:text-primary">{r.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
