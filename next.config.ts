import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Evita que Next elija otro root cuando detecta lockfiles fuera del proyecto.
  turbopack: {
    root: __dirname,
  },
  /** Evita que el bundler rompa binarios nativos de Prisma/pg en runtime (standalone). */
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "prisma", "pg"],
  typescript: {
    ignoreBuildErrors: false,
  },
  /** Next 16+: top-level key (was experimental.outputFileTracingIncludes). Standalone trace para Prisma. */
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/.prisma/**/*", "./node_modules/@prisma/client/**/*"],
    "/*": ["./node_modules/.prisma/**/*"],
  },
  // Configuración para dominio personalizado
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  // Redirección de www a non-www (opcional)
  async redirects() {
    return [
      // Producción antigua sin esta página: enviar al mismo panel dentro de /dashboard
      {
        source: "/dashboard/meli",
        destination: "/dashboard#meli-sync",
        permanent: false,
      },
      {
        source: "/seller/boost",
        destination: "/dashboard#publicidad",
        permanent: false,
      },
      {
        source: "/about",
        destination: "/seller/register",
        permanent: false,
      },
      {
        source: "/promotions",
        destination: "/offers",
        permanent: false,
      },
      {
        source: "/contact",
        destination: "/help#contacto",
        permanent: false,
      },
      {
        source: "/accessibility",
        destination: "/help",
        permanent: false,
      },
      {
        source: "/insurance",
        destination: "/help",
        permanent: false,
      },
      {
        source: "/complaints",
        destination: "/help",
        permanent: false,
      },
      {
        source: "/affiliates",
        destination: "/help",
        permanent: false,
      },
      {
        source: "/defensa-del-consumidor",
        destination: "https://www.argentina.gob.ar/defensa-del-consumidor",
        permanent: false,
      },
      {
        source: "/seller/dashboard",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/settings/notifications",
        destination: "/settings",
        permanent: false,
      },
      {
        source: "/dashboard/novedades",
        destination: "/dashboard#ventas-novedades",
        permanent: false,
      },
      {
        source: "/dashboard/ventas",
        destination: "/dashboard#ventas-lista",
        permanent: false,
      },
      {
        source: "/docs",
        destination: "/docs/api",
        permanent: false,
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.tudominio.com",
          },
        ],
        destination: "https://tudominio.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
