import type { Metadata } from "next";

/** Páginas de cuenta, checkout y búsqueda facetada: no indexar. */
export const ROBOTS_NOINDEX_FOLLOW: Metadata["robots"] = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
};

export function noindexPageMeta(
  title: string,
  options?: { description?: string; canonical?: string }
): Metadata {
  return {
    title,
    ...(options?.description ? { description: options.description } : {}),
    ...(options?.canonical
      ? { alternates: { canonical: options.canonical } }
      : {}),
    robots: ROBOTS_NOINDEX_FOLLOW,
  };
}
