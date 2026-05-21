"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle, AlertCircle, Database, Settings } from "lucide-react"

interface MadsliderLevel {
  id: string
  level: string
  color: string
  minSales: number
  minDaysAsSeller: number
  minRevenue: number
  maxClaimRate: number
  maxCancellationRate: number
  maxDelayRate: number
  description: string
  boostDiscount: number
  order: number
}

export default function SetupReputationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [levels, setLevels] = useState<MadsliderLevel[]>([])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!session) {
    router.push("/admin/login")
    return null
  }

  const fetchLevels = async () => {
    try {
      const response = await fetch("/api/admin/seed-reputation")
      if (response.ok) {
        const data = await response.json()
        setLevels(data.levels || [])
      }
    } catch (error) {
      console.error("Error fetching levels:", error)
    }
  }

  const seedLevels = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/seed-reputation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: "success", text: `✅ ${data.message}` })
        setLevels(data.levels || [])
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: `❌ ${error.error}` })
      }
    } catch (error) {
      setMessage({ type: "error", text: "❌ Error de conexión" })
    } finally {
      setLoading(false)
    }
  }

  // Cargar niveles al montar
  useState(() => {
    fetchLevels()
  })

  const getColorBadge = (color: string) => {
    const colors: Record<string, string> = {
      'GRIS': 'bg-gray-500',
      'NARANJA': 'bg-orange-500',
      'AMARILLO': 'bg-yellow-500',
      'VERDE': 'bg-green-500',
      'AZUL': 'bg-blue-500',
      'VERDE_OSCURO': 'bg-green-700'
    }
    return colors[color] || 'bg-gray-500'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración de Reputación</h1>
            <p className="text-gray-600 mt-1">Administra los niveles Madslider del sistema</p>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'error' 
              ? 'border-red-200 bg-red-50 text-red-800' 
              : 'border-green-200 bg-green-50 text-green-800'
          }`}>
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de control */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Database className="w-5 h-5" />
                  Base de Datos
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configura los niveles de reputación Madslider
                </p>
              </div>
              <div className="p-6 space-y-4">
                <button 
                  onClick={seedLevels}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ejecutando...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      Poblar Niveles Madslider
                    </>
                  )}
                </button>

                <button 
                  onClick={fetchLevels}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors"
                >
                  Refrescar Lista
                </button>

                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Crea 6 niveles de reputación</p>
                  <p>• Configura límites y requisitos</p>
                  <p>• Establece beneficios</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de niveles */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Niveles Configurados ({levels.length})
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Niveles Madslider actualmente en la base de datos
                </p>
              </div>
              <div className="p-6">
                {levels.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay niveles configurados</p>
                    <p className="text-sm">Ejecuta el seed para crear los niveles Madslider</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {levels.map((level) => (
                      <div key={level.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded text-white text-xs font-medium ${getColorBadge(level.color)}`}>
                              {level.level}
                            </span>
                            <span className="text-sm text-gray-600">
                              Nivel {level.order}
                            </span>
                          </div>
                          <span className="px-2 py-1 rounded border border-gray-300 text-xs font-medium text-gray-700">
                            {level.boostDiscount > 0 ? `${level.boostDiscount * 100}% dto.` : 'Sin descuento'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700">{level.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Ventas mín:</span>
                            <p className="font-medium">{level.minSales}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Días mínimo:</span>
                            <p className="font-medium">{level.minDaysAsSeller}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Facturación mín:</span>
                            <p className="font-medium">${level.minRevenue.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Límite reclamos:</span>
                            <p className="font-medium">{(level.maxClaimRate * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
