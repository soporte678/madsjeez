import type { Metadata } from "next";
import HomePageClient from "@/app/HomePageClient";

export const metadata: Metadata = {
  title: "Madsjeez | Marketplace argentino para comprar y vender online",
  description:
    "Comprá y vendé productos online en Madsjeez. Marketplace argentino para compradores, emprendedores, comercios y mayoristas que quieren publicar productos, crear su tienda y sumar un nuevo canal de venta.",
  alternates: {
    canonical: "https://www.madsjeez.com.ar",
  },
  openGraph: {
    type: "website",
    url: "https://www.madsjeez.com.ar",
    siteName: "Madsjeez",
    title: "Madsjeez | Marketplace argentino para comprar y vender online",
    description:
      "Encontrá productos, descubrí tiendas y ayudá a emprendedores, comercios y mayoristas a vender por internet en Argentina.",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Madsjeez | Marketplace argentino para comprar y vender online",
    description: "Comprá y vendé productos online en Madsjeez.",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MadsJeez",
  url: "https://www.madsjeez.com.ar",
  logo: "https://www.madsjeez.com.ar/brand/madsjeez-mark.svg",
  description:
    "Marketplace argentino para comprar y vender online: productos de vendedores, comercios, emprendedores y mayoristas de todo el país.",
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
