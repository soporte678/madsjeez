"use client"

import { useState } from "react"
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react"

export default function EliminacionDatosPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Eliminación de Datos - AppJeezPro</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800">Importante</h3>
            <p className="text-sm text-yellow-700">
              Al eliminar tu cuenta, todos tus datos serán permanentemente borrados de nuestros sistemas 
              dentro de los 30 días. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de tu cuenta en AppJeezPro
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo de la eliminación (opcional)
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Selecciona un motivo...</option>
              <option value="no_use">Ya no uso la aplicación</option>
              <option value="privacy">Preocupaciones de privacidad</option>
              <option value="other">Otro motivo</option>
            </select>
          </div>

          <label className="flex items-start gap-3">
            <input type="checkbox" required className="mt-1 w-4 h-4" />
            <span className="text-sm text-gray-600">
              Confirmo que deseo eliminar permanentemente mi cuenta y todos los datos asociados. 
              Entiendo que esta acción es irreversible.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
            {loading ? "Procesando..." : "Solicitar eliminación de datos"}
          </button>
        </form>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Solicitud recibida
          </h3>
          <p className="text-green-700">
            Hemos recibido tu solicitud para eliminar los datos de <strong>{email}</strong>.
          </p>
          <p className="text-sm text-green-600 mt-4">
            Recibirás un email de confirmación en los próximos 7 días. 
            Tu cuenta será eliminada definitivamente dentro de los 30 días.
          </p>
        </div>
      )}

      <div className="mt-8 pt-6 border-t">
        <h3 className="font-semibold mb-3">¿Qué datos eliminamos?</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>✓ Información de perfil (nombre, email, foto)</li>
          <li>✓ Historial de uso y actividad</li>
          <li>✓ Datos de dispositivos vinculados</li>
          <li>✓ Configuraciones y preferencias</li>
          <li>✓ Contenido generado por el usuario</li>
        </ul>
      </div>

      <div className="mt-6 pt-6 border-t">
        <h3 className="font-semibold mb-3">¿Qué NO eliminamos?</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Datos anonimizados para estadísticas</li>
          <li>• Información requerida por ley (facturas, transacciones)</li>
          <li>• Datos que afecten a otros usuarios (mensajes enviados)</li>
        </ul>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>Para consultas: <a href="mailto:soporte@appjeezpro.com.ar" className="text-blue-600">soporte@appjeezpro.com.ar</a></p>
      </div>
    </div>
  )
}
