"use client"
import { useEffect, useState } from "react"

export function AppQRCode({
  url = "https://www.madsjeez.com.ar/descargar-app",
  size = 64,
  colorDark = "#f97316",
  colorLight = "#030712",
}: {
  url?: string
  size?: number
  colorDark?: string
  colorLight?: string
}) {
  const [src, setSrc] = useState<string>("")

  useEffect(() => {
    let cancelled = false
    import("qrcode").then(async (m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const QRCode: any = (m as any).default ?? m
      const dataUrl: string = await QRCode.toDataURL(url, {
        width: size * 2,
        margin: 1,
        color: { dark: colorDark, light: colorLight },
      })
      if (!cancelled) setSrc(dataUrl)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [url, size, colorDark, colorLight])

  if (!src) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-lg bg-gray-800 animate-pulse flex-shrink-0"
        aria-hidden
      />
    )
  }

  return (
    <img
      src={src}
      alt="Escaneá el QR para instalar la app de Madsjeez"
      width={size}
      height={size}
      className="rounded-lg flex-shrink-0"
      style={{ imageRendering: "pixelated" }}
    />
  )
}
