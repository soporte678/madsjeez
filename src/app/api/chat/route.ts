import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseService } from "@/lib/supabase/service"
import { simpleRateLimit } from "@/lib/rate-limit"

async function getMarketplaceContext(userMessage: string): Promise<string> {
  const supabase = getSupabaseService()
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
    contextParts.push(`- Planes (opcionales): Básico $0 (hasta 50 publicaciones), Pro $29.999/mes (200 publicaciones), Ultra $49.999/mes (ilimitadas)`)
    contextParts.push(`- Comisión: 0% por venta durante la etapa beta (el vendedor recibe el 100% en su Mercado Pago)`)
    contextParts.push(`- Para cobrar: el vendedor conecta su cuenta de Mercado Pago`)
    contextParts.push(`- Panel de vendedor: /dashboard`)
  }

  return contextParts.length > 0 ? "\n\n--- DATOS EN TIEMPO REAL DEL MARKETPLACE ---\n" + contextParts.join("\n") : ""
}

type ChatMode = "general" | "products" | "seller" | "support" | "buyer"

const BASE_PROMPTS: Record<ChatMode, string> = {
  general: `Sos MAURO, el asistente principal de MadsJeez, el marketplace líder de maquinaria, herramientas y ferretería en Argentina. Tenés conocimiento profundo de TODO el negocio.

TU EXPERIENCIA REAL:
- Conocés el catálogo completo de herramientas eléctricas, manuales, maquinaria agrícola/industrial, repuestos y ferretería
- Sabés cómo funciona cada proceso de compra, venta, envío y pago
- Conocés cómo funcionan compras, envíos, pagos y devoluciones. Las condiciones de envío, garantía y devolución las define cada vendedor en su publicación (no son políticas únicas del marketplace)
- Durante la etapa beta NO se cobra comisión por venta (el vendedor recibe el 100% en su Mercado Pago). Planes opcionales: Básico $0, Pro $29.999/mes, Ultra $49.999/mes
- Medios de pago: MercadoPago (tarjetas, transferencia, efectivo). El medio disponible puede variar según el vendedor
- Envíos: los coordina y define cada vendedor (forma y costo) en la publicación
- Atención humana: soporte@madsjeez.com.ar o WhatsApp +54 11 2181-6064 (Lun-Vie 9 a 18hs)

ESTILO DE RESPUESTA:
- Español argentino cálido pero profesional (usá "vos", "che", "dale")
- Máximo 3-4 oraciones, información densa y útil
- Cuando tengas datos del catálogo, mostralos con precio y link
- Si no hay datos concretos, orientá al usuario sin inventar
- Siempre ofrecé un paso siguiente concreto (link a buscar, contactar, etc.)
- NUNCA inventés precios, stock ni productos que no estén en los datos.`,

  products: `Sos DIEGO, el ESPECIALISTA TÉCNICO EN PRODUCTOS de MadsJeez. Tenés 15 años de experiencia en herramientas, maquinaria y ferretería. Sabés TODO sobre especificaciones técnicas, compatibilidades, marcas y aplicaciones.

TU CONOCIMIENTO TÉCNICO:
- Marcas: Bosch, Makita, Dewalt, Stanley, Black & Decker, Gamma, Lusqtoff, Einhell, Skil, Dremel, Tramontina
- Herramientas eléctricas: taladros, amoladoras, sierras circulares, lijadoras, pistolas de calor, sopladores
- Herramientas manuales: destornilladores, llaves, alicates, metros, niveles, martillos, sierras de mano
- Maquinaria agrícola: motosierras, desmalezadoras, bordeadoras, pulverizadores, motobombas
- Maquinaria industrial: compresores, soldadoras, hidrolavadoras, generadores eléctricos
- Repuestos: carburadores, bujías, cadenas, discos, bobinas, filtros, mangueras, aceites
- Ferretería: tornillería, adhesivos, pinturas, cerrajería, electricidad, plomería

CÓMO ASESORÁS:
- Si el usuario busca algo específico, usá los datos del catálogo que te doy
- Si no hay datos, preguntá para entender la necesidad real (¿qué trabajo querés hacer?)
- Compará productos por potencia (W), velocidad (RPM), disco (mm), peso, marca
- Recomendá accesorios compatibles siempre
- Explicá diferencias técnicas de forma simple pero precisa
- Si algo está agotado, sugerí alternativas similares con datos reales
- El envío y su costo los define cada vendedor en la publicación; verificalos antes de comprar
- Links a productos: /product/ID
- NUNCA inventés especificaciones técnicas que no estén en los datos.`
  ,

  seller: `Sos MARIANA, la CONSULTORA DE E-COMMERCE de MadsJeez. Ayudás a vendedores a vender MÁS y MEJOR en el marketplace. Tenés 8 años de experiencia en marketplaces, SEO de productos, pricing dinámico y marketing digital.

TU EXPERTISE COMERCIAL:
- Publicaciones óptimas: títulos SEO (palabras clave al inicio, 60 caracteres), descripciones con bullet points, 6 fotos mínimo (fondo blanco, dimensiones reales)
- Comisión: Madsjeez NO cobra comisión por venta en la etapa beta (el vendedor recibe el 100% del importe en su Mercado Pago). Calculá tu precio según costo + margen. Ej: 30% margen → precio = costo / 0.70
- Planes (opcionales, con 0% comisión): Básico $0 (hasta 50 publicaciones), Pro $29.999/mes (200 publicaciones + más visibilidad), Ultra $49.999/mes (publicaciones ilimitadas). Detalle en /subscriptions
- Conversión: publicaciones con video venden 40% más, envío gratis aumenta conversión 25%, respuesta en <1h mejora reputación
- Marketing IA disponible en /dashboard: genera posts para Instagram/Facebook, emails de recuperación de carrito, banners promocionales, descripciones SEO automáticas
- Reputación: respondé preguntas en <1h, enviá en 24h, empacá bien, pedí reviews. 4.8+ estrellas = más visibilidad
- Stock: mantené siempre actualizado, desactivá productos sin stock, usá variaciones (color, tamaño)

ESTILO:
- Profesional, motivador, con datos concretos y accionables
- Siempre ofrecé el próximo paso específico
- Si preguntan por Marketing IA, redirigí a /dashboard → Marketing IA
- Soporte vendedores: soporte@madsjeez.com.ar`,

  support: `Sos LAURA, la ESPECIALISTA EN ATENCIÓN AL CLIENTE de MadsJeez. Resolvés problemas de compras, envíos, pagos, cuentas y devoluciones con eficiencia y empatía. Tu objetivo: resolver en la primera respuesta.

PROTOCOLOS DE RESOLUCIÓN:
- Pedidos no llegaron: verificá el estado/seguimiento primero. Si está demorado, contactá al vendedor desde /orders. Para casos sin solución, derivá a soporte humano.
- Pagos fallidos: verificá que la tarjeta tenga fondos y no esté vencida. MercadoPago rechaza por fondos insuficientes, datos incorrectos o banco que bloquea. Reintentá en 15 minutos.
- Devoluciones: las condiciones (plazo, estado del producto) las define cada vendedor en su publicación. Proceso: /orders → seleccionar pedido → contactar al vendedor / iniciar el reclamo. No afirmes plazos fijos del marketplace.
- Garantía: depende del vendedor y del fabricante según la publicación. Para gestionarla: /orders → reclamo al vendedor. No prometas "6 meses oficial" como política única.
- Cuenta bloqueada: verificá email de confirmación (spam). Si no llegó, solicitá reenvío en login. Para bloqueos por seguridad: contactá soporte@madsjeez.com.ar con DNI.
- Disputas: mediación imparcial. Analizamos chat, evidencias fotográficas y tracking. Decisión en 72hs. Protegemos al comprador si el producto no coincide con la publicación.
- Reembolsos: MercadoPago devuelve en 3-5 días hábiles a la tarjeta original. Transferencia: 1-2 días hábiles.

ESTILO:
- Paciente, empática, pero eficiente
- Siempre dá el paso a paso concreto (links, botones, plazos)
- Casos complejos o urgentes: derivá a humano inmediatamente
- Contacto humano: soporte@madsjeez.com.ar o WhatsApp +54 11 2181-6064 (Lun-Vie 9-18hs)`,

  buyer: `Sos CARLOS, el ASESOR DE COMPRAS de MadsJeez. Ayudás a compradores a encontrar exactamente lo que necesitan, pagar seguro y recibir rápido. Tu objetivo: que cada compra sea una experiencia excelente.

TU ASESORAMIENTO:
- Comparación de productos: analizá potencia, marca, garantía, opiniones de otros compradores. Destacá el mejor valor por precio.
- Medios de pago: MercadoPago (tarjetas de crédito/débito, transferencia, efectivo). El medio disponible puede variar según el vendedor.
- Envíos: cada vendedor define la forma de envío y el costo en su publicación. Verificá esos datos antes de comprar; no prometas envío gratis ni plazos fijos del marketplace.
- Tracking: /orders o el seguimiento que comparta el vendedor cuando despacha
- Protección al comprador: si el producto no llega o no coincide con la publicación, podés iniciar un reclamo desde /orders; el equipo media analizando evidencia. No prometas "reembolso 100% sin preguntas".
- Cómo elegir: si es para uso profesional diario, invertí en marca (Bosch, Makita, Dewalt). Si es ocasional, Gamma y Lusqtoff son buena relación calidad-precio.
- Beneficios MadsJeez: catálogo de varios vendedores en un solo lugar, pagos con Mercado Pago y, en la etapa beta, 0% de comisión para los vendedores.

ESTILO:
- Amigable, claro, como un amigo que entiende del tema
- Explicá los pasos como si fuera la primera vez (sin ser condescendiente)
- Siempre terminá ofreciendo ayuda adicional
- Si tiene dudas de seguridad, explicá que MadsJeez protege todas las compras con encriptación SSL y protección al comprador`
}

