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
    const { action } = body

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // ═══════════════════════════════════════
    // ACTION: Generate social media posts
    // ═══════════════════════════════════════
    if (action === "social_posts") {
      const { productTitle, productDescription, productPrice, productCategory, platform, tone } = body

      const prompt = `Sos un experto en marketing digital para un marketplace de maquinaria, herramientas y ferretería en Argentina llamado MadsJeez (madsjeez.com.ar).

Generá un post para ${platform || "Instagram"} para promocionar este producto:
- Título: ${productTitle}
- Descripción: ${productDescription || "N/A"}
- Precio: $${productPrice || "N/A"} ARS
- Categoría: ${productCategory || "General"}
- Tono: ${tone || "profesional y atractivo"}

Responde SOLO con JSON válido:
{
  "post_text": "texto del post con emojis relevantes (máx 280 chars para Twitter, libre para Instagram/Facebook)",
  "hashtags": ["array de 8-12 hashtags relevantes en español"],
  "caption_long": "caption largo para Instagram (hasta 500 chars)",
  "caption_short": "caption corto para stories/reels (máx 100 chars)",
  "call_to_action": "frase de llamada a la acción",
  "best_time": "mejor horario para publicar en Argentina",
  "content_ideas": ["3 ideas de contenido visual para acompañar el post"]
}`

      const result = await model.generateContent(prompt)
      const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      try { return NextResponse.json(JSON.parse(text)) } catch { return NextResponse.json({ post_text: text }) }
    }

    // ═══════════════════════════════════════
    // ACTION: Generate remarketing email
    // ═══════════════════════════════════════
    if (action === "remarketing_email") {
      const { emailType, productTitle, productPrice, customerName, storeName, promotionDetails } = body

      const emailTypes: Record<string, string> = {
        abandoned_cart: "Email para carrito abandonado. El cliente dejó productos sin comprar.",
        welcome: "Email de bienvenida para nuevo comprador registrado.",
        promotion: `Email promocional. Promoción: ${promotionDetails || "descuento especial"}`,
        restock: "Email avisando que un producto que el cliente buscó volvió a tener stock.",
        review: "Email pidiendo al comprador que deje una reseña después de recibir su compra.",
        inactive: "Email para reactivar un cliente que no compra hace más de 30 días.",
      }

      const prompt = `Sos un copywriter experto en email marketing para MadsJeez, marketplace de maquinaria y herramientas en Argentina.

Tipo de email: ${emailTypes[emailType] || emailType}
Producto: ${productTitle || "N/A"}
Precio: $${productPrice || "N/A"} ARS
Cliente: ${customerName || "Cliente"}
Tienda: ${storeName || "MadsJeez"}

Generá el email en JSON:
{
  "subject": "asunto del email (máx 60 chars, atractivo, con emoji opcional)",
  "preview_text": "texto de preview (máx 90 chars)",
  "greeting": "saludo personalizado",
  "body_html": "cuerpo del email en HTML simple (usar <p>, <strong>, <br>, <a>). Profesional pero cercano. Español argentino.",
  "cta_text": "texto del botón CTA",
  "cta_url": "URL sugerida del CTA (relativa)",
  "footer_text": "texto del footer",
  "urgency_line": "frase de urgencia opcional (ej: Oferta válida por 48hs)"
}`

      const result = await model.generateContent(prompt)
      const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      try { return NextResponse.json(JSON.parse(text)) } catch { return NextResponse.json({ body_html: text }) }
    }

    // ═══════════════════════════════════════
    // ACTION: Generate banner/campaign text
    // ═══════════════════════════════════════
    if (action === "banner_text") {
      const { campaignType, discount, dateRange, targetAudience, products } = body

      const prompt = `Sos un creativo publicitario para MadsJeez, marketplace de maquinaria y herramientas en Argentina.

Campaña: ${campaignType || "promoción general"}
Descuento: ${discount || "N/A"}
Fecha: ${dateRange || "N/A"}
Público objetivo: ${targetAudience || "compradores generales"}
Productos destacados: ${products || "variados"}

Generá textos para la campaña en JSON:
{
  "headline": "titular principal (máx 8 palabras, impactante)",
  "subheadline": "subtítulo (máx 15 palabras)",
  "banner_hero": "texto para banner principal del sitio (corto, directo)",
  "banner_secondary": "texto para banner secundario",
  "popup_title": "título para popup promocional",
  "popup_body": "cuerpo del popup (máx 80 chars)",
  "push_notification": "texto para notificación push (máx 100 chars)",
  "sms_text": "texto para SMS (máx 160 chars)",
  "whatsapp_message": "mensaje para WhatsApp broadcast (informal, con emojis)",
  "meta_ad_primary": "texto principal para anuncio en Meta/Facebook",
  "meta_ad_headline": "titular del anuncio de Meta (máx 40 chars)",
  "google_ad_title": "título de anuncio Google Ads (máx 30 chars)",
  "google_ad_description": "descripción de anuncio Google Ads (máx 90 chars)"
}`

      const result = await model.generateContent(prompt)
      const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      try { return NextResponse.json(JSON.parse(text)) } catch { return NextResponse.json({ headline: text }) }
    }

    // ═══════════════════════════════════════
    // ACTION: Price & competition analysis
    // ═══════════════════════════════════════
    if (action === "price_analysis") {
      const { productTitle, productPrice, productCategory } = body
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Get similar products from the marketplace
      const keywords = productTitle.toLowerCase().split(" ").filter((w: string) => w.length > 3).slice(0, 3)
      let similarProducts: any[] = []

      if (keywords.length > 0) {
        const orConditions = keywords.map((k: string) => `title.ilike.%${k}%`).join(",")
        const { data } = await supabase
          .from("products")
          .select("title, price, original_price, condition, shipping_free")
          .eq("is_active", true)
          .or(orConditions)
          .limit(20)
        similarProducts = data || []
      }

      // If no similar products found by keyword, get from same category
      if (similarProducts.length === 0 && productCategory) {
        const { data } = await supabase
          .from("products")
          .select("title, price, original_price, condition, shipping_free")
          .eq("is_active", true)
          .eq("category_id", productCategory)
          .limit(20)
        similarProducts = data || []
      }

      const prices = similarProducts.map(p => p.price).filter(Boolean)
      const avgPrice = prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

      const competitorData = similarProducts.map(p => ({
        title: p.title,
        price: p.price,
        condition: p.condition,
        free_shipping: p.shipping_free,
      }))

      const prompt = `Sos un analista de pricing para un marketplace de maquinaria y herramientas en Argentina.

Producto a analizar: "${productTitle}"
Precio actual: $${productPrice} ARS

Datos del mercado interno (productos similares en MadsJeez):
- Precio promedio: $${Math.round(avgPrice).toLocaleString()} ARS
- Precio mínimo: $${Math.round(minPrice).toLocaleString()} ARS
- Precio máximo: $${Math.round(maxPrice).toLocaleString()} ARS
- Competidores encontrados: ${similarProducts.length}
${competitorData.length > 0 ? "Detalle:\n" + competitorData.slice(0, 8).map(c => `  - "${c.title}" → $${c.price?.toLocaleString()} (${c.condition}) ${c.free_shipping ? "[Envío gratis]" : ""}`).join("\n") : "Sin datos de competidores internos."}

Respondé con JSON:
{
  "price_position": "barato|competitivo|caro|muy_caro",
  "recommended_price": number (precio sugerido en ARS),
  "recommended_original_price": number (precio tachado sugerido para mostrar descuento),
  "discount_strategy": "estrategia de descuento recomendada",
  "market_analysis": "análisis breve del mercado (3-4 oraciones en español argentino)",
  "tips": ["3-5 tips concretos para mejorar ventas de este producto"],
  "competitors_count": ${similarProducts.length},
  "avg_price": ${Math.round(avgPrice)},
  "min_price": ${Math.round(minPrice)},
  "max_price": ${Math.round(maxPrice)},
  "free_shipping_recommendation": boolean (si debería ofrecer envío gratis),
  "urgency_suggestion": "sugerencia de urgencia para la publicación (ej: Últimas unidades, Oferta por tiempo limitado)"
}`

      const result = await model.generateContent(prompt)
      const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      try {
        const parsed = JSON.parse(text)
        parsed.competitors = competitorData.slice(0, 8)
        return NextResponse.json(parsed)
      } catch {
        return NextResponse.json({ market_analysis: text, competitors: competitorData.slice(0, 8) })
      }
    }

    // ═══════════════════════════════════════
    // ACTION: SEO optimization
    // ═══════════════════════════════════════
    if (action === "seo_optimize") {
      const { productTitle, productDescription, productCategory } = body

      const prompt = `Sos un experto SEO para un marketplace de maquinaria y herramientas en Argentina (madsjeez.com.ar / MadsJeez).

Producto: "${productTitle}"
Descripción actual: "${productDescription || "Sin descripción"}"
Categoría: "${productCategory || "General"}"

Optimizá para SEO y respondé con JSON:
{
  "optimized_title": "título optimizado para SEO (máx 60 chars)",
  "meta_description": "meta descripción (máx 155 chars)",
  "primary_keywords": ["5 palabras clave principales"],
  "long_tail_keywords": ["5 long-tail keywords"],
  "optimized_description": "descripción optimizada con keywords naturalmente integradas (300-500 chars)",
  "seo_score": number (0-100, estimación de qué tan optimizado está),
  "improvements": ["lista de mejoras SEO aplicadas"],
  "google_snippet_preview": {
    "title": "cómo se vería en Google (máx 60 chars)",
    "description": "descripción en Google (máx 155 chars)",
    "url": "madsjeez.com.ar/product/..."
  }
}`

      const result = await model.generateContent(prompt)
      const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      try { return NextResponse.json(JSON.parse(text)) } catch { return NextResponse.json({ optimized_title: text }) }
    }

    return NextResponse.json({ error: "Invalid action. Use: social_posts, remarketing_email, banner_text, price_analysis, seo_optimize" }, { status: 400 })
  } catch (error: any) {
    console.error("Marketing AI error:", error)
    return NextResponse.json({ error: error?.message || "Marketing AI error" }, { status: 500 })
  }
}
