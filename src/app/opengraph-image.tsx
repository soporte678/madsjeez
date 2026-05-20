import { ImageResponse } from "next/og";

export const alt = "MadsJeez — Marketplace en Argentina";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 45%, #0ea5e9 100%)",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: 0.85,
            marginBottom: 24,
          }}
        >
          Marketplace · Argentina
        </div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            marginBottom: 28,
          }}
        >
          MadsJeez
        </div>
        <div style={{ fontSize: 36, fontWeight: 600, maxWidth: 900, lineHeight: 1.35, opacity: 0.95 }}>
          Comprá y vendé online con pagos, envíos y panel para vendedores
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 22,
            opacity: 0.75,
          }}
        >
          www.madsjeez.com.ar
        </div>
      </div>
    ),
    { ...size }
  );
}
