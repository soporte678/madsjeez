import { getSocialSameAs } from "@/lib/seo/social";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Organization + WebSite + LocalBusiness para rich results y SEO local. */
export function SiteJsonLd() {
  const sameAs = getSocialSameAs();

  const organization = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    legalName: "MADSJEEZ COMMERCE GROUP S.R.L.",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    email: "soporte@madsjeez.com",
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const localBusiness = {
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#localbusiness`,
    name: SITE_NAME,
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image`,
    description:
      "Marketplace en Argentina para comprar y vender productos online: catálogo, ofertas, MADSJEEZ Ads y herramientas para vendedores.",
    email: "soporte@madsjeez.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Spegazzini",
      addressRegion: "Buenos Aires",
      addressCountry: "AR",
    },
    areaServed: {
      "@type": "Country",
      name: "Argentina",
    },
    priceRange: "$$",
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "es-AR",
    description:
      "Marketplace en Argentina para comprar y vender productos online con pagos Mercado Pago, envíos, catálogo por categorías y campañas MADSJEEZ Ads.",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [organization, localBusiness, website],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(graph) }} />
  );
}
