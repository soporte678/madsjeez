import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { SiteCompanyFooter } from "@/components/seo/SiteCompanyFooter";
import { OptimizedProductImage } from "@/components/product/OptimizedProductImage";
import { getComprarLandingData } from "@/lib/seo/comprar-landings";
import { canonicalMeta } from "@/lib/seo/canonical";
import { SITE_URL } from "@/lib/seo/site";
import { ChevronRight, MapPin, ShoppingBag } from "lucide-react";

/** Sin DB en Docker build (Railway): páginas bajo demanda + caché ISR. */
export const dynamic = "force-dynamic";
export const revalidate = 86400;

type Props = { params: Promise<{ categoria: string; ciudad: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria, ciudad } = await params;
  const data = await getComprarLandingData(categoria, ciudad);
  if (!data) return { title: "Comprar online | MadsJeez" };

  const path = `/comprar/${categoria}/en/${ciudad}`;
  const title = `Comprar ${data.categoryName} en ${data.localityName} | MadsJeez Marketplace`;
  const description = `Encontrá ${data.productCount}+ ${data.categoryName} con envío a ${data.localityName}, ${data.provinceName}. Comprá en el marketplace MadsJeez con Mercado Pago.`;

  return {
    ...canonicalMeta(path),
    title,
    description,
    keywords: [
      `comprar ${data.categoryName} ${data.localityName}`,
      `marketplace ${data.localityName}`,
      data.categoryName,
      "madsjeez",
    ],
    openGraph: { title, description, url: `${SITE_URL}${path}` },
  };
}

export default async function ComprarLandingPage({ params }: Props) {
  const { categoria, ciudad } = await params;
  const data = await getComprarLandingData(categoria, ciudad);
  if (!data) notFound();

  const path = `/comprar/${categoria}/en/${ciudad}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Comprar ${data.categoryName} en ${data.localityName}`,
    description: `Catálogo de ${data.categoryName} en MadsJeez para ${data.localityName}`,
    url: `${SITE_URL}${path}`,
    about: {
      "@type": "Thing",
      name: data.categoryName,
    },
  };

  return (
    <main className="min-h-screen bg-mesh font-outfit text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <section className="bg-white border-b border-slate-200 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/category/${data.categorySlug}`}
            className="text-sm text-[#3483FA] hover:underline mb-2 inline-block"
          >
            ← {data.categoryName}
          </Link>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#f97316] mb-2 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {data.localityName}, {data.provinceName}
          </p>
          <h1 className="text-3xl md:text-4xl font-black font-montserrat text-slate-900">
            Comprar {data.categoryName} en {data.localityName}
          </h1>
          <p className="text-slate-600 mt-4 leading-relaxed">
            MadsJeez Marketplace reúne vendedores verificados de {data.categoryName} con stock
            actualizado y pagos con Mercado Pago. Enviamos a {data.localityName} y todo el país:{" "}
            <strong>{data.productCount} productos</strong> disponibles ahora en esta categoría.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-[#3483FA]" />
          Destacados en {data.categoryName}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.sampleProducts.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square bg-slate-50">
                {p.image && (
                  <OptimizedProductImage
                    src={p.image}
                    title={p.title}
                    category={data.categoryName}
                    fill
                    sizes="25vw"
                    className="object-contain p-2"
                  />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm line-clamp-2">{p.title}</p>
                <p className="font-bold text-[#3483FA] mt-1">
                  ${p.price.toLocaleString("es-AR")}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href={`/category/${data.categorySlug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3483FA] px-6 py-3 text-sm font-bold text-white"
          >
            Ver todos en {data.categoryName}
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/marketplace/${data.provinceSlug}/${data.localitySlug}`}
            className="text-sm font-semibold text-slate-700 hover:text-[#3483FA]"
          >
            Marketplace en {data.localityName}
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-12 text-slate-600 text-sm leading-relaxed space-y-3">
        <p>
          Si buscás <strong>{data.categoryName} en {data.localityName}</strong>, en MadsJeez podés
          comparar publicaciones, revisar vendedores y comprar con checkout unificado. Ideal para
          ferreterías, repuestos, tecnología y comercios que venden en {data.provinceName}.
        </p>
        <p>
          ¿Vendés {data.categoryName}?{" "}
          <Link href="/seller/register" className="text-[#3483FA] font-semibold hover:underline">
            Publicá gratis en MadsJeez
          </Link>{" "}
          y aparecé en búsquedas de tu zona.
        </p>
      </section>

      <footer className="border-t bg-white py-10">
        <div className="max-w-4xl mx-auto px-4">
          <SiteCompanyFooter />
        </div>
      </footer>
    </main>
  );
}
