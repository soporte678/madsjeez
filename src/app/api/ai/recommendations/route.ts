import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseService } from "@/lib/supabase/service"
import { hasValidProductImageUrl, primaryImageUrlFromRows } from "@/lib/productVisibility"
import { guardAiRoute } from "@/lib/ai/guard"

export async function POST(req: NextRequest) {
  // Buyer-facing (homepage): no exige auth, pero rate-limit por IP para frenar abuso de costo.
  const _g = await guardAiRoute(req, { requireAuth: false, max: 30 });
  if (!_g.ok) return _g.response;

  const fallback = (reason: string) =>
    NextResponse.json({
      section_title: "Productos populares",
      products: [],
      _meta: { fallback: true, reason },
    });

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json({
        section_title: "Productos populares",
        products: [],
        _meta: { fallback: true, reason: "GEMINI_API_KEY not configured" }
      })
    }

    let supabase
    try {
      supabase = getSupabaseService()
    } catch {
      return NextResponse.json({
        section_title: "Productos populares",
        products: [],
        _meta: { fallback: true, reason: "Supabase service role not configured" },
      })
    }

    const body = await req.json()
    const { userId, viewedProducts, searchHistory, currentProductId } = body
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

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
      .select("id, title, price, original_price, condition, free_shipping, category_id")
      .eq("is_active", true)
      .order("views", { ascending: false })
      .limit(30)

    const { data: recentProducts } = await supabase
      .from("products")
      .select("id, title, price, original_price, condition, free_shipping, category_id")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20)

    const allProducts = [...(popularProducts || []), ...(recentProducts || [])]
    const uniqueProducts = allProducts.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)

    const catalogText = uniqueProducts.slice(0, 40).map(p =>
      `ID:${p.id} | "${p.title}" | $${p.price} | ${p.condition} | ${p.free_shipping ? "Envío gratis" : ""}`
    ).join("\n")

    const prompt = `Sos el motor de recomendación de MadsJeez, marketplace de maquinaria y herramientas en Argentina.

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
          .select("id, title, price, original_price, condition, free_shipping, product_images(url)")
          .in("id", recIds)
          .eq("is_active", true)

        const mapped = (data || []).map((p) => ({
          ...p,
          image: primaryImageUrlFromRows(p.product_images),
          reason: parsed.recommendations.find((r: any) => r.id === p.id)?.reason || "",
        }))
        const filtered = mapped.filter((p) => hasValidProductImageUrl(p.image))
        const byId = new Map(filtered.map((p) => [p.id, p]))
        enrichedProducts = recIds.map((id: string) => byId.get(id)).filter(Boolean)
      }

    return NextResponse.json({
      section_title: parsed.section_title || "Recomendados para vos",
      products: enrichedProducts,
    })
  } catch (error: any) {
    const message = String(error?.message || "");
    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      return fallback("gemini_quota_exceeded");
    }
    console.error("Recommendations AI error:", error);
    return fallback("recommendations_service_error");
  }
}
