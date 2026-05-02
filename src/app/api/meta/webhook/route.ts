import { NextResponse } from "next/server"

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "MadsJeez-webhook-2024"

// GET: Verificación del webhook (Meta lo llama para confirmar)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificado por Meta")
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse("Forbidden", { status: 403 })
}

// POST: Recibir mensajes de WhatsApp/Messenger/Instagram
export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log("Webhook recibido:", JSON.stringify(body, null, 2))

    // Procesar diferentes tipos de mensajes
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    // WhatsApp message
    if (value?.messages?.length > 0) {
      const message = value.messages[0]
      const from = message.from
      const text = message.text?.body

      console.log(`Mensaje de WhatsApp: ${from} - ${text}`)

      // Aquí procesamos la respuesta (guardar en DB, notificar, etc.)
      // TODO: Guardar en tabla whatsapp_messages
    }

    // Messenger/Instagram message
    if (value?.messaging?.length > 0) {
      const messaging = value.messaging[0]
      const sender = messaging.sender?.id
      const message = messaging.message?.text

      console.log(`Mensaje Messenger/IG: ${sender} - ${message}`)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Error en webhook:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
