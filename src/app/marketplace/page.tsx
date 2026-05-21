import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { SiteCompanyFooter } from "@/components/seo/SiteCompanyFooter";
import { ARGENTINA_PROVINCES } from "@/lib/seo/argentina-locations";
import { canonicalMeta } from "@/lib/seo/canonical";
import { MapPin } from "lucide-react";

export const metadata: Metadata = {
  ...canonicalMeta("/marketplace"),
  title: "Marketplace Argentina por provincia y ciudad | MadsJeez",
  description:
    "Encontrá el marketplace MadsJeez en tu provincia y ciudad: comprá y vendé online con catálogo, ofertas y Mercado Pago en todo el país.",
  keywords: [
    "marketplace argentina",
    "marketplace por provincia",
    "comprar online argentina",
    "vender online",
  ],
};

export default function MarketplaceIndexPage() {
  return (
    <main className="min-h-screen bg-mesh font-outfit text-slate-900">
      <Navbar />
      <section className="max-w-4xl mx-auto px-4 py-14">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#f97316] mb-2">
          Cobertura nacional
        </p>
        <h1 className="text-3xl md:text-4xl font-black font-montserrat mb-4">
          Marketplace MadsJeez en Argentina
        </h1>
        <p className="text-slate-600 leading-relaxed mb-8">
          Elegí tu provincia o ciudad para ver cómo comprar y vender en el marketplace con envíos,
          vendedores verificados y pagos seguros.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {ARGENTINA_PROVINCES.map((prov) => (
            <Link
              key={prov.slug}
              href={`/marketplace/${prov.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#3483FA] hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <MapPin className="h-4 w-4 text-[#3483FA]" />
                Marketplace {prov.name}
              </div>
              <p className="text-sm text-slate-500 mt-2">
                {prov.localities.length} ciudades destacadas
              </p>
            </Link>
          ))}
        </div>
      </section>
      <footer className="border-t bg-white py-10">
        <div className="max-w-4xl mx-auto px-4">
          <SiteCompanyFooter />
        </div>
      </footer>
    </main>
  );
}
