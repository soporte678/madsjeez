import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
