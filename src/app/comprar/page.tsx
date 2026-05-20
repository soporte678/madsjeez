import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { SiteCompanyFooter } from "@/components/seo/SiteCompanyFooter";
import { getCategoriesEligibleForComprar, allLocalitiesFlat } from "@/lib/seo/comprar-landings";
import { canonicalMeta } from "@/lib/seo/canonical";
import { MapPin, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...canonicalMeta("/comprar"),
  title: "Comprar por categoría y ciudad | MadsJeez Marketplace",
  description:
    "Encontrá productos por categoría en tu ciudad. Marketplace Argentina con envíos, Mercado Pago y vendedores verificados.",
};

export default async function ComprarIndexPage() {
  const [categories, localities] = await Promise.all([
    getCategoriesEligibleForComprar(),
    Promise.resolve(allLocalitiesFlat()),
  ]);

  return (
    <main className="min-h-screen bg-mesh font-outfit text-slate-900">
      <Navbar />
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h1 className="text-3xl font-black font-montserrat mb-3">Comprar en MadsJeez por zona</h1>
        <p className="text-slate-600 mb-8">
          Elegí una categoría y tu ciudad para ver el catálogo disponible con envío en Argentina.
        </p>

        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Tag className="h-5 w-5 text-[#3483FA]" />
          Categorías con stock
        </h2>
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.slice(0, 24).map((cat) => (
            <span
              key={cat.slug}
              className="rounded-full bg-white border border-slate-200 px-3 py-1 text-sm"
            >
              {cat.name} ({cat.count})
            </span>
          ))}
        </div>

        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#3483FA]" />
          Ejemplos por ciudad
        </h2>
        <ul className="space-y-2 text-sm">
          {categories.slice(0, 5).flatMap((cat) =>
            localities.slice(0, 3).map((loc) => (
              <li key={`${cat.slug}-${loc.slug}`}>
                <Link
                  href={`/comprar/${cat.slug}/en/${loc.slug}`}
                  className="text-[#3483FA] font-medium hover:underline"
                >
                  Comprar {cat.name} en {loc.name}
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
      <footer className="border-t bg-white py-10">
        <div className="max-w-4xl mx-auto px-4">
          <SiteCompanyFooter />
        </div>
      </footer>
    </main>
  );
}
