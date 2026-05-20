import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/seo/build-sitemap-entries";

/** Regenera el sitemap como máximo cada hora (menos carga en DB en cada request). */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemapEntries();
}
