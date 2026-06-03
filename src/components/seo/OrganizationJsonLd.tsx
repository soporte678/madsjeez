import React from "react";

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MadsJeez",
    url: "https://www.madsjeez.com.ar",
    logo: "https://www.madsjeez.com.ar/icons/icon-512x512.png",
    description: "Marketplace de maquinaria, herramientas y repuestos para la construccion e industria en Argentina.",
    // sameAs incluye redes sociales + sitios hermanos del mismo grupo.
    // Schema.org "sameAs" se usa por Google para entender entidades
    // relacionadas y para Knowledge Graph. Es señal legítima de propiedad
    // común, no link farm.
    sameAs: [
      "https://www.instagram.com/madsjeez",
      "https://www.facebook.com/madsjeez",
      "https://www.appjeezpro.com",
      "https://www.appjeezpro.store",
      "https://www.madsjeezdesign.com",
      "https://www.trabajocerca.site",
      "https://www.marda.site",
      "https://www.mellimelos.site",
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
