import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// API para enviar mensajes de WhatsApp
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if ((session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Solo administradores pueden enviar mensajes manuales" }, { status: 403 })
    }

    const { phoneNumber, templateName, languageCode, parameters } = await request.json()

    const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN?.trim()
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()

    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      return NextResponse.json({ error: "Configuración de Meta incompleta" }, { status: 500 })
    }

    // Llamada a Meta Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phoneNumber,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: languageCode || "es_AR"
            },
            components: parameters ? [{
              type: "body",
              parameters: parameters.map((param: string) => ({
                type: "text",
                text: param
              }))
            }] : undefined
          }
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || "Error de Meta API" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      messageId: data.messages?.[0]?.id,
      recipient: phoneNumber
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
