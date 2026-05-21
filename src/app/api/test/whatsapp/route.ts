import { NextResponse } from "next/server"
import { createWhatsAppClient } from "@/lib/meta/whatsapp"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function assertAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 })
  }
  return null
}

// Endpoint de prueba para enviar mensaje de WhatsApp
export async function POST(request: Request) {
  try {
    const authError = await assertAdmin()
    if (authError) return authError

    const { phoneNumber, templateName, parameters } = await request.json()

    // Validar campos requeridos
    if (!phoneNumber || !templateName) {
      return NextResponse.json({
        error: "Se requiere phoneNumber y templateName"
      }, { status: 400 })
    }

    // Crear cliente de WhatsApp
    const client = createWhatsAppClient()

    // Enviar mensaje
    const result = await client.sendTemplateMessage({
      to: phoneNumber,
      templateName,
      parameters: parameters || []
    })

    return NextResponse.json({
      success: true,
      message: "Mensaje enviado correctamente",
      data: result
    })

  } catch (error: unknown) {
    console.error("Error enviando mensaje WhatsApp:", error)
    const message = error instanceof Error ? error.message : "Error al enviar mensaje"
    return NextResponse.json({
      error: message
    }, { status: 500 })
  }
}

// GET: Obtener templates disponibles
export async function GET() {
  try {
    const authError = await assertAdmin()
    if (authError) return authError

    const client = createWhatsAppClient()
    const templates = await client.getTemplates()

    return NextResponse.json({
      success: true,
      templates: templates.map((t: { name: string; language: string; status: string; category: string }) => ({
        name: t.name,
        language: t.language,
        status: t.status,
        category: t.category
      }))
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error obteniendo templates"
    return NextResponse.json({
      error: message
    }, { status: 500 })
  }
}
