import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ALL_GUIAS } from "@/data/guias-all";
import { canonicalMeta } from "@/lib/seo/canonical";
import { BookOpen, ArrowRight, Wrench, Baby, ShoppingBag, Store, Lightbulb, Building2, Package, MapPin } from "lucide-react";

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
  jardin:        { label: "Máquinas de jardín",  Icon: Wrench,      color: "#16a34a" },
  bebe:          { label: "Bebés",               Icon: Baby,        color: "#db2777" },
  vendedores:    { label: "Vendedores",           Icon: Store,       color: "#7c3aed" },
  compradores:   { label: "Compradores",          Icon: ShoppingBag, color: "#0ea5e9" },
  emprendedores: { label: "Emprendedores",        Icon: Lightbulb,   color: "#d97706" },
  empresas:      { label: "Empresas",             Icon: Building2,   color: "#dc2626" },
  productos:     { label: "Productos",            Icon: Package,     color: "#0891b2" },
  regional:      { label: "Regional",             Icon: MapPin,      color: "#65a30d" },
  maquinaria:    { label: "Maquinaria",           Icon: Wrench,      color: "#57534e" },
  marketplace:   { label: "Marketplace",          Icon: Store,       color: "#6366f1" },
} as const;

type VerticalKey = keyof typeof VERTICAL_META;

const VERTICAL_ORDER: VerticalKey[] = [
  "vendedores",
  "compradores",
  "emprendedores",
  "empresas",
  "productos",
  "regional",
  "jardin",
  "bebe",
  "maquinaria",
  "marketplace",
];

export default function GuiasIndexPage() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: ALL_GUIAS.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/guias/${g.slug}`,
      name: g.title,
    })),
  };

  // Group by vertical
  const byVertical = new Map<string, typeof ALL_GUIAS>();
  for (const g of ALL_GUIAS) {
    const key = g.vertical;
    if (!byVertical.has(key)) byVertical.set(key, []);
    byVertical.get(key)!.push(g);
  }

  // Build ordered sections — known verticals first, then any unknown ones
  const orderedKeys = [
    ...VERTICAL_ORDER.filter((k) => byVertical.has(k)),
    ...[...byVertical.keys()].filter((k) => !VERTICAL_ORDER.includes(k as VerticalKey)),
  ];

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

        <div className="space-y-12">
          {orderedKeys.map((verticalKey) => {
            const guias = byVertical.get(verticalKey)!;
            const meta = VERTICAL_META[verticalKey as VerticalKey] ?? {
              label: verticalKey,
              Icon: BookOpen,
              color: "#6b7280",
            };
            const { Icon } = meta;
            return (
              <section key={verticalKey}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `${meta.color}1a`, color: meta.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-black tracking-tight leading-tight">{meta.label}</h2>
                    <p className="text-xs text-muted-foreground">{guias.length} {guias.length === 1 ? "guía" : "guías"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {guias.map((g) => (
                    <Link
                      key={g.slug}
                      href={`/guias/${g.slug}`}
                      className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors flex flex-col"
                    >
                      <h3 className="text-base font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                        {g.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                        {g.answer}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                        Leer la guía
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
