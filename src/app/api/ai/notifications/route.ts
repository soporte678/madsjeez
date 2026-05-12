import { GoogleGenerativeAI } from "@google/generative-ai"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit-memory"
import { getSupabaseService } from "@/lib/supabase/service"

type ContextSlice = {
  priceDrops: { title: string; price: number; originalPrice: number; discount: number }[]
  lowStock: { title: string; stock: number; price: number }[]
  newArrivals: { title: string; price: number }[]
  trending: { title: string; views: number }[]
}

function isGeminiQuotaOr429(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  const status = (error as { status?: number })?.status
  return (
    status === 429 ||
    /\b429\b/i.test(msg) ||
    /quota|Too Many Requests|RESOURCE_EXHAUSTED/i.test(msg)
  )
}

function isGeminiAccessDenied(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  const status = (error as { status?: number })?.status
  return status === 403 || /403|denied access|Forbidden/i.test(msg)
}

/** Notificaciones determinísticas si Gemini no está disponible o superaste cuota. */
function buildFallbackNotifications(ctx: ContextSlice) {
  type Row = {
    type: "price_drop" | "low_stock" | "new_arrival" | "trending"
    title: string
    message: string
    emoji: string
    urgency: "low" | "medium" | "high"
    product_title: string
  }
  const rows: Row[] = []
  for (const p of ctx.priceDrops.slice(0, 4)) {
    if (p.discount <= 0) continue
    rows.push({
      type: "price_drop",
      title: `${p.discount}% off`,
      message: `${p.title.slice(0, 55)}${p.title.length > 55 ? "…" : ""}`,
      emoji: "🏷️",
      urgency: "medium",
      product_title: p.title,
    })
  }
  for (const p of ctx.lowStock.slice(0, 3)) {
    const short = p.title.length > 48 ? `${p.title.slice(0, 48)}…` : p.title
    rows.push({
      type: "low_stock",
      title: "Últimas unidades",
      message: `${short} — quedan ${p.stock}.`,
      emoji: "⚠️",
      urgency: "high",
      product_title: p.title,
    })
  }
  for (const p of ctx.newArrivals.slice(0, 3)) {
    rows.push({
      type: "new_arrival",
      title: "Recién llegado",
      message: `${p.title.slice(0, 60)}${p.title.length > 60 ? "…" : ""}`,
      emoji: "✨",
      urgency: "low",
      product_title: p.title,
    })
  }
  for (const p of ctx.trending.slice(0, 3)) {
    rows.push({
      type: "trending",
      title: "Lo más visto",
      message: `${p.title.slice(0, 50)}${p.title.length > 50 ? "…" : ""} (${p.views} vistas)`,
      emoji: "📈",
      urgency: "low",
      product_title: p.title,
    })
  }
  return rows.slice(0, 8)
}

const RATE_WINDOW_MS = 15 * 60 * 1000
const RATE_MAX_ANON = Math.max(5, Number(process.env.NOTIFICATIONS_RATE_LIMIT_ANON_MAX) || 18)
const RATE_MAX_AUTH = Math.max(10, Number(process.env.NOTIFICATIONS_RATE_LIMIT_AUTH_MAX) || 45)

export async function POST(req: NextRequest) {
  try {
    let body: { action?: string } = {}
    try {
      body = (await req.json()) as { action?: string }
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const { action } = body

    const session = await getServerSession(authOptions)
    const ip = clientIpFromRequest(req)
    const rateKey = session?.user?.id ? `notif:user:${session.user.id}` : `notif:ip:${ip}`
    const rateMax = session?.user?.id ? RATE_MAX_AUTH : RATE_MAX_ANON
    const limited = checkRateLimit(rateKey, { max: rateMax, windowMs: RATE_WINDOW_MS })
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá más tarde." },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY

    let supabase
    try {
      supabase = getSupabaseService()
    } catch {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY not configured on server" },
        { status: 500 }
      )
    }

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

      const context: ContextSlice = {
        priceDrops: priceDrops?.map(p => ({ title: p.title, price: p.price, originalPrice: p.original_price, discount: p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0 })) || [],
        lowStock: lowStock?.map(p => ({ title: p.title, stock: p.stock, price: p.price })) || [],
        newArrivals: newArrivals?.map(p => ({ title: p.title, price: p.price })) || [],
        trending: trending?.map(p => ({ title: p.title, views: p.view_count })) || [],
      }

      const enrich = (list: { product_title?: string | null }[]) =>
        list.map((n) => {
          const pt = n.product_title || "___"
          const relatedProduct =
            priceDrops?.find(p => p.title.includes(pt)) ||
            lowStock?.find(p => p.title.includes(pt)) ||
            newArrivals?.find(p => p.title.includes(pt)) ||
            trending?.find(p => p.title.includes(pt))
          return {
            ...n,
            product_id: relatedProduct?.id || null,
            product_slug: relatedProduct?.slug || null,
          }
        })

      if (process.env.GEMINI_NOTIFICATIONS_DISABLED === "true") {
        const fallback = buildFallbackNotifications(context)
        return NextResponse.json({
          notifications: enrich(fallback),
          aiUnavailable: true,
          aiReason: "disabled_via_env",
        })
      }

      if (!apiKey) {
        const fallback = buildFallbackNotifications(context)
        return NextResponse.json({
          notifications: enrich(fallback),
          aiUnavailable: true,
          aiReason: "no_api_key",
        })
      }

      if (!session?.user?.id) {
        const fallback = buildFallbackNotifications(context)
        return NextResponse.json({
          notifications: enrich(fallback),
          aiUnavailable: true,
          aiReason: "anonymous_uses_deterministic_feed",
        })
      }

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

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

      try {
        const result = await model.generateContent(prompt)
        const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
        let parsed
        try {
          parsed = JSON.parse(text)
        } catch {
          parsed = { notifications: [] }
        }

        const enrichedNotifications = enrich(parsed.notifications || [])

        return NextResponse.json({ notifications: enrichedNotifications })
      } catch (geminiErr: unknown) {
        if (isGeminiQuotaOr429(geminiErr) || isGeminiAccessDenied(geminiErr)) {
          console.warn(
            "[notifications] Gemini unavailable (quota/rate/access); serving deterministic fallback."
          )
          const fallback = buildFallbackNotifications(context)
          return NextResponse.json({
            notifications: enrich(fallback),
            aiUnavailable: true,
            aiReason: isGeminiAccessDenied(geminiErr) ? "access_denied" : "quota_or_rate_limit",
          })
        }
        throw geminiErr
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Notifications AI error:", msg)
    return NextResponse.json({ error: msg || "Notifications error" }, { status: 500 })
  }
}
