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
    const { action, userId } = body

    const supabase = createClient(supabaseUrl, supabaseKey)
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // ═══ Generate smart notifications for a user ═══
    if (action === "generate") {
      // Get products with price drops
      const { data: priceDrops } = await supabase
        .from("products")
        .select("id, title, price, original_price, slug")
        .eq("is_active", true)
        .not("original_price", "is", null)
        .order("updated_at", { ascending: false })
        .limit(10)

      // Get low stock products
      const { data: lowStock } = await supabase
        .from("products")
        .select("id, title, stock, price, slug")
        .eq("is_active", true)
        .lte("stock", 3)
        .gt("stock", 0)
        .limit(10)

      // Get new arrivals
      const { data: newArrivals } = await supabase
        .from("products")
        .select("id, title, price, slug")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5)

      // Get trending (most viewed recently)
      const { data: trending } = await supabase
        .from("products")
        .select("id, title, price, view_count, slug")
        .eq("is_active", true)
        .order("view_count", { ascending: false })
        .limit(5)

      const context = {
        priceDrops: priceDrops?.map(p => ({ title: p.title, price: p.price, originalPrice: p.original_price, discount: p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0 })) || [],
        lowStock: lowStock?.map(p => ({ title: p.title, stock: p.stock, price: p.price })) || [],
        newArrivals: newArrivals?.map(p => ({ title: p.title, price: p.price })) || [],
        trending: trending?.map(p => ({ title: p.title, views: p.view_count })) || [],
      }

      const prompt = `Sos el sistema de notificaciones inteligentes de MadsJeez, marketplace de maquinaria y herramientas en Argentina.

DATOS DEL MARKETPLACE:
- Productos con descuento: ${JSON.stringify(context.priceDrops.slice(0, 5))}
- Últimas unidades: ${JSON.stringify(context.lowStock.slice(0, 5))}
- Recién llegados: ${JSON.stringify(context.newArrivals.slice(0, 3))}
- Tendencia: ${JSON.stringify(context.trending.slice(0, 3))}

Generá notificaciones inteligentes y atractivas. Respondé con JSON:
{
  "notifications": [
    {
      "type": "price_drop|low_stock|new_arrival|trending|deal|tip",
      "title": "título corto (máx 50 chars)",
      "message": "mensaje atractivo (máx 100 chars)",
      "emoji": "emoji relevante",
      "urgency": "low|medium|high",
      "product_title": "nombre del producto relacionado (si aplica)"
    }
  ]
}

Generá 5-8 notificaciones variadas. Usá español argentino, sé directo y generá urgencia cuando corresponda.`

      const result = await model.generateContent(prompt)
      const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      let parsed
      try { parsed = JSON.parse(text) } catch { parsed = { notifications: [] } }

      // Enrich notifications with product data
      const enrichedNotifications = parsed.notifications?.map((n: any) => {
        const relatedProduct =
          priceDrops?.find(p => p.title.includes(n.product_title || "___")) ||
          lowStock?.find(p => p.title.includes(n.product_title || "___")) ||
          newArrivals?.find(p => p.title.includes(n.product_title || "___")) ||
          trending?.find(p => p.title.includes(n.product_title || "___"))

        return {
          ...n,
          product_id: relatedProduct?.id || null,
          product_slug: relatedProduct?.slug || null,
        }
      }) || []

      return NextResponse.json({ notifications: enrichedNotifications })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Notifications AI error:", error)
    return NextResponse.json({ error: error?.message || "Notifications error" }, { status: 500 })
  }
}
