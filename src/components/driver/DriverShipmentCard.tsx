"use client"

import Link from "next/link"
import { MapPin, Phone, Navigation, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FlashStatusBadge } from "@/components/flash/FlashStatusBadge"
import type { FlashShipmentWithRelations } from "@/lib/flash/types"
import { formatMoney } from "@/components/driver/driver-ui"

export function DriverShipmentCard({
  shipment,
  priority,
  completed,
  index,
  estimatedPay,
}: {
  shipment: FlashShipmentWithRelations & { estimatedPay?: number }
  priority?: boolean
  completed?: boolean
  index?: number
  estimatedPay?: number
}) {
  const addr = `${shipment.street} ${shipment.streetNumber}, ${shipment.city}`
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`
  const pay = estimatedPay ?? shipment.estimatedPay

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-[#121820] ${
        priority ? "border-amber-500/50 ring-1 ring-amber-500/20" : "border-white/[0.08]"
      } ${completed ? "opacity-70" : ""}`}
    >
      {priority && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-center text-[10px] font-black uppercase text-black">
          Prioridad · En domicilio
        </div>
      )}
      <div className="p-4">
        <div className="mb-3 flex gap-3">
          {index != null && !completed && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#facc15]/15 text-sm font-black text-[#facc15]">
              {index}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-white">{shipment.recipientName}</h3>
              <FlashStatusBadge status={shipment.status} />
            </div>
            <p className="text-xs text-slate-500">#{shipment.order?.orderNumber ?? "—"}</p>
            {pay != null && (
              <p className="mt-1 text-sm font-bold text-emerald-400">
                Pago estimado: {formatMoney(pay)}
              </p>
            )}
          </div>
        </div>
        <div className="mb-3 space-y-1.5 rounded-xl bg-black/30 p-3 text-sm">
          <p className="flex gap-2 text-slate-200">
            <MapPin className="h-4 w-4 shrink-0 text-sky-400" />
            {shipment.street} {shipment.streetNumber}
            {shipment.apartment ? `, ${shipment.apartment}` : ""}, {shipment.city}
          </p>
          <a
            href={`https://wa.me/${shipment.recipientPhone.replace(/\D/g, "")}`}
            className="flex gap-2 font-medium text-emerald-400"
          >
            <Phone className="h-4 w-4" />
            {shipment.recipientPhone}
          </a>
          <p className="text-xs text-slate-500">PIN/QR en app de entrega</p>
        </div>
        {!completed && (
          <div className="grid grid-cols-2 gap-2">
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              <Button className="h-11 w-full rounded-xl bg-sky-600 font-bold hover:bg-sky-500">
                <Navigation className="mr-1 h-4 w-4" />
                Ruta
              </Button>
            </a>
            <Link href={`/flash/scan/${shipment.qrToken}`}>
              <Button className="h-11 w-full rounded-xl bg-[#facc15] font-bold text-black hover:bg-[#fde047]">
                <QrCode className="mr-1 h-4 w-4" />
                Entregar
              </Button>
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}
