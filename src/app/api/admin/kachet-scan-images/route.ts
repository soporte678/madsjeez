import { NextResponse } from "next/server"
import { requireAdminRequest } from "@/lib/admin-api"
import { prisma } from "@/lib/prisma"

const KACHET_PRODUCTS = [
  { productId: "kachp001", imgId: 4118 },
  { productId: "kachp002", imgId: 4205 },
  { productId: "kachp003", imgId: 3972 },
  { productId: "kachp004", imgId: 3978 },
  { productId: "kachp005", imgId: 3980 },
  { productId: "kachp006", imgId: 4002 },
  { productId: "kachp007", imgId: 4013 },
  { productId: "kachp008", imgId: 3760 },
  { productId: "kachp009", imgId: 4032 },
  { productId: "kachp010", imgId: 4039 },
  { productId: "kachp011", imgId: 4047 },
  { productId: "kachp012", imgId: 4304 },
  { productId: "kachp013", imgId: 3943 },
  { productId: "kachp014", imgId: 4301 },
  { productId: "kachp015", imgId: 4243 },
  { productId: "kachp016", imgId: 3965 },
  { productId: "kachp017", imgId: 4278 },
  { productId: "kachp018", imgId: 4244 },
  { productId: "kachp019", imgId: 4291 },
  { productId: "kachp020", imgId: 4292 },
  { productId: "kachp021", imgId: 4306 },
  { productId: "kachp022", imgId: 4300 },
  { productId: "kachp023", imgId: 4314 },
  { productId: "kachp024", imgId: 4315 },
  { productId: "kachp025", imgId: 4312 },
  { productId: "kachp026", imgId: 4313 },
  { productId: "kachp027", imgId: 4316 },
  { productId: "kachp028", imgId: 4120 },
  { productId: "kachp029", imgId: 4295 },
  { productId: "kachp030", imgId: 4296 },
]

const HEADERS = {
  Referer: "https://www.kachet.com.ar/",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0",
}

/** IDs ya usados como imagen principal — no los agregamos como secundarios */
const PRIMARY_IDS = new Set(KACHET_PRODUCTS.map((p) => p.imgId))

/** Verifica si un imgId existe en kachet.com.ar */
async function probeImage(imgId: number): Promise<boolean> {
  try {
    const res = await fetch(`https://www.kachet.com.ar/fotos/shop/${imgId}.jpg`, {
      method: "HEAD",
      headers: HEADERS,
    })
    return res.ok && (res.headers.get("content-type") || "").startsWith("image/")
  } catch {
    return false
  }
}

/** Parsea HTML de kachet buscando IDs de imágenes de shop */
function extractImageIds(html: string): number[] {
  const pattern = /\/fotos\/shop\/(\d+)\.jpg/g
  const ids = new Set<number>()
  let m
  while ((m = pattern.exec(html)) !== null) {
    ids.add(parseInt(m[1]))
  }
  return [...ids]
}

/** Intenta obtener imágenes adicionales de la página del producto en kachet.com.ar */
async function discoverFromPage(imgId: number): Promise<number[]> {
  const urls = [
    `https://www.kachet.com.ar/?seccion=producto&id=${imgId}`,
    `https://www.kachet.com.ar/?sec=producto&id=${imgId}`,
    `https://www.kachet.com.ar/producto/${imgId}`,
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (!res.ok) continue
      const html = await res.text()
      const ids = extractImageIds(html)
      if (ids.length > 1 || (ids.length === 1 && ids[0] !== imgId)) {
        return ids.filter((id) => id !== imgId && !PRIMARY_IDS.has(id))
      }
    } catch { /* try next */ }
  }
  return []
}

/** Sondea IDs adyacentes al imgId principal para encontrar fotos extra */
async function probeNearbyIds(imgId: number): Promise<number[]> {
  const candidates = [imgId - 1, imgId + 1, imgId + 2, imgId + 3]
    .filter((id) => id > 0 && !PRIMARY_IDS.has(id))
  const valid: number[] = []
  for (const id of candidates) {
    if (await probeImage(id)) valid.push(id)
  }
  return valid
}

export async function POST(req: Request) {
  const authErr = await requireAdminRequest(req)
  if (authErr) return authErr

  const results: Array<{ productId: string; added: number; extraIds: number[]; error?: string }> = []

  for (const { productId, imgId } of KACHET_PRODUCTS) {
    try {
      // 1 — intentar descubrir desde la página del producto
      let extraIds = await discoverFromPage(imgId)

      // 2 — si no encontramos nada en la página, sondear IDs adyacentes
      if (extraIds.length === 0) {
        extraIds = await probeNearbyIds(imgId)
      }

      if (extraIds.length === 0) {
        results.push({ productId, added: 0, extraIds: [] })
        continue
      }

      // 3 — insertar en product_images los que no existan todavía
      const existing = await prisma.productImage.findMany({ where: { productId }, select: { url: true } })
      const existingUrls = new Set(existing.map((e) => e.url))

      let added = 0
      let order = existing.length + 1
      for (const extraId of extraIds) {
        const url = `/api/img-proxy?u=https://www.kachet.com.ar/fotos/shop/${extraId}.jpg`
        if (existingUrls.has(url)) continue

        const id = `${productId.replace("kachp", "kachi")}_${order}`
        await prisma.productImage.create({ data: { id, productId, url, order } })
        added++
        order++
      }

      results.push({ productId, added, extraIds })
    } catch (e) {
      results.push({ productId, added: 0, extraIds: [], error: String(e) })
    }
  }

  const totalAdded = results.reduce((s, r) => s + r.added, 0)
  return NextResponse.json({ totalAdded, results })
}
