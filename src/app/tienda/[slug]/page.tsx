import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { SiteCompanyFooter } from "@/components/seo/SiteCompanyFooter";
import { OptimizedProductImage } from "@/components/product/OptimizedProductImage";
import { getPublicStoreBySlug } from "@/lib/public-store";
import { canonicalMeta } from "@/lib/seo/canonical";
import { SITE_URL } from "@/lib/seo/site";
import { Store, Package, Star, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getPublicStoreBySlug(slug);
  if (!store) return { title: "Tienda no encontrada | MadsJeez" };

  const path = `/tienda/${slug}`;
  const title = `${store.displayName} — Tienda oficial`;
  const description =
    store.description?.slice(0, 160) ||
    `Comprá en la tienda ${store.displayName} en MadsJeez Marketplace Argentina. ${store.productCount} productos con pagos seguros.`;

  return {
    ...canonicalMeta(path),
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      type: "website",
    },
  };
}

export default async function TiendaPublicaPage({ params }: Props) {
  const { slug } = await params;
  const store = await getPublicStoreBySlug(slug);
  if (!store) notFound();

  const memberSince = store.sellerSince
    ? new Date(store.sellerSince).toLocaleDateString("es-AR", { month: "long", year: "numeric" })
    : null;

  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: store.displayName,
    url: `${SITE_URL}/tienda/${store.storeSlug}`,
    description: store.description || undefined,
    image: store.image || `${SITE_URL}/brand/madsjeez-logo.png`,
    parentOrganization: {
      "@type": "Organization",
      name: "MadsJeez Marketplace",
      url: SITE_URL,
    },
  };

  return (
    <main className="min-h-screen bg-mesh font-outfit text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      <Navbar />

      {/* Store hero */}
      <section className="bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#0f172a] text-white pt-10 pb-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="relative h-24 w-24 shrink-0 rounded-2xl overflow-hidden border-2 border-white/20 bg-white/10 shadow-xl">
            {store.image ? (
              <Image src={store.image} alt={store.displayName} fill className="object-cover" sizes="96px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Store className="h-10 w-10 text-white/60" />
              </div>
            )}
          </div>
          <div className="text-center md:text-left flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#f97316] mb-1">
              Tienda verificada · MadsJeez Marketplace
            </p>
            <h1 className="text-2xl md:text-4xl font-black font-montserrat">{store.displayName}</h1>
            {store.description && (
              <p className="text-slate-300 mt-2 max-w-2xl text-sm leading-relaxed">{store.description}</p>
            )}
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                <Package className="h-3.5 w-3.5 text-[#3483FA]" />
                {store.productCount} productos
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                <Star className="h-3.5 w-3.5 text-yellow-400" />
                {store.totalSales} ventas
              </span>
              {memberSince && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                  Desde {memberSince}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        {store.products.length > 0 ? (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
              Productos destacados
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {store.products.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="group flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-[#3483FA]/40 transition-all duration-200 overflow-hidden"
                >
                  <div className="relative aspect-square bg-slate-50">
                    {p.image ? (
                      <OptimizedProductImage
                        src={p.image}
                        title={p.title}
                        category={p.categoryName}
                        fill
                        sizes="(max-width:768px) 50vw, 25vw"
                        className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-10 w-10 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 p-3 gap-1">
                    <h2 className="text-xs font-medium text-slate-700 line-clamp-2 leading-snug min-h-[32px]">
                      {p.title}
                    </h2>
                    <p className="text-base font-bold text-[#3483FA] mt-auto">
                      ${p.price.toLocaleString("es-AR")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">Esta tienda aún no tiene productos</p>
            <p className="text-sm text-slate-400 mt-1">Volvé pronto para ver las novedades.</p>
          </div>
        )}

        <div className="mt-12 flex flex-wrap gap-3 justify-center">
          <Link
            href={`/search?seller=${store.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3483FA] px-6 py-3 text-sm font-bold text-white hover:bg-[#2968c8] transition-colors shadow-sm"
          >
            Ver todo el catálogo
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/seller/register"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-[#3483FA] hover:text-[#3483FA] transition-colors"
          >
            Abrí tu tienda en MadsJeez
          </Link>
        </div>
      </section>

      <footer className="border-t bg-white py-10">
        <div className="max-w-5xl mx-auto px-4">
          <SiteCompanyFooter />
        </div>
      </footer>
    </main>
  );
}
