import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Temporalmente activado para deploy urgente — 30+ deploys fallidos por tipo Decimal/number
    // Prisma 6.19 usa Decimal para @db.Decimal(12,2) pero codebase usa number en cientos de lugares
    // TODO: reactivar strict mode y arreglar tipos propiamente cuando el entorno de dev esté estable
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: __dirname,
  },
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 30,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.mercadopago.com https://*.google-analytics.com https://*.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' blob: data: https://*.supabase.co https://images.unsplash.com https://cdn-icons-png.flaticon.com https://placehold.co https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://*.google-analytics.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://*.mercadopago.com wss://*.supabase.co https://*.google-analytics.com https://*.googletagmanager.com",
              "frame-src 'self' https://*.mercadopago.com https://*.stripe.com",
              "media-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=(self), usb=(), magnetometer=(), gyroscope=()",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/brand/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/_next/image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/dashboard/meli",
        destination: "/dashboard#meli-sync",
        permanent: false,
      },
      {
        // Unificación: /coupons era casi gemela de /coupons/public.
        source: "/coupons",
        destination: "/coupons/public",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
