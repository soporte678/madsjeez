import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Organization + WebSite (SearchAction) para rich results y sitelinks search box. */
export function SiteJsonLd() {
  const organization = {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    sameAs: [] as string[],
  };

  const website = {
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "es-AR",
    description:
      "Marketplace en Argentina para comprar y vender productos online con pagos, envíos y herramientas para vendedores.",
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
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
    "@graph": [organization, website],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(graph) }} />
  );
}
