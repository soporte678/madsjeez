"use client"

import { Header } from "@/components/Header"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Order {
  id: string
  status: string
  total: number
  created_at: string
  items: { title: string; quantity: number }[]
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch("/api/orders")
        if (response.ok) {
          const data = await response.json()
          setOrders(data)
        }
      } catch (error) {
        console.error("Error fetching history:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "cancelled": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "Completado"
      case "pending": return "Pendiente"
      case "cancelled": return "Cancelado"
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Historial de compras</h1>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString("es-AR")}
                        </p>
                        <h3 className="font-semibold mt-1">
                          {order.items.map(i => i.title).join(", ").slice(0, 50)}...
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.items.length} producto(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                        <p className="text-lg font-bold mt-2">
                          ${order.total.toLocaleString("es-AR")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No tienes compras en tu historial</p>
            <Link href="/products" className="text-[#3483FA] hover:underline mt-2 inline-block">
              Ver productos
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
