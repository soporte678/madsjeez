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

      <section className="bg-gradient-to-br from-[#0f172a] to-[#16213e] text-white py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 items-center">
          <div className="relative h-24 w-24 shrink-0 rounded-2xl overflow-hidden border-2 border-white/20 bg-white/10">
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
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {store.productCount} productos
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                {store.totalSales} ventas
              </span>
              {memberSince && <span>Miembro desde {memberSince}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        {store.products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {store.products.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="relative aspect-square bg-slate-50">
                  {p.image && (
                    <OptimizedProductImage
                      src={p.image}
                      title={p.title}
                      category={p.categoryName}
                      fill
                      sizes="(max-width:768px) 50vw, 25vw"
                      className="object-contain p-2 group-hover:scale-105 transition-transform"
                    />
                  )}
                </div>
                <div className="p-3">
                  <h2 className="text-sm line-clamp-2 min-h-[40px]">{p.title}</h2>
                  <p className="text-lg font-bold text-[#3483FA] mt-1">
                    ${p.price.toLocaleString("es-AR")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-600">Esta tienda aún no tiene productos publicados.</p>
        )}

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href={`/search?seller=${store.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3483FA] px-6 py-3 text-sm font-bold text-white"
          >
            Ver todo el catálogo
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link href="/seller/register" className="text-sm font-semibold text-[#3483FA] hover:underline">
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
