import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { PartsDiagramViewer } from "@/components/partsvision/PartsDiagramViewer";
import { supabaseService } from "@/lib/supabase/service";
import { isPartsVisionEnabled } from "@/lib/partsvision/feature-flags";
import { canonicalMeta } from "@/lib/seo/canonical";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo/robots-meta";

export const revalidate = 600;

async function getDiagram(id: string) {
  const { data } = await supabaseService
    .from("pv_diagrams")
    .select("id, title, publication_status")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const [enabled, diagram] = await Promise.all([isPartsVisionEnabled(), getDiagram(id)]);
  const title = diagram?.title ? `${diagram.title} — Despiece | Madsjeez` : "Despiece | Madsjeez";
  const base: Metadata = { title, ...canonicalMeta(`/despieces/${id}`) };
  if (!enabled || diagram?.publication_status !== "published") base.robots = ROBOTS_NOINDEX_FOLLOW;
  return base;
}

export default async function DespiecePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enabled = await isPartsVisionEnabled();
  if (!enabled) notFound();
  const diagram = await getDiagram(id);
  if (!diagram || diagram.publication_status !== "published") notFound();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link href="/" className="hover:text-foreground">Inicio</Link>
          <span>›</span>
          <Link href="/repuestos" className="hover:text-foreground">Repuestos</Link>
          <span>›</span>
          <span className="text-foreground font-medium line-clamp-1">{diagram.title}</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">{diagram.title}</h1>
        <p className="text-muted-foreground mb-6">Tocá una pieza del despiece para ver el código y quién la vende.</p>
        <PartsDiagramViewer diagramId={id} />
      </main>
    </div>
  );
}
