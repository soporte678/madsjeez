import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Search, Store, TrendingUp } from "lucide-react";
import { sellerSegmentBySlug, sellerSegments } from "@/lib/seller-acquisition";

type Props = { params: Promise<{ rubro: string }> };

export function generateStaticParams() {
  return sellerSegments.map((segment) => ({ rubro: segment.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rubro } = await params;
  const segment = sellerSegmentBySlug[rubro];
  if (!segment) return {};
  return {
    title: `Vender ${segment.name} en MadsJeez | Marketplace Argentina`,
    description: `${segment.headline} Sumate al marketplace argentino con pagos, SEO, dashboard y roadmap de herramientas para vendedores.`,
    alternates: { canonical: `/vender/${segment.slug}` },
  };
}

export default async function SellerSegmentPage({ params }: Props) {
  const { rubro } = await params;
  const segment = sellerSegmentBySlug[rubro];
  if (!segment) notFound();

  return (
    <main className="bg-[#07090f] text-white">
      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#07111f,#10233d_55%,#07111f)]">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-200">Landing SEO por rubro</p>
          <h1 className="mt-5 max-w-5xl text-4xl font-black leading-tight md:text-6xl">
            {segment.headline}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">{segment.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/vender?utm_source=seo&utm_medium=organic&utm_campaign=${segment.slug}#registro`} className="inline-flex items-center gap-2 bg-cyan-300 px-6 py-3 font-black text-slate-950">
              Quiero vender {segment.name.toLowerCase()} <ArrowRight size={18} />
            </Link>
            <Link href="/vender/auditoria" className="inline-flex items-center gap-2 border border-white/25 bg-white/10 px-6 py-3 font-bold">
              Auditar mi comercio
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-16 md:grid-cols-3">
        {[
          { icon: Store, title: "Categorias con demanda", items: segment.categories },
          { icon: Search, title: "Problemas que resolvemos", items: segment.painPoints },
          { icon: TrendingUp, title: "Ventaja MadsJeez", items: segment.madsjeezEdge },
        ].map(({ icon: Icon, title, items }) => (
          <article key={title} className="border border-white/12 bg-white/[0.04] p-6">
            <Icon className="text-cyan-300" size={24} />
            <h2 className="mt-4 text-xl font-black">{title}</h2>
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={16} />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="border-y border-white/10 bg-[#101827]">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-3xl font-black md:text-5xl">Roadmap especifico para {segment.name.toLowerCase()}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {segment.roadmap.map((item) => (
              <div key={item} className="border border-cyan-300/20 bg-cyan-400/10 p-5 text-sm font-semibold text-cyan-50">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