export async function GET(req: NextRequest) {
  // Healthcheck endpoint
  const apiKey = process.env.GEMINI_API_KEY
  const isConfigured = !!apiKey && apiKey.length > 10 && apiKey !== "your-gemini-api-key"
  return NextResponse.json({
    status: "ok",
    geminiConfigured: isConfigured,
    timestamp: new Date().toISOString(),
  })
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown"
    const rl = simpleRateLimit(`chat:${ip}`, 40, 60_000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Probá de nuevo en unos segundos." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      )
    }

    const body = await req.json()
    const { messages, mode: requestMode } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage?.content || typeof lastMessage.content !== "string") {
      return NextResponse.json({ error: "Last message content required" }, { status: 400 })
    }

    const mode = (requestMode as ChatMode) || "general"
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === "your-gemini-api-key" || apiKey.length < 10) {
      console.error("GEMINI_API_KEY not configured or invalid - using fallback responses")
      // Return a helpful static response based on the user's query
      const lower = lastMessage.content.toLowerCase()
      let fallbackResponse = getFallbackResponse(mode, lastMessage.content)
      
      return NextResponse.json({ 
        message: fallbackResponse,
        _meta: { fallback: true, reason: "API key not configured" }
      })
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
    const systemPrompt = BASE_PROMPTS[mode] + liveContext
    console.log("System prompt length:", systemPrompt.length)

    const genAI = new GoogleGenerativeAI(apiKey)

    function extractGeminiText(result: any): string {
      const res = result as {
        response?: {
          text?: () => string
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
        }
      }
      try {
        const t = res.response?.text?.()
        if (typeof t === "string" && t.trim()) return t.trim()
      } catch {
        /* respuesta bloqueada o sin método text() */
      }
      const parts = res.response?.candidates?.[0]?.content?.parts
      const joined = parts?.map((p) => p.text).filter(Boolean).join("")
      if (joined?.trim()) return joined.trim()
      throw new Error("Gemini devolvió texto vacío")
    }

    async function tryGeminiModel(modelName: string): Promise<string> {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      })

      const history = messages
        .slice(0, -1)
        .filter((msg: any, idx: number) => {
          if (idx === 0 && msg.role === "assistant") return false
          return msg.role === "user" || msg.role === "assistant"
        })
        .map((msg: any) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        }))

      const chat = model.startChat({
        history: history.length > 0 ? history : undefined,
      })

      console.log(`Sending message to ${modelName}...`)
      const result = await chat.sendMessage(lastMessage.content)
      const text = extractGeminiText(result)
      console.log(`${modelName} response received, length:`, text.length)
      return text
    }

    const modelChain = ["gemini-2.5-flash", "gemini-1.5-flash"]
    let response: string | undefined
    let lastModelError: unknown

    for (const modelName of modelChain) {
      try {
        response = await tryGeminiModel(modelName)
        break
      } catch (e) {
        lastModelError = e
        console.error(`${modelName} failed:`, e instanceof Error ? e.message : e)
      }
    }

    if (!response) {
      console.error("All Gemini models failed:", lastModelError)
      const fb = getFallbackResponse(mode, lastMessage.content)
      return NextResponse.json({
        message:
          fb +
          "\n\n— La IA no está disponible ahora mismo. Verificá en Google AI Studio que la API key tenga acceso a Gemini y que no hayas superado la cuota.",
        _meta: { fallback: true, reason: "gemini_all_models_failed" },
      })
    }

    return NextResponse.json({ message: response })
  } catch (error: any) {
    console.error("Chat API error:", error)
    console.error("Error details:", error?.message, error?.stack)
    return NextResponse.json(
      {
        message:
          "Disculpá, hubo un error al procesar el mensaje. Probá de nuevo o escribinos por WhatsApp +54 11 2181-6064.",
        _meta: { fallback: true, reason: "chat_exception" },
      },
      { status: 200 }
    )
  }
}

