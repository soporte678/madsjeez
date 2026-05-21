import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { SiteCompanyFooter } from "@/components/seo/SiteCompanyFooter";
import { LazyRotatingProductCarousel } from "@/components/LazyRotatingProductCarousel";
import {
  ARGENTINA_PROVINCES,
  findLocality,
  findProvince,
} from "@/lib/seo/argentina-locations";
import { canonicalMeta } from "@/lib/seo/canonical";
import { SITE_URL } from "@/lib/seo/site";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

type Props = { params: Promise<{ provincia: string; localidad: string }> };

export function generateStaticParams() {
  const params: Array<{ provincia: string; localidad: string }> = [];
  for (const p of ARGENTINA_PROVINCES) {
    for (const l of p.localities) {
      params.push({ provincia: p.slug, localidad: l.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { provincia, localidad } = await params;
  const loc = findLocality(provincia, localidad);
  if (!loc) return { title: "Marketplace | MadsJeez" };
  const path = `/marketplace/${provincia}/${localidad}`;
  const title = `Marketplace en ${loc.name}, ${loc.provinceName} | MadsJeez Argentina`;
  const description = `Comprá y vendé en ${loc.name} (${loc.provinceName}) con MadsJeez: marketplace con catálogo, ofertas, Mercado Pago y envíos.`;
  return {
    ...canonicalMeta(path),
    title,
    description,
    keywords: [
      `marketplace ${loc.name}`,
      `marketplace ${loc.provinceName}`,
      "comprar online argentina",
      "vender online",
    ],
    openGraph: { title, description, url: `${SITE_URL}${path}` },
  };
}

export default async function MarketplaceLocalidadPage({ params }: Props) {
  const { provincia, localidad } = await params;
  const loc = findLocality(provincia, localidad);
  const prov = findProvince(provincia);
  if (!loc || !prov) notFound();

  const offset = (loc.slug.length + loc.provinceSlug.length) % 72;

  return (
    <main className="min-h-screen bg-mesh font-outfit text-slate-900">
      <Navbar />
      <section className="bg-gradient-to-br from-[#0f172a] to-[#1a1a2e] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/marketplace/${prov.slug}`}
            className="text-sm text-sky-300 hover:underline mb-3 inline-block"
          >
            ← Marketplace {prov.name}
          </Link>
          <h1 className="text-3xl md:text-4xl font-black font-montserrat mb-3">
            Marketplace en {loc.name}
          </h1>
          <p className="text-slate-300 leading-relaxed">
            Tienda online y marketplace para {loc.name}, {loc.provinceName}. Catálogo nacional con
            vendedores verificados, ofertas y pagos con Mercado Pago.
          </p>
        </div>
      </section>

      <section className="max-w-[1184px] mx-auto px-4">
        <LazyRotatingProductCarousel
          eager
          title={`Ofertas para ${loc.name}`}
          subtitle={`Envíos disponibles en ${loc.provinceName}`}
          offset={offset}
        />
      </section>

      <section className="max-w-3xl mx-auto px-4 py-10 text-slate-600 leading-relaxed space-y-4">
        <p>
          Si buscás <strong>marketplace en {loc.name}</strong>, MadsJeez agrupa productos de múltiples
          vendedores en un solo lugar: comparás precios, revisás reputación y comprás con checkout
          unificado.
        </p>
        <p>
          Para comercios de {loc.name} que quieren vender online sin armar una tienda desde cero, el
          panel de vendedor permite publicar catálogo, sincronizar stock y usar MADSJEEZ Ads.
        </p>
        <Link
          href="/seller/register"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ff9100] px-6 py-3 text-sm font-bold text-white"
        >
          Publicar productos desde {loc.name}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="border-t bg-white py-10">
        <div className="max-w-4xl mx-auto px-4">
          <SiteCompanyFooter />
        </div>
      </footer>
    </main>
  );
}
