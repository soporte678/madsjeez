import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

const SYSTEM_PROMPT = `Sos el asistente virtual de MaqJeez, el marketplace de maquinaria, herramientas y ferretería más grande de Argentina.

Tu rol es ayudar a los usuarios con:
- Información sobre productos (motosierras, taladros, amoladoras, soldadoras, compresores, etc.)
- Proceso de compra y pagos (MercadoPago)
- Envíos (Andreani, Correo Argentino, OCA, retiro en sucursal)
- Devoluciones y garantías (7 días para devolver, 6 meses de garantía)
- Registro como vendedor
- Estado de pedidos
- Problemas técnicos con la plataforma

Reglas:
- Respondé siempre en español argentino, de forma amigable y profesional.
- Sé conciso, no más de 3-4 oraciones por respuesta.
- Si no sabés algo específico de un pedido, indicá que contacten a soporte@maqjeez.com.ar o al WhatsApp +54 11 2181-6064.
- Nunca inventes precios ni disponibilidad de productos específicos.
- Si preguntan por un producto, sugerí que usen el buscador de la plataforma.
- Horario de atención humana: Lunes a Viernes 9 a 18hs.
- Los pagos se procesan por MercadoPago (tarjeta, transferencia, efectivo en puntos de pago).
- Comisión de venta: 10% sobre el precio de venta.
- Envío gratis en compras mayores a $15.000.

Si te preguntan algo fuera del ámbito del marketplace, indicá amablemente que solo podés ayudar con temas relacionados a MaqJeez.`

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

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Sistema: " + SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "Entendido. Soy el asistente virtual de MaqJeez. Estoy listo para ayudar a los usuarios con consultas sobre el marketplace de maquinaria y herramientas." }],
        },
        ...messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
      ],
    })

    const lastMessage = messages[messages.length - 1]
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
