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
  const productKeywords = ["producto", "busco", "tiene", "hay", "precio", "necesito", "quiero", "venden", "motosierra", "taladro", "amoladora", "soldadora", "compresor", "herramienta", "máquina", "desmalezadora", "cortadora", "sierra", "atornillador", "llave", "ferretería", "tornillo", "pintura", "generador", "carburador", "bujía", "repuesto", "manguera", "filtro", "bomba", "motor", "disco", "cadena", "aceite", "cinta", "cable", "broca", "mecha"]
  const isProductQuery = productKeywords.some(k => lower.includes(k))

  if (isProductQuery) {
    try {
      const searchTerms = lower.replace(/[^a-záéíóúñü\s]/g, "").split(/\s+/).filter(w => w.length > 3)
      
      let query = supabase
        .from("products")
        .select("id, title, price, stock, free_shipping")
        .eq("is_active", true)
        .limit(8)

      if (searchTerms.length > 0) {
        // Use ilike on first search term only for simplicity and reliability
        query = query.ilike("title", `%${searchTerms[0]}%`)
      }

      const { data: products, error: queryError } = await query
      if (queryError) {
        console.error("Supabase product query error:", queryError)
        contextParts.push("No se pudo buscar productos en este momento. Sugerí al usuario que use el buscador en /search")
      } else if (products && products.length > 0) {
        contextParts.push("PRODUCTOS ENCONTRADOS EN EL CATÁLOGO:")
        products.forEach(p => {
          contextParts.push(`- "${p.title}" | Precio: $${p.price?.toLocaleString()} | Stock: ${p.stock || "Consultar"} | ${p.free_shipping ? "Envío gratis" : ""} | Link: /product/${p.id}`)
        })
      } else {
        contextParts.push("No se encontraron productos que coincidan exactamente. Sugerí al usuario que use el buscador de la plataforma en /search")
      }
    } catch (e) {
      console.error("Product search error:", e)
      contextParts.push("Búsqueda de productos no disponible en este momento.")
    }
  }

  // Detect order/shipment intent
  const orderKeywords = ["pedido", "orden", "envío", "seguimiento", "tracking", "entrega", "demora", "llegó", "compré"]
  const isOrderQuery = orderKeywords.some(k => lower.includes(k))

  if (isOrderQuery) {
    try {
      const { count } = await supabase
        .from("shipments")
        .select("*", { count: "exact", head: true })
        .in("status", ["in_transit", "delayed", "pending"])

      contextParts.push(`\nINFO DE ENVÍOS ACTIVOS: ${count || 0} envíos en curso.`)
      contextParts.push("Para consultar un pedido específico, el usuario debe proporcionar su número de orden o email.")
    } catch (e) {
      console.error("Shipment query error:", e)
    }
  }

  // Detect category intent
  const categoryKeywords = ["categoría", "categorias", "secciones", "departamento", "qué venden", "que venden"]
  const isCategoryQuery = categoryKeywords.some(k => lower.includes(k))

  if (isCategoryQuery) {
    try {
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
    } catch (e) {
      console.error("Category query error:", e)
    }
  }

  // General marketplace stats
  const statsKeywords = ["cuántos", "cuantos", "estadísticas", "info del marketplace", "sobre madsjeez"]
  const isStatsQuery = statsKeywords.some(k => lower.includes(k))

  if (isStatsQuery) {
    try {
      const { count: totalProducts } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true)
      const { count: totalSellers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_seller", true)
      
      contextParts.push(`\nESTADÍSTICAS DEL MARKETPLACE:`)
      contextParts.push(`- Productos activos: ${totalProducts || 0}`)
      contextParts.push(`- Vendedores registrados: ${totalSellers || 0}`)
    } catch (e) {
      console.error("Stats query error:", e)
    }
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

const BASE_PROMPT = `Sos el asistente virtual de MadsJeez, el marketplace de maquinaria, herramientas y ferretería más grande de Argentina.

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
- Para soporte humano: soporte@madsjeez.com.ar o WhatsApp +54 11 2181-6064
- Horario de atención humana: Lunes a Viernes 9 a 18hs.
- Pagos: MercadoPago (tarjeta, transferencia, efectivo).
- Comisión de venta: 10%.
- Envío gratis en compras mayores a $15.000.
- Si preguntan algo fuera del marketplace, indicá amablemente que solo ayudás con temas de MadsJeez.
- NUNCA inventes productos o precios que no estén en los datos que te doy.`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured - using fallback responses")
      // Return a helpful static response based on the user's query
      const lower = lastMessage.content.toLowerCase()
      let fallbackResponse = ""
      
      if (lower.includes("carburador") || lower.includes("bujía") || lower.includes("repuesto")) {
        fallbackResponse = "Para buscar carburadores, bujías y repuestos, te recomiendo usar el buscador en /search. Tenemos una gran variedad de repuestos para desmalezadoras y motosierras. ¿Podés ser más específico sobre el equipo que tenés?"
      } else if (lower.includes("necesito") || lower.includes("busco") || lower.includes("comprar")) {
        fallbackResponse = "¡Claro! Podés buscar productos en /search. Tenemos herramientas, maquinaria, ferretería y más. ¿Qué tipo de producto estás buscando?"
      } else if (lower.includes("envío") || lower.includes("envios") || lower.includes("entrega")) {
        fallbackResponse = "Hacemos envíos a todo el país con Andreani, Correo Argentino y OCA. También tenés opción de retiro en sucursal. El envío es gratis en compras mayores a $15.000."
      } else if (lower.includes("vender") || lower.includes("vendedor") || lower.includes("publicar")) {
        fallbackResponse = "Para vender en MadsJeez, necesitás registrarte como vendedor. Tenemos planes desde Gratis (10 productos) hasta Enterprise (ilimitado). La comisión es del 10% por venta. ¿Te interesa registrarte?"
      } else if (lower.includes("pago") || lower.includes("pagar") || lower.includes("mercadopago")) {
        fallbackResponse = "Aceptamos pagos con MercadoPago (tarjeta de crédito/débito, transferencia, efectivo en puntos de pago). También aceptamos transferencia bancaria directa."
      } else {
        fallbackResponse = "¡Hola! Soy el asistente de MadsJeez. ¿En qué puedo ayudarte? Podés buscar productos en /search, ver categorías, o contactarnos por WhatsApp +54 11 2181-6064."
      }
      
      return NextResponse.json({ message: fallbackResponse })
    }

    // Get real-time context from the marketplace database
    console.log("Chat request - last message:", lastMessage.content)
    
    let liveContext = ""
    try {
      liveContext = await getMarketplaceContext(lastMessage.content)
      console.log("Context fetched, length:", liveContext.length)
    } catch (e) {
      console.error("Error fetching context:", e)
    }

    const systemPrompt = BASE_PROMPT + liveContext
    console.log("System prompt length:", systemPrompt.length)

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
    })

    // Build history from actual conversation (exclude last message which we send now)
    // Skip the initial greeting (first assistant message = UI welcome only)
    const history = messages
      .slice(0, -1)
      .filter((msg: any, idx: number) => {
        // Skip if it's the very first message and it's from the assistant (initial greeting)
        if (idx === 0 && msg.role === "assistant") return false
        return msg.role === "user" || msg.role === "assistant"
      })
      .map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }))

    console.log("History length:", history.length)

    const chat = model.startChat({
      history: history.length > 0 ? history : undefined,
    })

    console.log("Sending message to Gemini...")
    const result = await chat.sendMessage(lastMessage.content)
    const response = result.response.text()
    console.log("Gemini response received, length:", response.length)

    return NextResponse.json({ message: response })
  } catch (error: any) {
    console.error("Chat API error:", error)
    console.error("Error details:", error?.message, error?.stack)
    // Return a helpful fallback so the bot doesn't appear broken
    // Return status 200 so frontend shows the message instead of error
    return NextResponse.json({
      message: "Disculpá, estoy teniendo dificultades técnicas en este momento. Podés probá de nuevo en unos segundos, o contactarnos por WhatsApp +54 11 2181-6064.",
    }, { status: 200 })
  }
}
