import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { supabaseService } from "@/lib/supabase/service";
import { isFeatureEnabled } from "@/lib/partsvision/feature-flags";
import { canonicalMeta } from "@/lib/seo/canonical";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo/robots-meta";
import { AlertTriangle, ChevronRight } from "lucide-react";

export const revalidate = 600;
const SITE = "https://www.madsjeez.com.ar";

async function getType(slug: string) {
  const { data } = await supabaseService.from("pv_machine_types").select("id, name, slug").eq("slug", slug).eq("active", true).maybeSingle();
  return data;
}
async function getSymptoms(typeId: string) {
  const { data } = await supabaseService
    .from("pv_symptoms").select("title, slug, description, safety_warning")
    .eq("machine_type_id", typeId).eq("status", "published").order("sort_order");
  return data ?? [];
}

export async function generateMetadata({ params }: { params: Promise<{ tipo: string }> }): Promise<Metadata> {
  const { tipo } = await params;
  const [enabled, type] = await Promise.all([isFeatureEnabled("partsvision_diagnostics_enabled"), getType(tipo)]);
  if (!type) return { title: "Diagnóstico | Madsjeez", robots: ROBOTS_NOINDEX_FOLLOW };
  const symptoms = await getSymptoms(type.id);
  const base: Metadata = {
    title: `Fallas comunes de ${type.name.toLowerCase()} — diagnóstico | Madsjeez`,
    description: `Síntomas frecuentes en ${type.name.toLowerCase()}: no arranca, se apaga, pierde potencia y más. Qué revisar y dónde conseguir el repuesto.`,
    ...canonicalMeta(`/diagnostico/${tipo}`),
  };
  if (!enabled || symptoms.length < 1) base.robots = ROBOTS_NOINDEX_FOLLOW;
  return base;
}

export default async function DiagnosticoTipoPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  if (!(await isFeatureEnabled("partsvision_diagnostics_enabled"))) notFound();
  const type = await getType(tipo);
  if (!type) notFound();
  const symptoms = await getSymptoms(type.id);

  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Diagnóstico", item: `${SITE}/diagnostico` },
      { "@type": "ListItem", position: 3, name: type.name, item: `${SITE}/diagnostico/${tipo}` },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link href="/" className="hover:text-foreground">Inicio</Link><span>›</span>
          <Link href="/diagnostico" className="hover:text-foreground">Diagnóstico</Link><span>›</span>
          <span className="text-foreground font-medium">{type.name}</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Fallas comunes — {type.name}</h1>
        <p className="text-muted-foreground mb-6">Elegí el síntoma que tenés.</p>
        <div className="space-y-2">
          {symptoms.map((s) => (
            <Link key={s.slug} href={`/diagnostico/${tipo}/${s.slug}`} className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/40">
              <div>
                <p className="font-semibold text-foreground">{s.title}</p>
                {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                {s.safety_warning && <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {s.safety_warning}</p>}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0" />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
