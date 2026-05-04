"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const paymentId = searchParams.get("payment_id")

  return (
    <div className="min-h-screen bg-[#EBEBEB] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago aprobado!</h1>
          <p className="text-gray-500 mb-6">
            Tu compra fue procesada correctamente. Te enviaremos una confirmación por email.
          </p>

          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-500">Número de orden</p>
              <p className="font-mono text-sm font-semibold text-gray-800 break-all">{orderId}</p>
              {paymentId && (
                <>
                  <p className="text-sm text-gray-500 mt-2">ID de pago (MP)</p>
                  <p className="font-mono text-sm font-semibold text-gray-800">{paymentId}</p>
                </>
              )}
            </div>
          )}

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

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#EBEBEB] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
