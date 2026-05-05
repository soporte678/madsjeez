// Cliente de WhatsApp Business API para Meta
const META_API_VERSION = "v18.0"
const META_BASE_URL = "https://graph.facebook.com"

interface WhatsAppConfig {
  appId: string
  appSecret: string
  accessToken: string
  phoneNumberId: string
  wabaId: string
}

interface SendMessageParams {
  to: string
  templateName: string
  languageCode?: string
  parameters?: string[]
}

export class WhatsAppClient {
  private config: WhatsAppConfig

  constructor(config: WhatsAppConfig) {
    this.config = config
  }

  // Enviar mensaje de template
  async sendTemplateMessage(params: SendMessageParams) {
    const { to, templateName, languageCode = "en_US", parameters = [] } = params

    // Limpiar número (quitar + y espacios)
    const cleanNumber = to.replace(/\+/g, "").replace(/\s/g, "")

    const url = `${META_BASE_URL}/${META_API_VERSION}/${this.config.phoneNumberId}/messages`

    const body: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanNumber,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode
        }
      }
    }

    // Agregar parámetros si existen
    if (parameters.length > 0) {
      body.template.components = [{
        type: "body",
        parameters: parameters.map(param => ({
          type: "text",
          text: param
        }))
      }]
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Error enviando mensaje WhatsApp:", data)
      throw new Error(data.error?.message || "Error de WhatsApp API")
    }

    return {
      messageId: data.messages?.[0]?.id,
      recipient: cleanNumber,
      status: "sent"
    }
  }

  // Obtener templates disponibles
  async getTemplates() {
    const url = `${META_BASE_URL}/${META_API_VERSION}/${this.config.wabaId}/message_templates`

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${this.config.accessToken}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || "Error obteniendo templates")
    }

    return data.data || []
  }

  // Verificar si un número tiene WhatsApp
  async checkNumber(phoneNumber: string) {
    const cleanNumber = phoneNumber.replace(/\+/g, "").replace(/\s/g, "")
    
    const url = `${META_BASE_URL}/${META_API_VERSION}/${this.config.phoneNumberId}/contacts`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        blocking: "no_wait",
        contacts: [cleanNumber]
      })
    })

    const data = await response.json()
    return data.contacts?.[0]?.status === "valid"
  }
}

// Factory para crear cliente con variables de entorno
export function createWhatsAppClient(): WhatsAppClient {
  const appId = process.env.META_APP_ID?.trim()
  const appSecret = process.env.META_APP_SECRET?.trim()
  const accessToken = process.env.META_ACCESS_TOKEN?.trim()

  if (!appId) {
    throw new Error("META_APP_ID no está configurado")
  }
  if (!appSecret) {
    throw new Error("META_APP_SECRET no está configurado")
  }
  if (!accessToken) {
    throw new Error("META_ACCESS_TOKEN no está configurado")
  }

  const config: WhatsAppConfig = {
    appId,
    appSecret,
    accessToken,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    wabaId: process.env.WHATSAPP_WABA_ID || ""
  }

  return new WhatsAppClient(config)
}
