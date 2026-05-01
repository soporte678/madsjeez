"use client"

import { useState } from "react"
import { MessageCircle, CheckCircle, AlertCircle, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function WhatsAppConfigPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [businessName, setBusinessName] = useState("MaqJeez")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleConnect = async () => {
    setLoading(true)
    setStatus("idle")

    try {
      const response = await fetch("/api/meta/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/\D/g, ""),
          businessName,
          sellerId: "admin" // Para el admin principal
        })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage(data.message || "Número registrado correctamente")
      } else {
        setStatus("error")
        setMessage(data.error || "Error al conectar")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-green-100 p-3 rounded-lg">
          <MessageCircle className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Configuración WhatsApp</h1>
          <p className="text-gray-600">Conecta tu número de WhatsApp Business</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">ℹ️ Instrucciones importantes</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Usa un número que nunca haya tenido WhatsApp instalado</li>
            <li>• Recibirás un código SMS para verificar el número</li>
            <li>• El número quedará dedicado exclusivamente al sistema</li>
            <li>• No podrás usar este número en WhatsApp personal</li>
          </ul>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Número de teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+54 9 11 1234 5678"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Incluye código de país (ej: +54 para Argentina)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nombre del negocio</label>
            <Input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="MaqJeez"
            />
          </div>

          <Button
            onClick={handleConnect}
            disabled={loading || !phoneNumber}
            className="w-full"
          >
            {loading ? "Conectando..." : "Conectar número de WhatsApp"}
          </Button>
        </div>

        {status === "success" && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span>{message}</span>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>{message}</span>
          </div>
        )}
      </div>

      <div className="mt-8 bg-gray-50 border rounded-lg p-6">
        <h3 className="font-medium mb-4">📋 Configuración de Meta (requerida)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Asegúrate de tener estas variables de entorno configuradas:
        </p>
        <code className="block bg-gray-900 text-green-400 p-4 rounded text-sm">
          META_APP_ID=1291657412404984
          <br />
          META_APP_SECRET=tu_app_secret
          <br />
          META_ACCESS_TOKEN=tu_token_largo
          <br />
          WHATSAPP_PHONE_NUMBER_ID=ID_del_numero_registrado
        </code>
      </div>
    </div>
  )
}
