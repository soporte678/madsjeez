import { NextRequest, NextResponse } from "next/server"

// Proxy de imágenes externas con Referer correcto (para hotlink protection)
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("u")
  if (!url || !url.startsWith("https://www.kachet.com.ar/")) {
    return new NextResponse("url inválida", { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        Referer: "https://www.kachet.com.ar/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0",
      },
      next: { revalidate: 60 * 60 * 24 * 30 }, // cache 30 días server-side
    })

    if (!res.ok) return new NextResponse("not found", { status: 404 })

    const buf = await res.arrayBuffer()
    const contentType = res.headers.get("content-type") ?? "image/jpeg"

    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=2592000, stale-while-revalidate=86400",
      },
    })
  } catch {
    return new NextResponse("error", { status: 502 })
  }
}
