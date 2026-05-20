import type { Metadata } from "next";

/** Canonical relativo (metadataBase en layout lo convierte a URL absoluta). */
export function canonicalMeta(path: string): Pick<Metadata, "alternates"> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return { alternates: { canonical: normalized } };
}
