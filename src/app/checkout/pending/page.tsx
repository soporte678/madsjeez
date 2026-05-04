"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Clock, Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function PendingContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")

  return (
    <div className="min-h-screen bg-[#EBEBEB] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pago pendiente</h1>
          <p className="text-gray-500 mb-6">
            Tu pago está siendo procesado. Te notificaremos por email cuando se confirme.
          </p>

          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-500">Número de orden</p>
              <p className="font-mono text-sm font-semibold text-gray-800 break-all">{orderId}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800">
              Si pagaste en efectivo (Rapipago, Pago Fácil), el acreditado puede demorar hasta <strong>2 días hábiles</strong>.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/orders">
              <Button className="w-full bg-[#3483FA] hover:bg-[#2968c8]">
                <Package className="w-4 h-4 mr-2" />
                Ver mis pedidos
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="outline" className="w-full">
                Seguir comprando
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#EBEBEB] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full" />
      </div>
    }>
      <PendingContent />
    </Suspense>
  )
}