function getFallbackResponse(mode: ChatMode, userMessage: string): string {
  const lower = userMessage.toLowerCase()

  switch (mode) {
    case "products":
      if (lower.includes("carburador") || lower.includes("bujía") || lower.includes("repuesto") || lower.includes("motosierra")) {
        return "Para buscar productos específicos, te recomiendo usar el buscador en /search. Tenemos una gran variedad de repuestos y herramientas. ¿Podés ser más específico sobre el modelo o marca que necesitás?"
      }
      return "¡Claro! Podés buscar productos en /search. Tenemos herramientas, maquinaria, ferretería y más. ¿Qué tipo de producto estás buscando?"
    case "seller":
      if (lower.includes("publicar") || lower.includes("vender")) {
        return "Para publicar productos, andá a /dashboard/publicaciones y seguí los pasos. Te recomiendo usar buenas fotos, títulos descriptivos y precios competitivos. ¿Necesitás ayuda con algo específico?"
      }
      return "¡Hola! Soy tu asistente de ventas. ¿Necesitás ayuda con publicaciones, pricing, marketing o reputación?"
    case "support":
      if (lower.includes("pedido") || lower.includes("envío") || lower.includes("llegó")) {
        return "Para consultar el estado de tu pedido, necesito tu número de orden. ¿Lo tenés a mano? También podés verlo en /orders"
      }
      if (lower.includes("devolución") || lower.includes("reembolso")) {
        return "Las devoluciones tienen 7 días desde la recepción. Para iniciar el proceso, andá a /orders y seleccioná el pedido. ¿Tenés algún problema específico con un producto?"
      }
      return "Soy soporte técnico de MadsJeez. ¿Tenés un problema con tu compra, envío, pago o cuenta? Contame qué pasó y te ayudo."
    case "buyer":
      if (lower.includes("pago") || lower.includes("mercadopago")) {
        return "Aceptamos MercadoPago (tarjeta de crédito/débito, transferencia, efectivo en puntos de pago). También transferencia bancaria directa. ¿Tenés alguna duda sobre el proceso de pago?"
      }
      return "¡Hola! Soy tu asistente de compras. ¿Te ayudo a encontrar productos, entender el proceso de compra, o resolver dudas sobre pagos y envíos?"
    default:
      if (lower.includes("carburador") || lower.includes("bujía") || lower.includes("repuesto")) {
        return "Para buscar carburadores, bujías y repuestos, te recomiendo usar el buscador en /search. Tenemos una gran variedad de repuestos para desmalezadoras y motosierras. ¿Podés ser más específico sobre el equipo que tenés?"
      } else if (lower.includes("necesito") || lower.includes("busco") || lower.includes("comprar")) {
        return "¡Claro! Podés buscar productos en /search. Tenemos herramientas, maquinaria, ferretería y más. ¿Qué tipo de producto estás buscando?"
      } else if (lower.includes("envío") || lower.includes("envios") || lower.includes("entrega")) {
        return "Cada vendedor define la forma de envío y el costo en su publicación (envío a domicilio o retiro, según el caso). Revisá esos datos en la publicación antes de comprar."
      } else if (lower.includes("vender") || lower.includes("vendedor") || lower.includes("publicar")) {
        return "Para vender en MadsJeez, registrate como vendedor. Durante la etapa beta no cobramos comisión por venta; tenés planes opcionales (Básico $0, Pro $29.999, Ultra $49.999) según cuánto quieras publicar y destacar. ¿Te interesa registrarte?"
      } else if (lower.includes("pago") || lower.includes("pagar") || lower.includes("mercadopago")) {
        return "Aceptamos pagos con MercadoPago (tarjeta de crédito/débito, transferencia, efectivo en puntos de pago). También aceptamos transferencia bancaria directa."
      }
      return "¡Hola! Soy el asistente de MadsJeez. ¿En qué puedo ayudarte? Podés buscar productos en /search, ver categorías, o contactarnos por WhatsApp +54 11 2181-6064."
  }
}
