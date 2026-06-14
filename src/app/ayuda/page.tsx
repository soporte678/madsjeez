import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MessageCircle, Mail, LifeBuoy } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { COMPANY } from "@/lib/company";
import { HELP_ARTICLES, HELP_CATEGORIES } from "@/data/help-articles";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Centro de ayuda | Madsjeez",
  description:
    "Centro de ayuda de Madsjeez: cómo comprar, métodos de pago, envíos, seguimiento, devoluciones, garantía y cómo contactar al vendedor.",
  keywords: "ayuda Madsjeez, cómo comprar, métodos de pago, envíos, devoluciones, garantía",
  alternates: { canonical: "/ayuda" },
  openGraph: {
    type: "website", url: `${SITE_URL}/ayuda`, siteName: SITE_NAME,
    title: "Centro de ayuda | Madsjeez", description: "Respuestas sobre comprar, pagar, envíos, devoluciones y más.", locale: "es_AR",
  },
};

export default function AyudaPage() {
  const itemListLd = {
    "@context": "https://schema.org", "@type": "ItemList",
    itemListElement: HELP_ARTICLES.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/ayuda/${a.slug}`, name: a.title })),
  };

  return (
    <main className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />

      <nav aria-label="Migas de pan" className="mx-auto max-w-6xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="font-medium text-foreground">Ayuda</li>
        </ol>
      </nav>

      <header className="mx-auto max-w-6xl px-4 pb-8 pt-8 md:pt-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><LifeBuoy className="h-3.5 w-3.5" /> Centro de ayuda</span>
        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">¿Cómo podemos ayudarte?</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
          Respuestas sobre comprar, pagar, envíos, seguimiento, devoluciones, garantía y cómo contactar al vendedor en Madsjeez.
        </p>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {HELP_CATEGORIES.map((cat) => {
            const arts = HELP_ARTICLES.filter((a) => a.category === cat);
            if (arts.length === 0) return null;
            return (
              <div key={cat} className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-bold text-foreground">{cat}</h2>
                <ul className="mt-3 space-y-2">
                  {arts.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/ayuda/${a.slug}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
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

      {/* Contacto real */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-8 md:p-10">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">¿Necesitás más ayuda?</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Si no encontrás lo que buscás, escribinos. Te respondemos lo antes posible.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={COMPANY.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90">
                <MessageCircle className="h-4 w-4" /> WhatsApp {COMPANY.phoneDisplay}
              </a>
              <a href={`mailto:${COMPANY.email}`} className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold text-foreground hover:bg-muted">
                <Mail className="h-4 w-4" /> {COMPANY.email}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
