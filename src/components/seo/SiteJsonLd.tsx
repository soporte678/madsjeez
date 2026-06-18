import { COMPANY } from "@/lib/company";
import { getSocialSameAs } from "@/lib/seo/social";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { safeJsonLd } from "@/lib/safe-json-ld";

const jsonLd = safeJsonLd;

/** Organization + LocalBusiness + Person (fundador) + WebSite. */
export function SiteJsonLd() {
  const sameAs = getSocialSameAs();

  const organization = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    legalName: COMPANY.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/madsjeez-mark.svg`,
    email: COMPANY.email,
    telephone: COMPANY.phoneDisplay,
    taxID: COMPANY.cuitFormatted,
    founder: { "@id": `${SITE_URL}/#founder` },
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.address.street,
      addressLocality: COMPANY.address.city,
      addressRegion: COMPANY.address.region,
      addressCountry: "AR",
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const founder = {
    "@type": "Person",
    "@id": `${SITE_URL}/#founder`,
    name: COMPANY.founder.name,
    jobTitle: COMPANY.founder.role,
    image: `${SITE_URL}${COMPANY.founder.photoPortrait}`,
    worksFor: { "@id": `${SITE_URL}/#organization` },
    url: `${SITE_URL}/quienes-somos`,
  };

  const localBusiness = {
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#localbusiness`,
    name: SITE_NAME,
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image`,
    description: COMPANY.mission,
    email: COMPANY.email,
    telephone: COMPANY.phoneDisplay,
    taxID: COMPANY.cuitFormatted,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.address.street,
      addressLocality: COMPANY.address.city,
      addressRegion: COMPANY.address.region,
      addressCountry: "AR",
    },
    areaServed: { "@type": "Country", name: "Argentina" },
    priceRange: "$$",
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "es-AR",
    description: COMPANY.mission,
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
    "@graph": [organization, founder, localBusiness, website],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(graph) }} />
  );
}
