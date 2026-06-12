import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { supabaseService } from "@/lib/supabase/service";
import { isFeatureEnabled } from "@/lib/partsvision/feature-flags";
import { canonicalMeta } from "@/lib/seo/canonical";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo/robots-meta";
import { AlertTriangle, Wrench, ArrowUpRight, ShieldAlert } from "lucide-react";

export const revalidate = 600;
const SITE = "https://www.madsjeez.com.ar";
function money(n: number) { return `$${Number(n || 0).toLocaleString("es-AR")}`; }

async function getSymptom(typeSlug: string, sintomaSlug: string) {
  const { data: type } = await supabaseService.from("pv_machine_types").select("id, name, slug").eq("slug", typeSlug).maybeSingle();
  if (!type) return null;
  const { data: symptom } = await supabaseService
    .from("pv_symptoms").select("id, title, slug, description, safety_warning")
    .eq("machine_type_id", type.id).eq("slug", sintomaSlug).eq("status", "published").maybeSingle();
  if (!symptom) return null;
  const { data: checks } = await supabaseService
    .from("pv_symptom_checks").select("component, what_to_check, part_query, is_safety").eq("symptom_id", symptom.id).order("sort_order");
  return { type, symptom, checks: checks ?? [] };
}

/** Productos reales del marketplace para un término (carburador, bujía…). */
async function productsFor(term: string) {
  if (!term) return [];
  const { data } = await supabaseService
    .from("products")
    .select('id, title, price, product_images(url, "order")')
    .ilike("title", `%${term}%`)
    .eq("is_active", true).gt("stock", 0).limit(3);
  return (data ?? []).map((p) => {
    const imgs = (p as { product_images?: { url: string; order: number }[] }).product_images ?? [];
    const img = [...imgs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]?.url ?? null;
    return { id: p.id, title: p.title, price: p.price, image: img };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ tipo: string; sintoma: string }> }): Promise<Metadata> {
  const { tipo, sintoma } = await params;
  const [enabled, found] = await Promise.all([isFeatureEnabled("partsvision_diagnostics_enabled"), getSymptom(tipo, sintoma)]);
  if (!found) return { title: "Diagnóstico | Madsjeez", robots: ROBOTS_NOINDEX_FOLLOW };
  const base: Metadata = {
    title: `${found.type.name}: ${found.symptom.title} — qué revisar | Madsjeez`,
    description: `Tu ${found.type.name.toLowerCase()} ${found.symptom.title.toLowerCase()}: componentes que conviene revisar y repuestos relacionados en Madsjeez.`,
    ...canonicalMeta(`/diagnostico/${tipo}/${sintoma}`),
  };
  if (!enabled) base.robots = ROBOTS_NOINDEX_FOLLOW;
  return base;
}

export default async function SintomaPage({ params }: { params: Promise<{ tipo: string; sintoma: string }> }) {
  const { tipo, sintoma } = await params;
  if (!(await isFeatureEnabled("partsvision_diagnostics_enabled"))) notFound();
  const found = await getSymptom(tipo, sintoma);
  if (!found) notFound();
  const { type, symptom, checks } = found;

  // Productos reales por cada componente (en paralelo)
  const productsByCheck = await Promise.all(checks.map((c) => productsFor(c.part_query || "")));

  const faqJsonLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [{
      "@type": "Question",
      name: `Mi ${type.name.toLowerCase()} ${symptom.title.toLowerCase()}, ¿qué reviso?`,
      acceptedAnswer: { "@type": "Answer", text: checks.map((c) => c.component).join(", ") + ". Verificá medidas y estado antes de reemplazar." },
    }],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link href="/" className="hover:text-foreground">Inicio</Link><span>›</span>
          <Link href="/diagnostico" className="hover:text-foreground">Diagnóstico</Link><span>›</span>
          <Link href={`/diagnostico/${tipo}`} className="hover:text-foreground">{type.name}</Link><span>›</span>
          <span className="text-foreground font-medium">{symptom.title}</span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">{type.name}: {symptom.title.toLowerCase()}</h1>
        {symptom.description && <p className="text-muted-foreground mb-3">{symptom.description}</p>}

        {symptom.safety_warning && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 mb-6 flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">{symptom.safety_warning}</p>
          </div>
        )}

        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 mb-6">
          <p className="text-sm text-foreground">
            <span className="font-bold">Componentes que conviene revisar.</span> Esto es una guía orientativa,
            no un diagnóstico definitivo. Verificá medidas y estado antes de reemplazar.
          </p>
        </div>

        <div className="space-y-4">
          {checks.map((c, i) => (
            <section key={i} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                {c.is_safety ? <ShieldAlert className="w-5 h-5 text-amber-600" /> : <Wrench className="w-5 h-5 text-primary" />}
                {c.component}
              </h2>
              {c.what_to_check && <p className="text-sm text-muted-foreground mt-1">{c.what_to_check}</p>}
              {productsByCheck[i].length > 0 && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {productsByCheck[i].map((p) => (
                    <Link key={p.id} href={`/product/${p.id}`} className="flex gap-2 rounded-lg border border-border p-2 hover:border-primary/40">
                      <div className="h-10 w-10 shrink-0 rounded bg-muted overflow-hidden">
                        {p.image ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={p.image} alt="" className="h-full w-full object-cover" />) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground line-clamp-2">{p.title}</p>
                        <p className="text-xs font-bold text-foreground">{money(p.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-amber-600 mt-6">
          <AlertTriangle className="w-3.5 h-3.5" /> Si no tenés experiencia con motores, consultá a un técnico.
        </p>
      </main>
    </div>
  );
}
