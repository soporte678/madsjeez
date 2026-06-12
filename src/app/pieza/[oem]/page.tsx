import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { supabaseService } from "@/lib/supabase/service";
import { isPartsVisionEnabled } from "@/lib/partsvision/feature-flags";
import { canonicalMeta } from "@/lib/seo/canonical";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo/robots-meta";
import { ArrowUpRight } from "lucide-react";

export const revalidate = 600;
const SITE = "https://www.madsjeez.com.ar";

function normOem(s: string) { return s.toLowerCase().replace(/[^a-z0-9]/g, ""); }
function money(n: number) { return `$${Number(n || 0).toLocaleString("es-AR")}`; }

async function getPartByOem(oem: string) {
  const { data: hit } = await supabaseService
    .from("pv_oem_part_numbers").select("part_id, oem_number").eq("normalized_oem", normOem(oem)).maybeSingle();
  if (!hit) return null;
  const { data: part } = await supabaseService
    .from("pv_technical_parts").select("id, canonical_name, part_type, description, image_url, status")
    .eq("id", hit.part_id).eq("status", "published").maybeSingle();
  if (!part) return null;
  return { part, oem: hit.oem_number };
}

export async function generateMetadata({ params }: { params: Promise<{ oem: string }> }): Promise<Metadata> {
  const { oem } = await params;
  const [enabled, found] = await Promise.all([isPartsVisionEnabled(), getPartByOem(oem)]);
  if (!found) return { title: "Repuesto | Madsjeez", robots: ROBOTS_NOINDEX_FOLLOW };
  const base: Metadata = {
    title: `${found.part.canonical_name} — código ${found.oem} | Madsjeez`,
    description: `Repuesto ${found.part.canonical_name} (OEM ${found.oem}). Compatibilidades y vendedores con stock en Madsjeez.`,
    ...canonicalMeta(`/pieza/${oem}`),
  };
  if (!enabled) base.robots = ROBOTS_NOINDEX_FOLLOW;
  return base;
}

export default async function PartByOemPage({ params }: { params: Promise<{ oem: string }> }) {
  const { oem } = await params;
  if (!(await isPartsVisionEnabled())) notFound();
  const found = await getPartByOem(oem);
  if (!found) notFound();
  const { part } = found;

  // Publicaciones aprobadas de esta pieza
  const { data: links } = await supabaseService
    .from("pv_product_part_links").select("product_id, compatibility_claim").eq("part_id", part.id).eq("link_status", "approved");
  const prodIds = Array.from(new Set((links ?? []).map((l) => l.product_id)));
  let products: { id: string; title: string; price: number; image: string | null; claim: string }[] = [];
  if (prodIds.length) {
    const { data: prods } = await supabaseService
      .from("products").select('id, title, price, product_images(url, "order")').in("id", prodIds).eq("is_active", true);
    products = (prods ?? []).map((p) => {
      const imgs = (p as { product_images?: { url: string; order: number }[] }).product_images ?? [];
      const img = [...imgs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]?.url ?? null;
      const claim = (links ?? []).find((l) => l.product_id === p.id)?.compatibility_claim ?? "seller_claimed";
      return { id: p.id, title: p.title, price: p.price, image: img, claim };
    });
  }

  // Máquinas donde encaja (fitments aprobados)
  const { data: fitments } = await supabaseService
    .from("pv_part_fitments").select("model_id, compatibility_status").eq("part_id", part.id).neq("compatibility_status", "incompatible").limit(40);
  const modelIds = Array.from(new Set((fitments ?? []).map((f) => f.model_id)));
  let models: { id: string; model_name: string; slug: string; brand: { name: string; slug: string } | null }[] = [];
  if (modelIds.length) {
    const { data } = await supabaseService.from("pv_machine_models").select("id, model_name, slug, brand:brand_id(name, slug)").in("id", modelIds).neq("status", "draft");
    models = (data as unknown as typeof models) ?? [];
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link href="/" className="hover:text-foreground">Inicio</Link><span>›</span>
          <Link href="/repuestos" className="hover:text-foreground">Repuestos</Link><span>›</span>
          <span className="text-foreground font-medium">{part.canonical_name}</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">{part.canonical_name}</h1>
        <p className="text-sm text-muted-foreground mb-2">Código OEM: <span className="font-mono text-foreground">{found.oem}</span></p>
        {part.description && <p className="text-muted-foreground mb-6">{part.description}</p>}

        <section className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-3">Dónde comprarla</h2>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-sm">Todavía no hay publicaciones de esta pieza.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className="flex gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40">
                  <div className="h-14 w-14 shrink-0 rounded bg-muted overflow-hidden">
                    {p.image ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={p.image} alt="" className="h-full w-full object-cover" />) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-2">{p.title}</p>
                    <p className="text-sm font-bold text-foreground">{money(p.price)}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {models.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Compatible con</h2>
            <div className="flex flex-wrap gap-2">
              {models.map((m) => (
                <Link key={m.id} href={`/modelos/${m.brand?.slug}/${m.slug}`} className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:border-primary/40">
                  {m.brand?.name} {m.model_name}
                </Link>
              ))}
            </div>
            <p className="text-xs text-amber-600 mt-3">Verificá las medidas antes de comprar.</p>
          </section>
        )}
      </main>
    </div>
  );
}
