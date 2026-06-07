import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { SiteCompanyFooter } from "@/components/seo/SiteCompanyFooter";
import { LazyRotatingProductCarousel } from "@/components/LazyRotatingProductCarousel";
import { ARGENTINA_PROVINCES, findProvince } from "@/lib/seo/argentina-locations";
import { canonicalMeta } from "@/lib/seo/canonical";
import { SITE_URL } from "@/lib/seo/site";
import { notFound } from "next/navigation";
import { MapPin, ChevronRight } from "lucide-react";

type Props = { params: Promise<{ provincia: string }> };

export function generateStaticParams() {
  return ARGENTINA_PROVINCES.map((p) => ({ provincia: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { provincia } = await params;
  const prov = findProvince(provincia);
  if (!prov) return { title: "Marketplace | MadsJeez" };
  const path = `/marketplace/${prov.slug}`;
  const title = `Marketplace en ${prov.name} — comprá y vendé online | MadsJeez`;
  const description = `Marketplace Argentina en ${prov.name}: catálogo, ofertas, envíos y vendedores verificados. Publicá tu negocio o comprá con Mercado Pago en MadsJeez.`;
  return {
    ...canonicalMeta(path),
    title,
    description,
    keywords: [
      `marketplace ${prov.name}`,
      `marketplace argentina ${prov.name}`,
      "comprar online",
      "vender online",
      "madsjeez",
    ],
    openGraph: { title, description, url: `${SITE_URL}${path}` },
  };
}

export default async function MarketplaceProvinciaPage({ params }: Props) {
  const { provincia } = await params;
  const prov = findProvince(provincia);
  if (!prov) notFound();

  return (
    <main className="min-h-screen bg-mesh font-outfit text-slate-900">
      <Navbar />
      <section className="bg-gradient-to-br from-[#0f172a] to-[#16213e] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#f97316] mb-2">
            Marketplace por provincia
          </p>
          <h1 className="text-3xl md:text-4xl font-black font-montserrat mb-4">
            Marketplace en {prov.name}
          </h1>
          <p className="text-slate-300 leading-relaxed max-w-2xl">
            MadsJeez conecta compradores y vendedores de {prov.name} con pagos seguros, catálogo por
            categorías y logística. Explorá productos con envío a tu zona o empezá a vender desde tu
            ciudad.
          </p>
        </div>
      </section>

      <section className="max-w-[1184px] mx-auto px-4 py-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#3483FA]" />
          Ciudades en {prov.name}
        </h2>
        <div className="flex flex-wrap gap-2">
          {prov.localities.map((loc) => (
            <Link
              key={loc.slug}
              href={`/marketplace/${prov.slug}/${loc.slug}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:border-[#3483FA] hover:text-[#3483FA] transition-colors"
            >
              Marketplace {loc.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-[1184px] mx-auto px-4">
        <LazyRotatingProductCarousel
          eager
          title={`Vendedores en ${prov.name}`}
          subtitle={`Productos publicados por sellers de ${prov.name}`}
          offset={prov.slug.length % 48}
          provinceSlug={prov.slug}
        />
      </section>
      <section className="max-w-[1184px] mx-auto px-4 mt-6">
        <LazyRotatingProductCarousel
          title="Más del catálogo nacional"
          subtitle="Productos de toda Argentina, también disponibles en tu zona"
          offset={prov.slug.length % 36}
        />
      </section>

      <section className="max-w-4xl mx-auto px-4 py-10 prose prose-slate">
        <h2 className="text-xl font-black">¿Por qué usar un marketplace en {prov.name}?</h2>
        <p className="text-slate-600 leading-relaxed">
          Un marketplace centraliza catálogo, pagos y reputación de vendedores. En {prov.name}, MadsJeez
          permite publicar productos, recibir pagos con Mercado Pago y llegar a compradores de todo el
          país con envíos configurables. Ideal para ferreterías, repuestos, tecnología y emprendimientos
          que hoy venden solo por redes sociales.
        </p>
        <Link
          href="/seller/register"
          className="inline-flex items-center gap-2 mt-4 rounded-xl bg-[#3483FA] px-6 py-3 text-sm font-bold text-white"
        >
          Vender en {prov.name}
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
