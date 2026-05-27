import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseService } from "@/lib/supabase/service"
import { hasValidProductImageUrl, primaryImageUrlFromRows } from "@/lib/productVisibility"

/** Escapa caracteres wildcard de ILIKE para evitar SQL injection via wildcards */
function escapeIlikeTerm(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&")
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("image") as File | null

    if (!file) return NextResponse.json({ error: "Image required" }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const mimeType = file.type || "image/jpeg"

    // Ask Gemini Vision to identify the product
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType,
        },
      },
      {
        text: `Analizá esta imagen de un producto/herramienta/maquinaria.

Respondé SOLO con un JSON válido (sin markdown) con estos campos:
- "product_name": nombre del producto identificado en español (ej: "Motosierra Stihl MS 170")
- "category": categoría general (ej: "Motosierras", "Taladros", "Amoladoras", etc.)
- "keywords": array de 3-5 palabras clave para buscar productos similares en un marketplace
- "brand": marca identificada o null
- "description": descripción breve de lo que se ve en la imagen (1 oración en español)
- "confidence": nivel de confianza de 0 a 1

Si no podés identificar el producto, devolvé:
{"product_name": "Producto no identificado", "keywords": [], "confidence": 0, "description": "No se pudo identificar el producto en la imagen"}`,
      },
    ])

    const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = { product_name: "Producto no identificado", keywords: [], confidence: 0, description: "Error al procesar la imagen" }
    }

    let supabase
    try {
      supabase = getSupabaseService()
    } catch {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY not configured on server" },
        { status: 500 }
      )
    }

    // Search products with identified keywords
    const keywords: string[] = parsed.keywords || []

    let products: any[] = []

    if (keywords.length > 0) {
      const orConditions = keywords.map((k: string) => `title.ilike.%${escapeIlikeTerm(k)}%`).join(",")

      const { data } = await supabase
        .from("products")
        .select(`
          id, title, price, original_price, condition, free_shipping, stock,
          product_images(url, is_primary)
        `)
        .eq("is_active", true)
        .or(orConditions)
        .limit(16)

      products = (data || [])
        .map((p: any) => ({
          id: p.id,
          title: p.title,
          price: Number(p.price),
          original_price: p.original_price,
          condition: p.condition,
          shipping_free: Boolean(p.free_shipping ?? p.shipping_free),
          primary_image: primaryImageUrlFromRows(p.product_images),
          seller_name: null,
          category_name: null,
          sales: 0,
        }))
        .filter((p: any) => hasValidProductImageUrl(p.primary_image))
    }

    return NextResponse.json({
      identified: parsed,
      products,
      total: products.length,
    })
  } catch (error: any) {
    console.error("Image search error:", error)
    return NextResponse.json({ error: error?.message || "Image search error" }, { status: 500 })
  }
}
