import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })

    const { productId, reviews } = await req.json()

    const supabase = createClient(supabaseUrl, supabaseKey)
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Get reviews from DB if not provided
    let reviewsData = reviews
    if (!reviewsData && productId) {
      const { data } = await supabase
        .from("reviews")
        .select("rating, comment, created_at, user_id")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(50)
      reviewsData = data || []
    }

    if (!reviewsData || reviewsData.length === 0) {
      return NextResponse.json({ summary: "Este producto aún no tiene opiniones.", analysis: null })
    }

    const reviewsText = reviewsData.map((r: any, i: number) =>
      `[${r.rating}★] "${r.comment || 'Sin comentario'}" (${r.created_at?.slice(0, 10) || 'fecha desconocida'})`
    ).join("\n")

    const prompt = `Sos un analista de opiniones de MadsJeez, marketplace de maquinaria y herramientas en Argentina.

OPINIONES DEL PRODUCTO:
${reviewsText}

Analizá las opiniones y respondé con JSON:
{
  "summary": "resumen de todas las opiniones en 2-3 oraciones (español argentino, útil para compradores)",
  "average_sentiment": "positivo|neutral|negativo",
  "strengths": ["3 puntos fuertes mencionados por compradores"],
  "weaknesses": ["puntos débiles mencionados (si hay)"],
  "common_themes": ["temas más mencionados"],
  "recommendation": "recomendación general en 1 oración",
  "fake_review_flags": [
    {
      "index": 0,
      "reason": "razón de sospecha",
      "confidence": 0.8
    }
  ],
  "buyer_tip": "consejo para futuros compradores basado en las opiniones",
  "rating_breakdown": {
    "quality": 4.2,
    "value_for_money": 3.8,
    "shipping": 4.0,
    "description_accuracy": 4.1
  }
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    let parsed
    try { parsed = JSON.parse(text) } catch { parsed = { summary: text } }
    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error("Reviews AI error:", error)
    return NextResponse.json({ error: error?.message || "Reviews AI error" }, { status: 500 })
  }
}
