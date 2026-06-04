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
          <path d="M 14 10 L 32 10 L 32 90 L 14 90 Z" fill="url(#g)" />
          <path d="M 14 10 L 32 10 L 56 56 L 44 64 Z" fill="url(#g)" />
          <path d="M 86 10 L 68 10 L 44 56 L 56 64 Z" fill="url(#g)" />
          <path d="M 68 10 L 86 10 L 86 90 L 68 90 Z" fill="url(#g)" />
          <path d="M 56 56 L 68 56 L 68 76 L 56 76 Z" fill="#1e40af" />
          <path d="M 46 64 L 56 64 L 56 76 L 46 76 Z" fill="#1e40af" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
