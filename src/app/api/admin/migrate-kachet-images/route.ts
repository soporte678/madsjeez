import { NextResponse } from "next/server"
import { requireAdminRequest } from "@/lib/admin-api"
import { createClient } from "@supabase/supabase-js"
import { prisma } from "@/lib/prisma"

const IMAGES = [
  { imgId: 4118, imageId: "kachi001" },
  { imgId: 4205, imageId: "kachi002" },
  { imgId: 3972, imageId: "kachi003" },
  { imgId: 3978, imageId: "kachi004" },
  { imgId: 3980, imageId: "kachi005" },
  { imgId: 4002, imageId: "kachi006" },
  { imgId: 4013, imageId: "kachi007" },
  { imgId: 3760, imageId: "kachi008" },
  { imgId: 4032, imageId: "kachi009" },
  { imgId: 4039, imageId: "kachi010" },
  { imgId: 4047, imageId: "kachi011" },
  { imgId: 4304, imageId: "kachi012" },
  { imgId: 3943, imageId: "kachi013" },
  { imgId: 4301, imageId: "kachi014" },
  { imgId: 4243, imageId: "kachi015" },
  { imgId: 3965, imageId: "kachi016" },
  { imgId: 4278, imageId: "kachi017" },
  { imgId: 4244, imageId: "kachi018" },
  { imgId: 4291, imageId: "kachi019" },
  { imgId: 4292, imageId: "kachi020" },
  { imgId: 4306, imageId: "kachi021" },
  { imgId: 4300, imageId: "kachi022" },
  { imgId: 4314, imageId: "kachi023" },
  { imgId: 4315, imageId: "kachi024" },
  { imgId: 4312, imageId: "kachi025" },
  { imgId: 4313, imageId: "kachi026" },
  { imgId: 4316, imageId: "kachi027" },
  { imgId: 4120, imageId: "kachi028" },
  { imgId: 4295, imageId: "kachi029" },
  { imgId: 4296, imageId: "kachi030" },
]

export async function POST(req: Request) {
  const authErr = await requireAdminRequest(req)
  if (authErr) return authErr

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const results: { imgId: number; ok: boolean; url?: string; error?: string }[] = []

  for (const { imgId, imageId } of IMAGES) {
    const storagePath = `kachet/${imgId}.jpg`
    const sourceUrl = `https://www.kachet.com.ar/fotos/shop/${imgId}.jpg`

    try {
      const res = await fetch(sourceUrl, {
        headers: {
          Referer: "https://www.kachet.com.ar/",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0",
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const buf = Buffer.from(await res.arrayBuffer())

      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(storagePath, buf, { contentType: "image/jpeg", upsert: true })
      if (upErr) throw upErr

      const { data } = supabase.storage.from("product-images").getPublicUrl(storagePath)
      const publicUrl = data.publicUrl

      await prisma.productImage.update({
        where: { id: imageId },
        data: { url: publicUrl },
      })

      results.push({ imgId, ok: true, url: publicUrl })
    } catch (e: unknown) {
      results.push({ imgId, ok: false, error: e instanceof Error ? e.message : String(e) })
    }
  }

  const ok = results.filter((r) => r.ok).length
  const fail = results.filter((r) => !r.ok).length

  return NextResponse.json({ ok, fail, results })
}
