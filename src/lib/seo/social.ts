/** Perfiles públicos del marketplace (configurar en producción vía env). */
export type SocialProfile = {
  id: "facebook" | "instagram" | "x" | "linkedin" | "youtube";
  label: string;
  href: string;
};

function envUrl(key: string): string {
  const v = process.env[key]?.trim();
  return v && v.startsWith("http") ? v : "";
}

/** URLs de redes configuradas (vacío = no mostrar enlace). */
export function getSocialProfiles(): SocialProfile[] {
  const entries: Array<SocialProfile | null> = [
    envUrl("NEXT_PUBLIC_SOCIAL_FACEBOOK_URL")
      ? {
          id: "facebook",
          label: "Facebook de MadsJeez",
          href: envUrl("NEXT_PUBLIC_SOCIAL_FACEBOOK_URL"),
        }
      : null,
    envUrl("NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL")
      ? {
          id: "instagram",
          label: "Instagram de MadsJeez",
          href: envUrl("NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL"),
        }
      : null,
    envUrl("NEXT_PUBLIC_SOCIAL_X_URL")
      ? {
          id: "x",
          label: "Perfil X de MadsJeez",
          href: envUrl("NEXT_PUBLIC_SOCIAL_X_URL"),
        }
      : null,
    envUrl("NEXT_PUBLIC_SOCIAL_LINKEDIN_URL")
      ? {
          id: "linkedin",
          label: "LinkedIn de MadsJeez",
          href: envUrl("NEXT_PUBLIC_SOCIAL_LINKEDIN_URL"),
        }
      : null,
    envUrl("NEXT_PUBLIC_SOCIAL_YOUTUBE_URL")
      ? {
          id: "youtube",
          label: "Canal de YouTube de MadsJeez",
          href: envUrl("NEXT_PUBLIC_SOCIAL_YOUTUBE_URL"),
        }
      : null,
  ];
  return entries.filter((e): e is SocialProfile => e !== null);
}

/** sameAs para schema.org */
export function getSocialSameAs(): string[] {
  return getSocialProfiles().map((p) => p.href);
}

/** Enlaces externos de autoridad (SEO: diversificar perfil de enlaces). */
export const AUTHORITY_EXTERNAL_LINKS = [
  {
    label: "Mercado Pago",
    href: "https://www.mercadopago.com.ar",
    note: "Pagos para compradores y vendedores",
  },
  {
    label: "Defensa del Consumidor",
    href: "https://www.argentina.gob.ar/defensa-del-consumidor",
    note: "Información oficial Argentina",
  },
  {
    label: "Mercado Libre Developers",
    href: "https://developers.mercadolibre.com.ar",
    note: "Integración para vendedores",
  },
] as const;
