"use client"

import { useState } from "react"
import { Send, MessageSquare, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function WhatsAppTestPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [templateName, setTemplateName] = useState("hello_world")
  const [parameters, setParameters] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleSendTest = async () => {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/test/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          templateName,
          parameters: parameters ? parameters.split(",") : []
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error enviando mensaje")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetTemplates = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/test/whatsapp")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error obteniendo templates")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-green-100 p-3 rounded-lg">
          <MessageSquare className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Test WhatsApp API</h1>
          <p className="text-gray-600">Modo desarrollo - Token temporal</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800">Modo Desarrollo</h3>
            <p className="text-sm text-yellow-700">
              Estás usando un token temporal. Para producción, necesitarás:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 list-disc ml-4">
              <li>Verificar el negocio en Meta</li>
              <li>Agregar número de teléfono verificado</li>
              <li>Templates aprobados por Meta</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-lg">Enviar mensaje de prueba</h2>

        <div>
          <label className="block text-sm font-medium mb-2">
            Número de teléfono (con código de país)
          </label>
          <Input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+54 9 11 1234 5678"
          />
          <p className="text-xs text-gray-500 mt-1">Formato: +54 9 XX XXXX XXXX</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Nombre del template
          </label>
          <Input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="hello_world"
          />
          <p className="text-xs text-gray-500 mt-1">
            Template por defecto de Meta: hello_world
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Parámetros (opcional, separados por coma)
          </label>
          <Input
            type="text"
            value={parameters}
            onChange={(e) => setParameters(e.target.value)}
            placeholder="Juan,Pedido #123"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSendTest}
            disabled={loading || !phoneNumber}
            className="flex-1"
          >
            {loading ? "Enviando..." : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar mensaje
              </>
            )}
          </Button>

          <Button
            onClick={handleGetTemplates}
            disabled={loading}
            variant="outline"
          >
            Ver templates
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">Resultado:</span>
          </div>
          <pre className="text-sm text-green-700 bg-green-100 p-3 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 bg-gray-50 border rounded-lg p-6">
        <h3 className="font-medium mb-4">📋 Configuración requerida</h3>
        <p className="text-sm text-gray-600 mb-4">
          Agrega estas variables en tu archivo <code>.env.local</code>:
        </p>
        <code className="block bg-gray-900 text-green-400 p-4 rounded text-sm">
          META_APP_ID=1719795722352723
          <br />
          META_APP_SECRET=138966aaf7a4aab419b3b21d3fe91748
          <br />
          META_ACCESS_TOKEN=tu_token_temporal_aqui
          <br />
          WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
          <br />
          WHATSAPP_WABA_ID=tu_waba_id
        </code>
        <p className="text-sm text-gray-600 mt-4">
          Obtén tu token temporal en: {" "}
          <a 
            href="https://developers.facebook.com/tools/explorer/"
            target="_blank"
            className="text-blue-600 hover:underline"
          >
            Graph API Explorer
          </a>
        </p>
      </div>
    </div>
  )
}
