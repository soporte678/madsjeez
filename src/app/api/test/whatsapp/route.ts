import { NextResponse } from "next/server"
import { createWhatsAppClient } from "@/lib/meta/whatsapp"

// Endpoint de prueba para enviar mensaje de WhatsApp
export async function POST(request: Request) {
  try {
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

  } catch (error: any) {
    console.error("Error enviando mensaje WhatsApp:", error)
    return NextResponse.json({
      error: error.message || "Error al enviar mensaje"
    }, { status: 500 })
  }
}

// GET: Obtener templates disponibles
export async function GET() {
  try {
    const client = createWhatsAppClient()
    const templates = await client.getTemplates()

    return NextResponse.json({
      success: true,
      templates: templates.map((t: any) => ({
        name: t.name,
        language: t.language,
        status: t.status,
        category: t.category
      }))
    })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message || "Error obteniendo templates"
    }, { status: 500 })
  }
}
