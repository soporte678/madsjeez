import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { BLOG_POSTS } from "@/data/blog-posts";
import { SellerCtaButton } from "@/components/seller/SellerInteractive";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Blog de Madsjeez — Vender online en Argentina",
  description:
    "Guías y consejos para vender online en Argentina: dónde publicar tus productos, cómo conseguir clientes y cómo hacer crecer tu emprendimiento o comercio.",
  keywords: "vender online, marketplace, emprendedores, vender por internet Argentina",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/blog`,
    siteName: SITE_NAME,
    title: "Blog de Madsjeez — Vender online en Argentina",
    description: "Guías para vender online en Argentina y hacer crecer tu negocio.",
    locale: "es_AR",
  },
};

export default function BlogIndexPage() {
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: BLOG_POSTS.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/blog/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <main className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />

      <nav aria-label="Migas de pan" className="mx-auto max-w-6xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="font-medium text-foreground">Blog</li>
        </ol>
      </nav>

      <header className="mx-auto max-w-6xl px-4 pb-8 pt-8 md:pt-12">
        <h1 className="text-3xl font-black tracking-tight md:text-5xl">Blog de Madsjeez</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
          Guías y consejos para vender online en Argentina: dónde publicar tus productos, cómo conseguir más clientes
          y cómo hacer crecer tu emprendimiento, comercio o negocio mayorista.
        </p>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((p) => (
            <article key={p.slug} className="flex flex-col rounded-2xl border border-border bg-card p-5 transition hover:border-primary">
              <span className="inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{p.category}</span>
              <h2 className="mt-3 text-lg font-bold leading-snug text-foreground">
                <Link href={`/blog/${p.slug}`} className="hover:text-primary">{p.title}</Link>
              </h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{p.excerpt}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {p.readingMinutes} min</span>
                <Link href={`/blog/${p.slug}`} className="inline-flex items-center gap-1 font-semibold text-primary">Leer <ChevronRight className="h-3.5 w-3.5" /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-8 text-center md:p-12">
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">¿Listo para vender en Madsjeez?</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            Sumá tu negocio al marketplace y hacé que más clientes encuentren tus productos.
          </p>
          <div className="mt-7 flex justify-center">
            <SellerCtaButton href="/vender-en-madsjeez" source="blog_index" event="seller_cta_click">Quiero vender en Madsjeez</SellerCtaButton>
          </div>
        </div>
      </section>
    </main>
  );
}
