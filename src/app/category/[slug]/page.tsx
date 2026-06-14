import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/seller/premium/motion-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  CircleHelp,
  Compass,
  LineChart,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { countInStockProducts, categoryIndexStatus, robotsFor } from "@/lib/seo/indexability";
import { getGuiasForCategory } from "@/data/guias-compra";
import { seedCategoriesIfEmpty } from "@/lib/seed-categories";
import { buildCategorySeo } from "@/lib/categorySeo";

const SITE_URL = "https://www.madsjeez.com.ar";

/**
 * ISR: regeneramos la página de categoría cada 30 min. Mejora crawl budget y
 * TTFB sin servir contenido viejo. La categoría no muta datos en el render
 * (a diferencia del producto, que incrementa vistas), así que es seguro.
 */
export const revalidate = 1800;

function getDarkAccent(accent: string) {
  const accentMap: Record<string, string> = {
    "#2563eb": "#93c5fd",
    "#16a34a": "#86efac",
    "#ca8a04": "#fcd34d",
    "#0891b2": "#67e8f9",
    "#334155": "#cbd5e1",
    "#0f766e": "#5eead4",
    "#1d4ed8": "#93c5fd",
    "#b45309": "#fdba74",
    "#4f46e5": "#a5b4fc",
    "#ea580c": "#fdba74",
    "#7c3aed": "#c4b5fd",
    "#475569": "#cbd5e1",
    "#7c2d12": "#fdba74",
    "#db2777": "#f9a8d4",
    "#be185d": "#f9a8d4",
    "#0284c7": "#7dd3fc",
    "#3483fa": "#93c5fd",
  };

  return accentMap[accent] ?? "#93c5fd";
}

type CategoryView = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
};

type Subcategory = {
  id: string;
  name: string;
  slug: string;
};

async function getCategory(slug: string): Promise<CategoryView | null> {
  await seedCategoriesIfEmpty();
  return prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
    },
  });
}

/**
 * Si la categoría fue consolidada en otra (redirect_to_slug, columna fuera de
 * Prisma), devolvemos el slug canónico para hacer 301. Concentra autoridad en
 * una sola URL en vez de repartirla entre duplicadas del import MeLi.
 */
async function getCategoryRedirect(slug: string): Promise<string | null> {
  try {
    const rows = await prisma.$queryRaw<{ redirect_to_slug: string | null }[]>`
      SELECT redirect_to_slug FROM categories WHERE slug = ${slug} LIMIT 1
    `;
    const target = rows[0]?.redirect_to_slug;
    return target && target !== slug ? target : null;
  } catch {
    return null;
  }
}

