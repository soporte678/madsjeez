import { NextResponse } from "next/server"
import crypto from "crypto"
import { logger } from "@/lib/logger"

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN

/** Verifica la firma HMAC-SHA256 de Meta (header x-hub-signature-256). */
function verifyMetaSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")
  const a = Buffer.from(header)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

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
    const appSecret = process.env.META_APP_SECRET?.trim()
    if (!appSecret) {
      logger.error("META_APP_SECRET no configurado — webhook rechazado")
      return NextResponse.json({ success: false }, { status: 503 })
    }

    // Leemos el raw body para validar la firma (no JSON.parse antes de verificar).
    const rawBody = await request.text()
    const signature = request.headers.get("x-hub-signature-256")
    if (!verifyMetaSignature(rawBody, signature, appSecret)) {
      logger.warn("Webhook de Meta con firma inválida — rechazado")
      return NextResponse.json({ success: false, error: "invalid signature" }, { status: 401 })
    }

    const body = JSON.parse(rawBody)

    // No logueamos el payload completo (contiene teléfonos/PII): solo metadatos.
    const value = body.entry?.[0]?.changes?.[0]?.value

    if (value?.messages?.length > 0) {
      logger.info(`Webhook WhatsApp: ${value.messages.length} mensaje(s) recibido(s)`)
    }
    if (value?.messaging?.length > 0) {
      logger.info(`Webhook Messenger/IG: ${value.messaging.length} evento(s) recibido(s)`)
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    logger.error("Error en webhook de Meta", { message })
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
