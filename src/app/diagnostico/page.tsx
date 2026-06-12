import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { supabaseService } from "@/lib/supabase/service";
import { isFeatureEnabled } from "@/lib/partsvision/feature-flags";
import { canonicalMeta } from "@/lib/seo/canonical";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo/robots-meta";
import { Stethoscope, ArrowRight } from "lucide-react";

export const revalidate = 600;

async function typesWithSymptoms() {
  const { data } = await supabaseService
    .from("pv_symptoms")
    .select("machine_type_id, type:machine_type_id(name, slug)")
    .eq("status", "published");
  const map = new Map<string, { name: string; slug: string }>();
  for (const r of data ?? []) {
    const t = (r as { type: { name: string; slug: string } | { name: string; slug: string }[] }).type;
    const tt = Array.isArray(t) ? t[0] : t;
    if (tt?.slug) map.set(tt.slug, tt);
  }
  return Array.from(map.values());
}

export async function generateMetadata(): Promise<Metadata> {
  const enabled = await isFeatureEnabled("partsvision_diagnostics_enabled");
  const base: Metadata = {
    title: "Diagnóstico de fallas — ¿qué le pasa a tu máquina? | Madsjeez",
    description:
      "Elegí el síntoma de tu desmalezadora, motosierra o generador y te mostramos qué componentes conviene revisar y dónde conseguir el repuesto.",
    ...canonicalMeta("/diagnostico"),
  };
  if (!enabled) base.robots = ROBOTS_NOINDEX_FOLLOW;
  return base;
}

export default async function DiagnosticoPage() {
  if (!(await isFeatureEnabled("partsvision_diagnostics_enabled"))) notFound();
  const types = await typesWithSymptoms();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-2">
          <Stethoscope className="w-4 h-4" /> Diagnóstico
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">¿Qué le pasa a tu máquina?</h1>
        <p className="text-muted-foreground mb-8 max-w-xl">
          Elegí el tipo de máquina y el síntoma. Te mostramos qué conviene revisar y dónde
          conseguir el repuesto. <span className="text-amber-600 font-medium">No es un diagnóstico definitivo</span> —
          es una guía orientativa.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {types.map((t) => (
            <Link key={t.slug} href={`/diagnostico/${t.slug}`} className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40">
              <p className="font-bold text-foreground mb-2">{t.name}</p>
              <span className="inline-flex items-center gap-1 text-sm text-primary font-semibold">Ver síntomas <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
