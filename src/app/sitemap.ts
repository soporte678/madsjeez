import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/seo/build-sitemap-entries";

/** Generado en runtime (DB no disponible en Docker build de Railway). */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemapEntries();
}
