import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Store } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { SELLER_HELP_ARTICLES, SELLER_HELP_CATEGORIES } from "@/data/help-seller-articles";
import { SellerCtaButton } from "@/components/seller/SellerInteractive";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Ayuda para vendedores | Madsjeez",
  description:
    "Centro de ayuda para vendedores de Madsjeez: cómo crear tu cuenta, publicar productos, poner precio, responder consultas, gestionar ventas y crecer.",
  keywords: "ayuda vendedores Madsjeez, cómo publicar, cómo vender, gestionar ventas",
  alternates: { canonical: "/ayuda-vendedores" },
  openGraph: { type: "website", url: `${SITE_URL}/ayuda-vendedores`, siteName: SITE_NAME, title: "Ayuda para vendedores | Madsjeez", description: "Todo para empezar a vender y crecer en Madsjeez.", locale: "es_AR" },
};

export default function AyudaVendedoresPage() {
  const itemListLd = {
    "@context": "https://schema.org", "@type": "ItemList",
    itemListElement: SELLER_HELP_ARTICLES.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/ayuda-vendedores/${a.slug}`, name: a.title })),
  };

  return (
    <main className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />

      <nav aria-label="Migas de pan" className="mx-auto max-w-6xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="font-medium text-foreground">Ayuda para vendedores</li>
        </ol>
      </nav>

      <header className="mx-auto max-w-6xl px-4 pb-8 pt-8 md:pt-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Store className="h-3.5 w-3.5" /> Ayuda para vendedores</span>
        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Todo para vender en Madsjeez</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
          Cómo crear tu cuenta, publicar productos, poner precio, responder consultas, gestionar ventas y hacer crecer tu negocio.
        </p>
        <div className="mt-6"><SellerCtaButton href="/seller/register" source="ayuda_vendedores" event="seller_register_click">Crear cuenta de vendedor</SellerCtaButton></div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {SELLER_HELP_CATEGORIES.map((cat) => {
            const arts = SELLER_HELP_ARTICLES.filter((a) => a.category === cat);
            if (arts.length === 0) return null;
            return (
              <div key={cat} className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-bold text-foreground">{cat}</h2>
                <ul className="mt-3 space-y-2">
                  {arts.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/ayuda-vendedores/${a.slug}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                        {a.title} <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
