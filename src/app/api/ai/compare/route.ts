import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseService } from "@/lib/supabase/service"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })

    const { productIds } = await req.json()
    if (!productIds || productIds.length < 2 || productIds.length > 4) {
      return NextResponse.json({ error: "Se necesitan 2 a 4 productos para comparar" }, { status: 400 })
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
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const { data: products } = await supabase
      .from("products")
      .select("id, title, description, price, original_price, condition, free_shipping, shipping_cost, stock, views, sales, product_images(url)")
      .in("id", productIds)

    if (!products || products.length < 2) {
      return NextResponse.json({ error: "No se encontraron suficientes productos" }, { status: 404 })
    }

    const productsText = products.map((p, i) => `
PRODUCTO ${i + 1}: "${p.title}"
- Precio: $${p.price}${p.original_price ? ` (antes $${p.original_price})` : ""}
- Condición: ${p.condition}
- Envío gratis: ${p.free_shipping ? "Sí" : "No"}${p.shipping_cost ? ` ($${p.shipping_cost})` : ""}
- Stock: ${p.stock}
- Vistas: ${p.views ?? 0} | Vendidos: ${p.sales ?? 0}
- Descripción: ${p.description?.slice(0, 200) || "Sin descripción"}
`).join("\n")

    const prompt = `Sos un experto comparador de productos de MadsJeez, marketplace de maquinaria y herramientas en Argentina.

Compará estos productos:
${productsText}

Respondé SOLO con JSON:
{
  "comparison_table": [
    {
      "feature": "nombre de la característica",
      "values": ["valor producto 1", "valor producto 2", ...]
    }
  ],
  "pros_cons": [
    {
      "product_index": 0,
      "pros": ["ventaja 1", "ventaja 2"],
      "cons": ["desventaja 1"]
    }
  ],
  "winner": {
    "index": 0,
    "reason": "razón por la que es el mejor (2-3 oraciones)"
  },
  "best_value": {
    "index": 0,
    "reason": "cuál tiene mejor relación precio/calidad"
  },
  "summary": "resumen de la comparación en 3-4 oraciones, español argentino, amigable"
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

    let parsed
    try { parsed = JSON.parse(text) } catch { parsed = { summary: text } }

    // Enrich with product data
    parsed.products = products.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      original_price: p.original_price,
      condition: p.condition,
      shipping_free: Boolean(p.free_shipping),
      image: p.product_images?.[0]?.url || null,
    }))

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error("Compare AI error:", error)
    return NextResponse.json({ error: error?.message || "Compare error" }, { status: 500 })
  }
}
