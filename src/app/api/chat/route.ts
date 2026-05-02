import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getAdminSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

async function getMarketplaceContext(userMessage: string): Promise<string> {
  const supabase = getAdminSupabase()
  const lower = userMessage.toLowerCase()
  const contextParts: string[] = []

  // Detect product search intent
  const productKeywords = ["producto", "busco", "tiene", "hay", "precio", "motosierra", "taladro", "amoladora", "soldadora", "compresor", "herramienta", "máquina", "desmalezadora", "cortadora", "sierra", "atornillador", "llave", "ferretería", "tornillo", "pintura", "generador"]
  const isProductQuery = productKeywords.some(k => lower.includes(k))

  if (isProductQuery) {
    // Search products by keyword
    const searchTerms = lower.replace(/[^a-záéíóúñü\s]/g, "").split(/\s+/).filter(w => w.length > 3)
    
    let query = supabase
      .from("products")
      .select("id, title, price, description, category, stock, is_active")
      .eq("is_active", true)
      .limit(8)

    if (searchTerms.length > 0) {
      const searchStr = searchTerms.join(" | ")
      query = query.or(`title.ilike.%${searchTerms[0]}%,description.ilike.%${searchTerms[0]}%,category.ilike.%${searchTerms[0]}%`)
    }

    const { data: products } = await query
    
    if (products && products.length > 0) {
      contextParts.push("PRODUCTOS ENCONTRADOS EN EL CATÁLOGO:")
      products.forEach(p => {
        contextParts.push(`- "${p.title}" | Precio: $${p.price?.toLocaleString()} | Categoría: ${p.category || "General"} | Stock: ${p.stock || "Consultar"} | Link: /product/${p.id}`)
      })
    } else {
      contextParts.push("No se encontraron productos que coincidan exactamente. Sugerí al usuario que use el buscador de la plataforma en /search")
    }
  }

  // Detect order/shipment intent
  const orderKeywords = ["pedido", "orden", "envío", "seguimiento", "tracking", "entrega", "demora", "llegó", "compré"]
  const isOrderQuery = orderKeywords.some(k => lower.includes(k))

  if (isOrderQuery) {
    // Get general shipping stats
    const { data: activeShipments, count } = await supabase
      .from("shipments")
      .select("*", { count: "exact" })
      .in("status", ["in_transit", "delayed", "pending"])

    contextParts.push(`\nINFO DE ENVÍOS ACTIVOS: ${count || 0} envíos en curso.`)
    contextParts.push("Para consultar un pedido específico, el usuario debe proporcionar su número de orden o email.")
  }

  // Detect category intent
  const categoryKeywords = ["categoría", "categorias", "secciones", "departamento", "qué venden", "que venden"]
  const isCategoryQuery = categoryKeywords.some(k => lower.includes(k))

  if (isCategoryQuery) {
    const { data: categories } = await supabase
      .from("categories")
      .select("name, slug, description")
      .limit(20)

    if (categories && categories.length > 0) {
      contextParts.push("CATEGORÍAS DISPONIBLES:")
      categories.forEach(c => {
        contextParts.push(`- ${c.name}: ${c.description || ""} (ver en /category/${c.slug})`)
      })
    }
  }

  // General marketplace stats
  const statsKeywords = ["cuántos", "cuantos", "estadísticas", "info del marketplace", "sobre maqjeez", "sobre madsjeez"]
  const isStatsQuery = statsKeywords.some(k => lower.includes(k))

  if (isStatsQuery) {
    const { count: totalProducts } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true)
    const { count: totalSellers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_seller", true)
    
    contextParts.push(`\nESTADÍSTICAS DEL MARKETPLACE:`)
    contextParts.push(`- Productos activos: ${totalProducts || 0}`)
    contextParts.push(`- Vendedores registrados: ${totalSellers || 0}`)
  }

  // Seller registration intent
  const sellerKeywords = ["vender", "vendedor", "registrar", "publicar", "comisión", "comision", "plan", "suscripción"]
  const isSellerQuery = sellerKeywords.some(k => lower.includes(k))

  if (isSellerQuery) {
    contextParts.push(`\nINFO PARA VENDEDORES:`)
    contextParts.push(`- Registro: /seller/register`)
    contextParts.push(`- Planes: Gratis (10 productos), Básico $8.000/mes (30 productos), Pro $15.000/mes (100 productos), Enterprise $25.000/mes (ilimitado)`)
    contextParts.push(`- Comisión: 10% sobre cada venta`)
    contextParts.push(`- Verificación KYC requerida para cobrar`)
    contextParts.push(`- Panel de vendedor: /dashboard`)
  }

  return contextParts.length > 0 ? "\n\n--- DATOS EN TIEMPO REAL DEL MARKETPLACE ---\n" + contextParts.join("\n") : ""
}

const BASE_PROMPT = `Sos el asistente virtual de MaqJeez, el marketplace de maquinaria, herramientas y ferretería más grande de Argentina.

Tu rol es ayudar a los usuarios con:
- Información sobre productos reales del catálogo (usá los datos que te proveo)
- Proceso de compra y pagos (MercadoPago)
- Envíos (Andreani, Correo Argentino, OCA, retiro en sucursal)
- Devoluciones y garantías (7 días para devolver, 6 meses de garantía)
- Registro como vendedor
- Estado de pedidos
- Problemas técnicos con la plataforma

Reglas:
- Respondé siempre en español argentino, de forma amigable y profesional.
- Sé conciso, no más de 3-4 oraciones por respuesta.
- Cuando tengas datos reales del catálogo, mostrá los productos con nombre y precio.
- Para ver un producto, indicá el link como: "Podés verlo acá: /product/ID"
- Si no encontrás productos, sugerí usar el buscador en /search
- Para soporte humano: soporte@maqjeez.com.ar o WhatsApp +54 11 2181-6064
- Horario de atención humana: Lunes a Viernes 9 a 18hs.
- Pagos: MercadoPago (tarjeta, transferencia, efectivo).
- Comisión de venta: 10%.
- Envío gratis en compras mayores a $15.000.
- Si preguntan algo fuera del marketplace, indicá amablemente que solo ayudás con temas de MaqJeez.
- NUNCA inventes productos o precios que no estén en los datos que te doy.`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })
    }

    // Get real-time context from the marketplace database
    const lastMessage = messages[messages.length - 1]
    let liveContext = ""
    try {
      liveContext = await getMarketplaceContext(lastMessage.content)
    } catch (e) {
      console.error("Error fetching context:", e)
    }

    const systemPrompt = BASE_PROMPT + liveContext

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Sistema: " + systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Entendido. Soy el asistente virtual de MaqJeez con acceso al catálogo en tiempo real. Estoy listo para ayudar." }],
        },
        ...messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
      ],
    })

    const result = await chat.sendMessage(lastMessage.content)
    const response = result.response.text()

    return NextResponse.json({ message: response })
  } catch (error: any) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: error?.message || "Error processing chat request" },
      { status: 500 }
    )
  }
}
