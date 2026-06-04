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
          <path d="M 14 10 L 32 10 L 32 90 L 14 90 Z" fill="url(#ga)" />
          <path d="M 14 10 L 32 10 L 56 56 L 44 64 Z" fill="url(#ga)" />
          <path d="M 86 10 L 68 10 L 44 56 L 56 64 Z" fill="url(#ga)" />
          <path d="M 68 10 L 86 10 L 86 90 L 68 90 Z" fill="url(#ga)" />
          <path d="M 56 56 L 68 56 L 68 76 L 56 76 Z" fill="#1d4ed8" />
          <path d="M 46 64 L 56 64 L 56 76 L 46 76 Z" fill="#1d4ed8" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
