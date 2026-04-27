"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Package, ChevronLeft, Clock, CheckCircle, Truck } from "lucide-react"

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    router.push("/auth/login")
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/account" className="text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Mis compras</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            {["Todas", "Activas", "Finalizadas", "Canceladas"].map((tab, i) => (
              <button
                key={tab}
                className={`flex-1 py-4 text-sm font-medium ${
                  i === 0
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Estado vacío */}
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No tienes compras aún
          </h2>
          <p className="text-gray-500 mb-6">
            Cuando hagas tu primera compra, aparecerá aquí
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Explorar productos
          </Link>
        </div>

        {/* Info de estados */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <h3 className="font-medium text-gray-900">En preparación</h3>
            <p className="text-sm text-gray-500">El vendedor está preparando tu pedido</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Truck className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <h3 className="font-medium text-gray-900">En camino</h3>
            <p className="text-sm text-gray-500">Tu pedido está siendo entregado</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <h3 className="font-medium text-gray-900">Entregado</h3>
            <p className="text-sm text-gray-500">Tu pedido fue entregado con éxito</p>
          </div>
        </div>
      </div>
    </div>
  )
}
