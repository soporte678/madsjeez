import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon generado en build time desde el SVG mark de Madsjeez.
 * Next.js convierte esto a PNG 32x32. Reemplaza al icon.png estático
 * para que siempre quede sincronizado con la marca.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          <path d="M 12 14 L 30 14 L 52 54 L 30 38 L 30 86 L 12 86 Z" fill="url(#g)" />
          <path d="M 88 14 L 70 14 L 48 54 L 70 38 L 70 86 L 88 86 Z" fill="url(#g)" />
          <path d="M 70 50 L 70 68 L 50 68 L 60 52 Z" fill="#1e3a8a" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
