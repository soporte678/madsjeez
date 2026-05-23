import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseService } from "@/lib/supabase/service"
import { hasValidProductImageUrl, primaryImageUrlFromRows } from "@/lib/productVisibility"

export async function POST(req: NextRequest) {
  try {
    let supabase
    try {
      supabase = getSupabaseService()
    } catch {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY not configured on server" },
        { status: 500 }
      )
    }

    const { query } = await req.json()
    if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })

    // Get all categories for context
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)

    const categoryList = categories?.map(c => `${c.name} (id: ${c.id})`).join(", ") || ""

    // Ask Gemini to interpret the natural language query
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `Sos un asistente de búsqueda para un marketplace de maquinaria, herramientas y ferretería en Argentina.

El usuario escribió: "${query}"

Categorías disponibles: ${categoryList}

Tu tarea es interpretar qué busca el usuario y devolver un JSON con:
- "keywords": array de palabras clave para buscar en títulos de productos (máximo 5 palabras clave relevantes, en español)
- "category_id": el ID de la categoría más relevante (o null si no aplica)
- "min_price": precio mínimo sugerido (o null)
- "max_price": precio máximo sugerido (o null)
- "condition": "new", "used", "refurbished" o null
- "suggestion": una frase corta sugiriendo al usuario qué encontramos (en español argentino)

Ejemplos:
- "algo para cortar pasto" → keywords: ["desmalezadora", "cortadora", "césped", "podadora"]
- "taladro barato" → keywords: ["taladro"], max_price: 50000
- "herramienta para soldar" → keywords: ["soldadora", "soldador", "inverter"]
- "motosierra usada" → keywords: ["motosierra"], condition: "used"

Responde SOLO con el JSON válido, sin markdown ni explicación.`

    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      // Fallback: use original query
      parsed = { keywords: query.split(" ").filter((w: string) => w.length > 2), suggestion: `Resultados para "${query}"` }
    }

    // Search products with AI-generated keywords
    const keywords: string[] = parsed.keywords || [query]
    let dbQuery = supabase
      .from("products")
      .select(`
        id, title, price, original_price, condition, free_shipping, stock,
        product_images(url, is_primary)
      `)
      .eq("is_active", true)

    // Build OR filter for keywords
    if (keywords.length > 0) {
      const orConditions = keywords.map(k => `title.ilike.%${k}%`).join(",")
      dbQuery = dbQuery.or(orConditions)
    }

    if (parsed.category_id) dbQuery = dbQuery.eq("category_id", parsed.category_id)
    if (parsed.min_price) dbQuery = dbQuery.gte("price", parsed.min_price)
    if (parsed.max_price) dbQuery = dbQuery.lte("price", parsed.max_price)
    if (parsed.condition) dbQuery = dbQuery.eq("condition", parsed.condition)

    const { data: products } = await dbQuery.limit(24)

    const formattedProducts = (products || [])
      .map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        original_price: p.original_price,
        condition: p.condition,
        shipping_free: Boolean(p.free_shipping ?? p.shipping_free),
        stock: p.stock,
        primary_image: primaryImageUrlFromRows(p.product_images),
        seller_name: null,
        category_name: null,
        sales: 0,
      }))
      .filter((p: any) => hasValidProductImageUrl(p.primary_image))

    return NextResponse.json({
      products: formattedProducts,
      suggestion: parsed.suggestion || `Resultados para "${query}"`,
      keywords: parsed.keywords || [],
      total: formattedProducts.length,
    })
  } catch (error: any) {
    console.error("Smart search error:", error)
    return NextResponse.json({ error: error?.message || "Search error" }, { status: 500 })
  }
}
