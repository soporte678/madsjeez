import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { supabaseService } from "@/lib/supabase/service";
import { isPartsVisionEnabled } from "@/lib/partsvision/feature-flags";
import { canonicalMeta } from "@/lib/seo/canonical";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo/robots-meta";

export const revalidate = 600;
const SITE = "https://www.madsjeez.com.ar";

type ModelRow = { id: string; model_name: string; slug: string; engine_cc: number | null; brand: { name: string; slug: string } | null };

async function getType(slug: string) {
  const { data } = await supabaseService.from("pv_machine_types").select("id, name, slug, description").eq("slug", slug).eq("active", true).maybeSingle();
  return data;
}
async function getModels(typeId: string): Promise<ModelRow[]> {
  const { data } = await supabaseService
    .from("pv_machine_models")
    .select("id, model_name, slug, engine_cc, brand:brand_id(name, slug)")
    .eq("machine_type_id", typeId)
    .neq("status", "draft")
    .order("model_name")
    .limit(300);
  return (data as unknown as ModelRow[]) ?? [];
}

export async function generateMetadata({ params }: { params: Promise<{ tipo: string }> }): Promise<Metadata> {
  const { tipo } = await params;
  const [enabled, type] = await Promise.all([isPartsVisionEnabled(), getType(tipo)]);
  if (!type) return { title: "Repuestos | Madsjeez", robots: ROBOTS_NOINDEX_FOLLOW };
  const models = await getModels(type.id);
  const base: Metadata = {
    title: `Repuestos para ${type.name} — modelos y despieces | Madsjeez`,
    description: `Encontrá repuestos para ${type.name.toLowerCase()} por marca y modelo. Explorá el despiece e identificá la pieza exacta en Madsjeez.`,
    ...canonicalMeta(`/maquinas/${tipo}`),
  };
  if (!enabled || models.length < 1) base.robots = ROBOTS_NOINDEX_FOLLOW;
  return base;
}

export default async function MachineTypePage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  if (!(await isPartsVisionEnabled())) notFound();
  const type = await getType(tipo);
  if (!type) notFound();
  const models = await getModels(type.id);

  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Repuestos", item: `${SITE}/repuestos` },
      { "@type": "ListItem", position: 3, name: type.name, item: `${SITE}/maquinas/${tipo}` },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link href="/" className="hover:text-foreground">Inicio</Link><span>›</span>
          <Link href="/repuestos" className="hover:text-foreground">Repuestos</Link><span>›</span>
          <span className="text-foreground font-medium">{type.name}</span>
        </nav>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Repuestos para {type.name.toLowerCase()}</h1>
        {type.description && <p className="text-muted-foreground mb-8 max-w-2xl">{type.description}</p>}

        {models.length === 0 ? (
          <p className="text-muted-foreground">Catálogo en carga para este tipo de máquina.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {models.map((m) => (
              <Link key={m.id} href={`/modelos/${m.brand?.slug}/${m.slug}`} className="rounded-xl border border-border bg-card p-4 hover:border-primary/40">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{m.brand?.name}</p>
                <p className="font-semibold text-foreground">{m.model_name}</p>
                {m.engine_cc && <p className="text-xs text-muted-foreground mt-0.5">{m.engine_cc} cc</p>}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
