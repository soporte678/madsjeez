import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseService } from "@/lib/supabase/service"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })

    const body = await req.json()
    const { action } = body

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    let supabase
    try {
      supabase = getSupabaseService()
    } catch {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY not configured on server" },
        { status: 500 }
      )
    }

    // ═══ Generate blog article ═══
    if (action === "generate_article") {
      const { topic, targetKeyword, articleType } = body

      // Get related products from catalog
      const keywords = (targetKeyword || topic).toLowerCase().split(" ").filter((w: string) => w.length > 3).slice(0, 3)
      let relatedProducts: any[] = []
      if (keywords.length > 0) {
        const orConditions = keywords.map((k: string) => `title.ilike.%${k}%`).join(",")
        const { data } = await supabase
          .from("products")
          .select("id, title, price, slug")
          .eq("is_active", true)
          .or(orConditions)
          .limit(5)
        relatedProducts = data || []
      }

      const articleTypes: Record<string, string> = {
        buying_guide: "Guía de compra completa",
        comparison: "Comparativa/ranking de productos",
        how_to: "Tutorial/cómo usar",
        tips: "Tips y consejos profesionales",
        trends: "Tendencias del sector",
        maintenance: "Mantenimiento y cuidados",
      }

      const prompt = `Sos un redactor SEO experto para MadsJeez, marketplace de maquinaria, herramientas y ferretería en Argentina (madsjeez.com.ar).

Escribí un artículo tipo: ${articleTypes[articleType] || articleType || "guía de compra"}
Tema: ${topic}
Keyword principal: ${targetKeyword || topic}

${relatedProducts.length > 0 ? `Productos relacionados en el catálogo:\n${relatedProducts.map(p => `- "${p.title}" ($${p.price}) → /product/${p.slug || p.id}`).join("\n")}` : ""}

REGLAS:
- Español argentino natural, profesional pero cercano
- 800-1500 palabras
- Optimizado para SEO con la keyword principal
- Incluir H2 y H3 bien estructurados
- Linkear productos del catálogo cuando sea relevante
- Incluir datos técnicos reales y útiles
- NO inventar marcas o modelos que no existan

Respondé SOLO con JSON:
{
  "title": "título SEO optimizado (máx 60 chars)",
  "slug": "slug-url-amigable",
  "meta_description": "meta description (máx 155 chars)",
  "excerpt": "extracto para preview (máx 200 chars)",
  "content_html": "artículo completo en HTML (<h2>, <h3>, <p>, <ul>, <li>, <strong>, <a href>). NO incluir <h1>.",
  "primary_keyword": "keyword principal",
  "secondary_keywords": ["5 keywords secundarias"],
  "estimated_reading_time": number (minutos),
  "related_product_ids": ["ids de productos mencionados"],
  "suggested_internal_links": ["URLs internas sugeridas"],
  "schema_faq": [
    { "question": "pregunta FAQ", "answer": "respuesta" }
  ]
}`

      const result = await model.generateContent(prompt)
      const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      let parsed
      try { parsed = JSON.parse(text) } catch { parsed = { title: topic, content_html: text } }
      return NextResponse.json(parsed)
    }

    // ═══ Generate article ideas ═══
    if (action === "generate_ideas") {
      const { category, count } = body

      // Get categories and top products for context
      const { data: cats } = await supabase.from("categories").select("name").limit(20)
      const { data: topProducts } = await supabase
        .from("products")
        .select("title")
        .eq("is_active", true)
        .order("view_count", { ascending: false })
        .limit(15)

      const prompt = `Sos el content strategist de MadsJeez, marketplace de maquinaria y herramientas en Argentina.

Categorías del marketplace: ${cats?.map(c => c.name).join(", ") || "herramientas, maquinaria, ferretería"}
Productos más buscados: ${topProducts?.map(p => p.title).join(", ") || "varios"}
${category ? `Enfocarse en: ${category}` : "Temas generales del sector"}

Generá ${count || 10} ideas de artículos de blog que atraigan tráfico SEO orgánico de Google.

Respondé SOLO con JSON:
{
  "ideas": [
    {
      "title": "título del artículo",
      "type": "buying_guide|comparison|how_to|tips|trends|maintenance",
      "target_keyword": "keyword principal para SEO",
      "estimated_monthly_searches": "estimación de búsquedas mensuales en Argentina",
      "difficulty": "baja|media|alta",
      "priority": "alta|media|baja"
    }
  ]
}`

      const result = await model.generateContent(prompt)
      const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      let parsed
      try { parsed = JSON.parse(text) } catch { parsed = { ideas: [] } }
      return NextResponse.json(parsed)
    }

    return NextResponse.json({ error: "Invalid action. Use: generate_article, generate_ideas" }, { status: 400 })
  } catch (error: any) {
    console.error("Blog AI error:", error)
    return NextResponse.json({ error: error?.message || "Blog AI error" }, { status: 500 })
  }
}
