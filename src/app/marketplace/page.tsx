import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { SiteCompanyFooter } from "@/components/seo/SiteCompanyFooter";
import { ARGENTINA_PROVINCES } from "@/lib/seo/argentina-locations";
import { canonicalMeta } from "@/lib/seo/canonical";
import { MapPin, ShieldCheck, Truck, CreditCard } from "lucide-react";

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

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Vendedores verificados" },
  { icon: Truck, label: "Envíos a todo el país" },
  { icon: CreditCard, label: "Pagos seguros" },
];

export default function MarketplaceIndexPage() {
  return (
    <main className="min-h-screen bg-mesh font-outfit text-slate-900">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white pt-14 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#f97316] mb-3">
            Cobertura nacional
          </p>
          <h1 className="text-3xl md:text-5xl font-black font-montserrat mb-4 leading-tight">
            Marketplace MadsJeez<br className="hidden md:block" /> en Argentina
          </h1>
          <p className="text-slate-300 leading-relaxed mb-8 max-w-xl mx-auto text-sm md:text-base">
            Comprá y vendé online con envíos, vendedores verificados y pagos seguros en todo el país.
          </p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-slate-300">
                <Icon className="h-4 w-4 text-[#3483FA] shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Province grid */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
          Elegí tu provincia
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ARGENTINA_PROVINCES.map((prov) => (
            <Link
              key={prov.slug}
              href={`/marketplace/${prov.slug}`}
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm hover:border-[#3483FA] hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3483FA]/10 group-hover:bg-[#3483FA]/20 transition-colors">
                  <MapPin className="h-4 w-4 text-[#3483FA]" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{prov.name}</p>
                  <p className="text-xs text-slate-400">{prov.localities.length} ciudades</p>
                </div>
              </div>
              <span className="text-slate-300 group-hover:text-[#3483FA] text-lg transition-colors ml-2">›</span>
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
