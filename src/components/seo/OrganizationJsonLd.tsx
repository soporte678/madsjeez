import React from "react";

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MadsJeez",
    url: "https://www.madsjeez.com.ar",
    logo: "https://www.madsjeez.com.ar/icons/icon-512x512.png",
    description: "Marketplace de maquinaria, herramientas y repuestos para la construccion e industria en Argentina.",
    sameAs: [
      "https://www.instagram.com/madsjeez",
      "https://www.facebook.com/madsjeez",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["Spanish"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default OrganizationJsonLd;
