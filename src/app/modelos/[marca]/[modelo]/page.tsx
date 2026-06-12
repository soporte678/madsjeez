import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { supabaseService } from "@/lib/supabase/service";
import { isPartsVisionEnabled } from "@/lib/partsvision/feature-flags";
import { canonicalMeta } from "@/lib/seo/canonical";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo/robots-meta";
import { Layers, FileText } from "lucide-react";

export const revalidate = 600;
const SITE = "https://www.madsjeez.com.ar";

async function getModel(marca: string, modelo: string) {
  const { data: brand } = await supabaseService.from("pv_brands").select("id, name, slug").eq("slug", marca).maybeSingle();
  if (!brand) return null;
  const { data: model } = await supabaseService
    .from("pv_machine_models")
    .select("id, model_name, slug, engine_cc, power_hp, engine_model, status, notes")
    .eq("brand_id", brand.id).eq("slug", modelo).neq("status", "draft").maybeSingle();
  if (!model) return null;
  return { brand, model };
}

export async function generateMetadata({ params }: { params: Promise<{ marca: string; modelo: string }> }): Promise<Metadata> {
  const { marca, modelo } = await params;
  const [enabled, found] = await Promise.all([isPartsVisionEnabled(), getModel(marca, modelo)]);
  if (!found) return { title: "Modelo | Madsjeez", robots: ROBOTS_NOINDEX_FOLLOW };
  const { count } = await supabaseService.from("pv_diagrams").select("id", { count: "exact", head: true }).eq("model_id", found.model.id).eq("publication_status", "published");
  const base: Metadata = {
    title: `Repuestos y despiece ${found.brand.name} ${found.model.model_name} | Madsjeez`,
    description: `Despiece y repuestos compatibles para ${found.brand.name} ${found.model.model_name}. Identificá la pieza por conjunto y encontrá quién la vende.`,
    ...canonicalMeta(`/modelos/${marca}/${modelo}`),
  };
  if (!enabled || (count ?? 0) < 1) base.robots = ROBOTS_NOINDEX_FOLLOW;
  return base;
}

export default async function ModelPage({ params }: { params: Promise<{ marca: string; modelo: string }> }) {
  const { marca, modelo } = await params;
  if (!(await isPartsVisionEnabled())) notFound();
  const found = await getModel(marca, modelo);
  if (!found) notFound();
  const { brand, model } = found;

  const [{ data: assemblies }, { data: diagrams }] = await Promise.all([
    supabaseService.from("pv_assemblies").select("id, name, slug").eq("model_id", model.id).eq("active", true).order("sort_order"),
    supabaseService.from("pv_diagrams").select("id, title").eq("model_id", model.id).eq("publication_status", "published").limit(50),
  ]);

  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Repuestos", item: `${SITE}/repuestos` },
      { "@type": "ListItem", position: 3, name: brand.name, item: `${SITE}/marcas/${brand.slug}` },
      { "@type": "ListItem", position: 4, name: model.model_name, item: `${SITE}/modelos/${marca}/${modelo}` },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link href="/" className="hover:text-foreground">Inicio</Link><span>›</span>
          <Link href="/repuestos" className="hover:text-foreground">Repuestos</Link><span>›</span>
          <span className="text-foreground font-medium">{brand.name} {model.model_name}</span>
        </nav>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Despiece {brand.name} {model.model_name}</h1>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-8">
          {model.engine_cc && <span className="rounded-full border border-border px-2.5 py-1">{model.engine_cc} cc</span>}
          {model.power_hp && <span className="rounded-full border border-border px-2.5 py-1">{model.power_hp} HP</span>}
          {model.engine_model && <span className="rounded-full border border-border px-2.5 py-1">Motor {model.engine_model}</span>}
        </div>

        {diagrams && diagrams.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Despieces</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {diagrams.map((d) => (
                <Link key={d.id} href={`/despieces/${d.id}`} className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 font-semibold text-foreground">{d.title}</Link>
              ))}
            </div>
          </section>
        )}

        {assemblies && assemblies.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Conjuntos</h2>
            <div className="flex flex-wrap gap-2">
              {assemblies.map((a) => (
                <span key={a.id} className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground">{a.name}</span>
              ))}
            </div>
          </section>
        )}

        {(!diagrams || diagrams.length === 0) && (
          <p className="text-muted-foreground">El despiece de este modelo está en preparación.</p>
        )}
      </main>
    </div>
  );
}
