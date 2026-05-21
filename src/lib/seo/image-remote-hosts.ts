import type { NextConfig } from "next";

/** Hostnames permitidos para `next/image` (WebP/AVIF automático). */
export function getProductImageRemotePatterns(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    { protocol: "https", hostname: "http2.mlstatic.com", pathname: "/**" },
    { protocol: "https", hostname: "mla-s1-p.mlstatic.com", pathname: "/**" },
    { protocol: "https", hostname: "mla-s2-p.mlstatic.com", pathname: "/**" },
    { protocol: "https", hostname: "http2.mlstatic.com.ar", pathname: "/**" },
    { protocol: "https", hostname: "www.mercadolibre.com", pathname: "/**" },
    { protocol: "https", hostname: "www.mercadolibre.com.ar", pathname: "/**" },
    { protocol: "https", hostname: "i.imgur.com", pathname: "/**" },
    { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (supabaseUrl) {
    try {
      const host = new URL(supabaseUrl).hostname;
      if (!patterns.some((p) => p.hostname === host)) {
        patterns.push({ protocol: "https", hostname: host, pathname: "/**" });
      }
    } catch {
      /* ignore */
    }
  }

  return patterns;
}
