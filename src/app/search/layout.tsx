import type { Metadata } from "next";
import { canonicalMeta } from "@/lib/seo/canonical";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo/robots-meta";

/** Búsqueda con filtros/query: evita thin content y duplicados indexados. */
export const metadata: Metadata = {
  ...canonicalMeta("/search"),
  title: "Buscar productos",
  description:
    "Buscá productos en MadsJeez Marketplace Argentina por categoría, precio y vendedor.",
  robots: ROBOTS_NOINDEX_FOLLOW,
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
