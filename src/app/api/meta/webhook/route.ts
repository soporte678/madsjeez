import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN

// GET: Verificación del webhook (Meta lo llama para confirmar)
export async function GET(request: Request) {
  if (!VERIFY_TOKEN) {
    return new NextResponse("Webhook verify token not configured", { status: 503 })
  }

  const { searchParams } = new URL(request.url)

  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    logger.info("Webhook verificado por Meta")
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse("Forbidden", { status: 403 })
}

// POST: Recibir mensajes de WhatsApp/Messenger/Instagram
export async function POST(request: Request) {
  try {
    const body = await request.json()

    logger.info("Webhook recibido:", JSON.stringify(body, null, 2))

    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (value?.messages?.length > 0) {
      const message = value.messages[0]
      const from = message.from
      const text = message.text?.body

      logger.info(`Mensaje de WhatsApp: ${from} - ${text}`)
    }

    if (value?.messaging?.length > 0) {
      const messaging = value.messaging[0]
      const sender = messaging.sender?.id
      const message = messaging.message?.text

      logger.info(`Mensaje Messenger/IG: ${sender} - ${message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Error en webhook:", error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
