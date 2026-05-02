import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })

    const body = await req.json()
    const { userId, viewedProducts, searchHistory, currentProductId } = body

    const supabase = createClient(supabaseUrl, supabaseKey)
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Get user's viewed products context
    let viewedContext = ""
    if (viewedProducts && viewedProducts.length > 0) {
      const { data: viewed } = await supabase
        .from("products")
        .select("title, price, category_id, condition")
        .in("id", viewedProducts.slice(0, 5))
      if (viewed) viewedContext = viewed.map(p => `"${p.title}" ($${p.price})`).join(", ")
    }

    // Get current product if browsing one
    let currentContext = ""
    if (currentProductId) {
      const { data: current } = await supabase
        .from("products")
        .select("title, price, category_id, condition, description")
        .eq("id", currentProductId)
        .single()
      if (current) currentContext = `Producto actual: "${current.title}" ($${current.price}) - ${current.description?.slice(0, 100) || ""}`
    }

    // Get popular and recent products from catalog
    const { data: popularProducts } = await supabase
      .from("products")
      .select("id, title, price, original_price, condition, shipping_free, category_id")
      .eq("is_active", true)
      .order("view_count", { ascending: false })
      .limit(30)

    const { data: recentProducts } = await supabase
      .from("products")
      .select("id, title, price, original_price, condition, shipping_free, category_id")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20)

    const allProducts = [...(popularProducts || []), ...(recentProducts || [])]
    const uniqueProducts = allProducts.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)

    const catalogText = uniqueProducts.slice(0, 40).map(p =>
      `ID:${p.id} | "${p.title}" | $${p.price} | ${p.condition} | ${p.shipping_free ? "Envío gratis" : ""}`
    ).join("\n")

    const prompt = `Sos el motor de recomendación de MaqJeez, marketplace de maquinaria y herramientas en Argentina.

CONTEXTO DEL USUARIO:
- Productos vistos: ${viewedContext || "Ninguno aún"}
- Búsquedas recientes: ${searchHistory?.join(", ") || "Ninguna"}
${currentContext}

CATÁLOGO DISPONIBLE:
${catalogText}

Seleccioná los 8 mejores productos del catálogo para recomendar a este usuario. Priorizá:
1. Relevancia con lo que buscó/vio
2. Productos complementarios (si vio un taladro, recomendar mechas)
3. Ofertas y envío gratis
4. Productos populares si no hay historial

Responde SOLO con JSON:
{
  "recommendations": [
    { "id": "product_id", "reason": "razón breve de la recomendación (máx 40 chars)" }
  ],
  "section_title": "título personalizado para la sección (ej: 'Herramientas que te van a servir')"
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

    let parsed
    try { parsed = JSON.parse(text) } catch { parsed = { recommendations: [], section_title: "Recomendados para vos" } }

    // Enrich recommendations with full product data
    const recIds = parsed.recommendations?.map((r: any) => r.id).filter(Boolean) || []
    let enrichedProducts: any[] = []

    if (recIds.length > 0) {
      const { data } = await supabase
        .from("products")
        .select("id, title, price, original_price, condition, shipping_free, slug, product_images(url)")
        .in("id", recIds)
        .eq("is_active", true)

      enrichedProducts = (data || []).map(p => ({
        ...p,
        image: p.product_images?.[0]?.url || null,
        reason: parsed.recommendations.find((r: any) => r.id === p.id)?.reason || "",
      }))
    }

    return NextResponse.json({
      section_title: parsed.section_title || "Recomendados para vos",
      products: enrichedProducts,
    })
  } catch (error: any) {
    console.error("Recommendations AI error:", error)
    return NextResponse.json({ error: error?.message || "Recommendations error" }, { status: 500 })
  }
}
