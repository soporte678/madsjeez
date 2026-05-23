import type { Metadata } from "next";
import HomePageClient from "@/app/HomePageClient";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.madsjeez.com.ar",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MadsJeez",
  url: "https://www.madsjeez.com.ar",
  logo: "https://www.madsjeez.com.ar/brand/madsjeez-logo.png",
  description:
    "Marketplace argentino de tecnología, moda y hogar. Comprá y vendé online con envíos a todo el país y pagos seguros.",
  sameAs: [
    "https://www.instagram.com/madsjeez",
  ],
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MadsJeez",
  url: "https://www.madsjeez.com.ar",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://www.madsjeez.com.ar/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <HomePageClient />
    </>
  );
}
