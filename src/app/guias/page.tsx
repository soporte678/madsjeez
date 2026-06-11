import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { GUIAS_COMPRA } from "@/data/guias-compra";
import { canonicalMeta } from "@/lib/seo/canonical";
import { BookOpen, ArrowRight, Wrench, Baby } from "lucide-react";

export const revalidate = 3600;

const SITE_URL = "https://www.madsjeez.com.ar";

export const metadata: Metadata = {
  title: "Guías de compra: repuestos de jardín y ropa de bebé | Madsjeez",
  description:
    "Guías prácticas para elegir repuestos de desmalezadoras y motosierras (tapas de arranque, carburadores, carreteles, espadas) y ropa de bebé. Basadas en productos reales del marketplace.",
  ...canonicalMeta("/guias"),
  openGraph: {
    title: "Guías de compra | Madsjeez",
    description: "Cómo elegir repuestos de máquinas de jardín y ropa de bebé. Guías reales, sin vueltas.",
    url: `${SITE_URL}/guias`,
    siteName: "MADSJEEZ",
    type: "website",
    locale: "es_AR",
  },
};

function toJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const VERTICAL_META = {
  jardin: { label: "Máquinas de jardín", Icon: Wrench, color: "#16a34a" },
  bebe: { label: "Bebés", Icon: Baby, color: "#db2777" },
} as const;

export default function GuiasIndexPage() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: GUIAS_COMPRA.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/guias/${g.slug}`,
      name: g.title,
    })),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(itemListJsonLd) }} />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Inicio</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Guías de compra</span>
        </nav>

        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-2">
          <BookOpen className="w-4 h-4" />
          Guías de compra
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
          Elegí bien antes de comprar
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed mb-10">
          Guías prácticas para no equivocarte con el repuesto o la prenda. Cada una está
          basada en productos que realmente hay en el marketplace y te lleva directo a la
          categoría correcta.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {GUIAS_COMPRA.map((g) => {
            const v = VERTICAL_META[g.vertical];
            return (
              <Link
                key={g.slug}
                href={`/guias/${g.slug}`}
                className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: `${v.color}1a`, color: v.color }}
                  >
                    <v.Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {v.label}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                  {g.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                  {g.answer}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                  Leer la guía
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
