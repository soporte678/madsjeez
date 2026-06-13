import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "./site";
import { getSellerLanding } from "@/data/seller-landings";

/**
 * Construye la metadata (title, description, canonical, OG, Twitter) de una
 * landing de captación de vendedores desde su definición en SELLER_LANDINGS.
 */
export function sellerLandingMetadata(slug: string): Metadata {
  const d = getSellerLanding(slug);
  if (!d) return {};
  const url = `${SITE_URL}/${d.slug}`;
  return {
    title: d.seoTitle,
    description: d.metaDescription,
    keywords: d.keyword,
    alternates: { canonical: `/${d.slug}` },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: d.seoTitle,
      description: d.metaDescription,
      locale: "es_AR",
    },
    twitter: {
      card: "summary_large_image",
      title: d.seoTitle,
      description: d.metaDescription,
    },
  };
}
