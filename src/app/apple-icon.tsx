import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon 180x180 con fondo slate-950 para que el mark se lea
 * sobre los wallpapers claros del home de iOS. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0f1a",
          borderRadius: 40,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <path d="M 12 14 L 30 14 L 52 54 L 30 38 L 30 86 L 12 86 Z" fill="url(#ga)" />
          <path d="M 88 14 L 70 14 L 48 54 L 70 38 L 70 86 L 88 86 Z" fill="url(#ga)" />
          <path d="M 70 50 L 70 68 L 50 68 L 60 52 Z" fill="#1d4ed8" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
