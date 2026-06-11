import type { Metadata } from "next";
import { supabaseService } from "@/lib/supabase/service";
import { canonicalMeta } from "@/lib/seo/canonical";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo/robots-meta";
import { CompatibilityWizard } from "@/components/compatibility/CompatibilityWizard";
import { Header } from "@/components/Header";
import { Wrench } from "lucide-react";

export const revalidate = 1800;
const SITE = "https://www.madsjeez.com.ar";

/** Cuenta compatibilidades cargadas para decidir si la página es indexable. */
async function countCompat(): Promise<number> {
  try {
    const { count } = await supabaseService
      .from("compatibility_links")
      .select("id", { count: "exact", head: true })
      .neq("status", "rejected");
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const n = await countCompat();
  const base: Metadata = {
    title: "¿Para qué máquina necesitás el repuesto? | Buscador de compatibilidades | Madsjeez",
    description:
      "Encontrá el repuesto compatible con tu desmalezadora, motosierra, generador o motobomba. Buscá por tipo de máquina, marca y modelo en Madsjeez.",
    ...canonicalMeta("/herramientas/compatibilidades"),
  };
  // Gate de indexación: sin datos cargados, no indexar (evita página vacía).
  if (n < 5) base.robots = ROBOTS_NOINDEX_FOLLOW;
  return base;
}

export default async function CompatibilidadesPage() {
  // Tipos de máquina reales ya cargados (para el primer paso del wizard).
  let machineTypes: string[] = [];
  try {
    const { data } = await supabaseService.rpc("compat_options", { p_level: "type", p_type: null, p_brand: null });
    machineTypes = (data ?? []).map((r: { value: string }) => r.value);
  } catch {
    /* vacío */
  }

  const hasData = machineTypes.length > 0;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Buscador de compatibilidades de repuestos — Madsjeez",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${SITE}/herramientas/compatibilidades`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "ARS" },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-2">
          <Wrench className="w-4 h-4" />
          Herramienta gratis
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
          ¿Para qué máquina necesitás el repuesto?
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-8 max-w-2xl">
          Elegí el tipo de máquina, la marca y el modelo, y te mostramos los repuestos
          compatibles cargados por los vendedores. Verificá siempre las medidas antes de comprar.
        </p>

        {hasData ? (
          <CompatibilityWizard initialTypes={machineTypes} />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <Wrench className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Todavía no hay compatibilidades cargadas
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Los vendedores están cargando para qué máquinas sirve cada repuesto. Volvé pronto,
              o mientras tanto explorá las categorías de repuestos de jardín.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
