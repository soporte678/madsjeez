import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseService } from "@/lib/supabase/service"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })

    const { productId, question, sellerTone } = await req.json()

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

    // Get product info
    let productContext = ""
    if (productId) {
      const { data: product } = await supabase
        .from("products")
        .select("title, description, price, original_price, condition, stock, shipping_free, shipping_cost")
        .eq("id", productId)
        .single()
      if (product) {
        productContext = `
Producto: "${product.title}"
Descripción: ${product.description?.slice(0, 300) || "Sin descripción"}
Precio: $${product.price}${product.original_price ? ` (antes $${product.original_price})` : ""}
Condición: ${product.condition}
Stock: ${product.stock}
Envío: ${product.shipping_free ? "Gratis" : `$${product.shipping_cost || "a calcular"}`}`
      }
    }

    const prompt = `Sos un vendedor profesional en MadsJeez, marketplace de maquinaria y herramientas en Argentina.

${productContext}

Pregunta del comprador: "${question}"

Tono: ${sellerTone || "profesional y amable"}

Generá 3 respuestas alternativas para que el vendedor elija. Cada respuesta debe:
- Ser clara y directa
- Responder la pregunta específica
- Incentivar la compra sin ser agresivo
- Usar español argentino natural
- Máximo 200 caracteres cada una

Respondé SOLO con JSON:
{
  "replies": [
    {
      "text": "respuesta sugerida",
      "tone": "profesional|amigable|directo",
      "closing": "frase de cierre (ej: ¡Esperamos tu compra!)"
    }
  ],
  "detected_intent": "qué quiere saber el comprador (precio/envío/stock/uso/garantía/otro)",
  "tip": "consejo breve para el vendedor sobre cómo responder este tipo de preguntas"
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    let parsed
    try { parsed = JSON.parse(text) } catch { parsed = { replies: [{ text: text, tone: "profesional" }] } }
    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error("Auto-reply AI error:", error)
    return NextResponse.json({ error: error?.message || "Auto-reply error" }, { status: 500 })
  }
}