async function getCategoryProducts(categoryIds: string[]) {
  if (categoryIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: {
      categoryId: { in: categoryIds },
      isActive: true,
    },
    include: {
      seller: { select: { id: true, name: true, sellerName: true } },
      images: { orderBy: { order: "asc" }, take: 5 },
    },
    orderBy: [{ isBoosted: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
    take: 96,
  });

  return products.map((product) => ({
    id: product.id,
    title: product.title,
    price: product.price,
    images: product.images.map((image) => ({ url: image.url })),
    seller: {
      id: product.seller.id,
      full_name: product.seller.sellerName || product.seller.name || "Vendedor MADSJEEZ",
    },
  }));
}

async function getSubcategories(parentId: string | null): Promise<Subcategory[]> {
  return prisma.category.findMany({
    where: { parentId },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

async function getRelatedCategories(category: CategoryView): Promise<Subcategory[]> {
  if (category.parentId) {
    return prisma.category.findMany({
      where: {
        parentId: category.parentId,
        NOT: { id: category.id },
      },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
      take: 12,
    });
  }

  return getSubcategories(category.id);
}

async function getParentCategory(parentId: string | null) {
  if (!parentId) return null;
  return prisma.category.findUnique({
    where: { id: parentId },
    select: { name: true, slug: true },
  });
}

function toJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function formatCount(value: number) {
  return value.toLocaleString("es-AR");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return { title: "Categoria no encontrada | MADSJEEZ" };
  }

  const [subcategories, parentCategory] = await Promise.all([
    getSubcategories(category.id),
    getParentCategory(category.parentId),
  ]);
  const seo = buildCategorySeo(
    {
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentName: parentCategory?.name || null,
    },
    subcategories
  );
  const canonicalPath = `/category/${category.slug}`;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  // Gate de indexación: solo indexamos categorías con inventario real
  // (≥5 productos en stock, contando subcategorías). Evita index bloat de
  // las ~378 categorías vacías del catálogo.
  const categoryIds = [category.id, ...subcategories.map((s) => s.id)];
  const inStock = await countInStockProducts(categoryIds);
  const indexStatus = categoryIndexStatus(inStock);

  return {
    title: seo.seoTitle,
    description: seo.seoDescription,
    keywords: seo.keywords,
    robots: robotsFor(indexStatus),
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: seo.seoTitle,
      description: seo.seoDescription,
      url: canonicalUrl,
      siteName: "MADSJEEZ",
      type: "website",
      locale: "es_AR",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.seoTitle,
      description: seo.seoDescription,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 301 a la categoría canónica si esta fue consolidada (duplicada del import MeLi).
  const redirectTo = await getCategoryRedirect(slug);
  if (redirectTo) {
    permanentRedirect(`/category/${redirectTo}`);
  }

  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const [subcategories, parentCategory] = await Promise.all([
    getSubcategories(category.id),
    getParentCategory(category.parentId),
  ]);
  const relatedCategories = await getRelatedCategories(category);
  const relatedGuias = getGuiasForCategory(category.slug);
  const categoryIds = [category.id, ...subcategories.map((subcategory) => subcategory.id)];
  const products = await getCategoryProducts(categoryIds);
  const searchHref = `/search?category=${encodeURIComponent(category.id)}`;
  const seo = buildCategorySeo(
    {
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentName: parentCategory?.name || null,
    },
    subcategories
  );
  const accentVars = {
    "--theme-accent-light": seo.theme.accent,
    "--theme-accent-dark": getDarkAccent(seo.theme.accent),
  } as CSSProperties;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Categorias",
        item: `${SITE_URL}/categories`,
      },
      ...(parentCategory
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: parentCategory.name,
              item: `${SITE_URL}/category/${parentCategory.slug}`,
            },
            {
              "@type": "ListItem",
              position: 4,
              name: category.name,
              item: `${SITE_URL}/category/${category.slug}`,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 3,
              name: category.name,
              item: `${SITE_URL}/category/${category.slug}`,
            },
          ]),
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seo.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Productos de ${category.name} en MADSJEEZ`,
    itemListElement: products.slice(0, 12).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/product/${product.id}`,
      name: product.title,
    })),
  };

  return (
    <div className="category-page min-h-screen flex flex-col bg-background" style={accentVars}>
      <Header user={null} />
      <main className="flex-1">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(faqJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(itemListJsonLd) }} />

        <section className={`category-hero-surface border-b border-black/5 bg-gradient-to-br ${seo.theme.surface}`}>
          <div className="mx-auto max-w-[1280px] px-4 py-4 text-sm text-slate-500">
            <nav className="flex flex-wrap items-center gap-2">
              <Link href="/" className="hover:text-[#3483FA]">Inicio</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/categories" className="hover:text-[#3483FA]">Categorias</Link>
              {parentCategory && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <Link href={`/category/${parentCategory.slug}`} className="hover:text-[#3483FA]">
                    {parentCategory.name}
                  </Link>
                </>
              )}
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-slate-800">{category.name}</span>
            </nav>
          </div>

          <div className="mx-auto grid max-w-[1280px] gap-8 px-4 pb-10 pt-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                <Sparkles className="theme-accent-text h-3.5 w-3.5" />
                {parentCategory ? parentCategory.name : "Categoría"}
              </div>
              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {seo.heroTitle}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                {seo.heroDescription}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {seo.marketHighlights.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href={searchHref}>
                  <Button className="theme-accent-bg h-12 rounded-xl px-5 text-sm font-semibold">
                    <Search className="mr-2 h-4 w-4" />
                    Ver publicaciones de {category.name}
                  </Button>
                </Link>
                <Link href="/vender">
                  <Button variant="outline" className="h-12 rounded-xl border-slate-300 bg-white/90 px-5 text-sm font-semibold text-slate-900">
                    <Store className="mr-2 h-4 w-4" />
                    Quiero vender en esta categoria
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={`rounded-3xl bg-gradient-to-br ${seo.theme.glow} p-6 text-white shadow-xl sm:col-span-2`}>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">{category.name}</p>
                <p className="mt-3 text-2xl font-black">Encontrá publicaciones de {category.name} de vendedores de todo el país.</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-2xl font-black">{formatCount(products.length)}</p>
                    <p className="text-xs text-white/70">publicaciones</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-2xl font-black">{formatCount(relatedCategories.length)}</p>
                    <p className="text-xs text-white/70">subcategorías</p>
                  </div>
                </div>
              </div>

              {seo.theme.heroLines.map((line) => (
                <div key={line} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                  <p className="text-sm leading-6 text-slate-700">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-4 py-8">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="rounded-3xl border-0 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Target className="theme-accent-text h-5 w-5" />
                  <h2 className="text-lg font-black text-slate-950">Por qué comprar {category.name} en Madsjeez</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {seo.theme.buyerBenefits.map((benefit) => (
                    <div key={benefit} className="flex gap-3">
                      <BadgeCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#00a650]" />
                      <p className="text-sm leading-6 text-slate-600">{benefit}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <LineChart className="theme-accent-text h-5 w-5" />
                  <h2 className="text-lg font-black text-slate-950">¿Vendés {category.name}?</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {seo.theme.sellerBenefits.map((benefit) => (
                    <div key={benefit} className="flex gap-3">
                      <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                      <p className="text-sm leading-6 text-slate-600">{benefit}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-4 pb-8">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="rounded-3xl border-0 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Compass className="theme-accent-text h-5 w-5" />
                  <h2 className="text-2xl font-black text-slate-950">Búsquedas relacionadas con {category.name}</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{seo.editorialIntro}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {seo.searchIntents.map((intent) => (
                    <span
                      key={intent}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {intent}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 bg-white shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-2xl font-black text-slate-950">Explorá subcategorías de {category.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {category.parentId
                    ? `${category.name} es una subcategoría dentro de ${parentCategory?.name || "su rubro"}. Mirá también otras categorías relacionadas.`
                    : "Entrá a las subcategorías para encontrar más rápido lo que estás buscando."}
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {relatedCategories.length > 0 ? (
                    relatedCategories.map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        href={`/category/${subcategory.slug}`}
                        className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-white"
                      >
                        <span>{subcategory.name}</span>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
                      </Link>
                    ))
                  ) : (
                    <Link
                      href={searchHref}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-white"
                    >
                      <span>Explorar publicaciones de {category.name}</span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {relatedGuias.length > 0 && (
              <Card className="rounded-3xl border-0 bg-white shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-black text-slate-950">Guias de compra utiles</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Antes de comprar, mira como elegir el repuesto o la prenda correcta.
                  </p>
                  <div className="mt-5 grid gap-2">
                    {relatedGuias.map((g) => (
                      <Link
                        key={g.slug}
                        href={`/guias/${g.slug}`}
                        className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-white"
                      >
                        <span>{g.title}</span>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-slate-700" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-3xl border-0 bg-white shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-2xl font-black text-slate-950">Preguntas frecuentes sobre {category.name}</h2>
                <div className="mt-5 space-y-3">
                  {seo.faq.map((item) => (
                    <div key={item.question} className="rounded-2xl border border-slate-200 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <CircleHelp className="theme-accent-text mt-0.5 h-5 w-5 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{item.question}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-4 pb-10">
            <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="theme-accent-text text-sm font-semibold">Catálogo</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Publicaciones destacadas de {category.name}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Productos de {category.name} publicados por vendedores. La disponibilidad depende de las publicaciones vigentes.
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span>{formatCount(products.length)} resultados visibles</span>
                <Link href={searchHref} className="theme-accent-link font-semibold hover:underline">
                  Ir al buscador
                </Link>
              </div>
              </div>

            {products.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {products.slice(0, 12).map((product, i) => (
                  <Reveal key={product.id} delay={Math.min(i, 7) * 0.05} className="h-full">
                    <ProductCard product={product} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <Card className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 shadow-none">
                <CardContent className="p-12 text-center">
                  <Package className="mx-auto h-16 w-16 text-slate-300" />
                  <h3 className="mt-4 text-xl font-black text-slate-900">Estamos cargando productos en esta categoría</h3>
                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Todavía no hay publicaciones activas en {category.name}. ¿Vendés productos de esta categoría?
                    Sumá tu catálogo a Madsjeez y aparecé acá.
                  </p>
                  <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link href="/vender">
                      <Button className="theme-accent-bg h-11 rounded-xl px-5 text-sm font-semibold">
                        Publicar en {category.name}
                      </Button>
                    </Link>
                    <Link href="/vender/importador">
                      <Button variant="outline" className="h-11 rounded-xl border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900">
                        Importar catalogo
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
