"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PurchaseTracker } from "@/components/analytics/PurchaseTracker"

type OrderPayload = {
  id: string;
  orderNumber: string;
  total: number;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string | null;
      title: string;
      seller: { name: string | null } | null;
    };
  }>;
};

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const paymentId = searchParams.get("payment_id")
  const [order, setOrder] = useState<OrderPayload | null>(null)

  useEffect(() => {
    if (!orderId) return
    let cancelled = false

    void (async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          credentials: "include",
        })
        const data = (await res.json().catch(() => ({}))) as { order?: OrderPayload }
        if (!res.ok || !data.order || cancelled) return
        setOrder(data.order)
      } catch {
        // keep success UX even if analytics detail fetch fails
      }
    })()

    return () => {
      cancelled = true
    }
  }, [orderId])

  return (
    <div className="min-h-screen bg-[#EBEBEB] flex items-center justify-center p-4">
      {orderId && order ? (
        <PurchaseTracker
          orderId={orderId}
          orderNumber={order.orderNumber}
          total={order.total}
          items={order.items}
        />
      ) : null}
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago aprobado!</h1>
          <p className="text-gray-500 mb-6">
            Te enviamos un email con el comprobante y un link único para ver tu orden cuando quieras.
            Guardá el número de orden por las dudas.
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
            <Link href="/dashboard#compras">
              <Button className="w-full bg-[#3483FA] hover:bg-[#2968c8]">
                <Package className="w-4 h-4 mr-2" />
                Ver mi compra en el dashboard
              </Button>
            </Link>
            <Link href="/orders/lookup">
              <Button variant="outline" className="w-full">
                Buscar mi orden (sin cuenta)
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
