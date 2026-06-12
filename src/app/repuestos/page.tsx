import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { isPartsVisionEnabled, isFeatureEnabled } from "@/lib/partsvision/feature-flags";
import { supabaseService } from "@/lib/supabase/service";
import { canonicalMeta } from "@/lib/seo/canonical";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo/robots-meta";
import { Wrench, ArrowRight } from "lucide-react";

export const revalidate = 300;
const SITE = "https://www.madsjeez.com.ar";

/** Cuenta modelos publicados — gate de indexación (no indexar si vacío). */
async function publishedModelCount(): Promise<number> {
  try {
    const { count } = await supabaseService
      .from("pv_machine_models")
      .select("id", { count: "exact", head: true })
      .neq("status", "draft");
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const [enabled, models] = await Promise.all([isPartsVisionEnabled(), publishedModelCount()]);
  const base: Metadata = {
    title: "Repuestos por máquina — PartsVision | Madsjeez",
    description:
      "Explorá tu máquina, identificá la pieza y encontrá quién la vende. Repuestos de desmalezadoras, motosierras, generadores y motores en Madsjeez.",
    ...canonicalMeta("/repuestos"),
  };
  // Indexable solo si el sector está activo Y hay modelos publicados.
  if (!enabled || models < 1) base.robots = ROBOTS_NOINDEX_FOLLOW;
  return base;
}

export default async function RepuestosPage() {
  const [enabled, seoFlag] = await Promise.all([
    isPartsVisionEnabled(),
    isFeatureEnabled("partsvision_seo_enabled"),
  ]);

  // PartsVision aún apagado → landing "próximamente" (noindex), sin romper nada.
  if (!enabled) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
            <Wrench className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            PartsVision — Repuestos por máquina
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8">
            Estamos construyendo el explorador técnico de repuestos: elegí tu máquina,
            mirá el despiece e identificá la pieza exacta para comprarla. Muy pronto.
          </p>
          <Link
            href="/search?category=accesorios-y-repuestos-para-herramientas"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            Ver repuestos disponibles ahora
            <ArrowRight className="w-4 h-4" />
          </Link>
        </main>
      </div>
    );
  }

  // Activo: lista de tipos de máquina + marcas con contenido publicado.
  const { data: types } = await supabaseService
    .from("pv_machine_types")
    .select("name, slug")
    .eq("active", true)
    .order("name");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
          Repuestos por máquina
        </h1>
        <p className="text-muted-foreground mb-8">
          Explorá tu máquina, identificá la pieza y encontrá quién la vende.
        </p>
        {types && types.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {types.map((t) => (
              <Link
                key={t.slug}
                href={`/maquinas/${t.slug}`}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 font-semibold text-foreground"
              >
                {t.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Catálogo en carga. Volvé pronto.</p>
        )}
        {seoFlag ? null : null}
      </main>
    </div>
  );
}
