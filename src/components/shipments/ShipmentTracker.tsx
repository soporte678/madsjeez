"use client"

import { useShipment, statusLabels } from "@/hooks/useShipment"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Truck, 
  Package, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Loader2,
  Download
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ShipmentTrackerProps {
  orderId: string
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-5 h-5" />,
  ready_to_ship: <Package className="w-5 h-5" />,
  shipped: <Truck className="w-5 h-5" />,
  in_transit: <Truck className="w-5 h-5" />,
  out_for_delivery: <MapPin className="w-5 h-5" />,
  delivered: <CheckCircle2 className="w-5 h-5" />,
  exception: <AlertCircle className="w-5 h-5" />
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  ready_to_ship: "bg-blue-100 text-blue-800",
  shipped: "bg-yellow-100 text-yellow-800",
  in_transit: "bg-yellow-100 text-yellow-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  exception: "bg-red-100 text-red-800"
}

export function ShipmentTracker({ orderId }: ShipmentTrackerProps) {
  const { shipment, isLoading } = useShipment({ orderId })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">No hay información de envío disponible</p>
      </div>
    )
  }

  const currentStatus = shipment.status
  const events = shipment.events || []

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Seguimiento de Envío
          </h3>
          
          {shipment.carrierName && (
            <p className="text-sm text-gray-500 mt-1">
              Transportista: {shipment.carrierName}
            </p>
          )}
        </div>
        
        <Badge className={statusColors[currentStatus]}>
          <span className="flex items-center gap-1">
            {statusIcons[currentStatus]}
            {statusLabels[currentStatus]}
          </span>
        </Badge>
      </div>

      {/* Tracking Number */}
      {shipment.trackingNumber && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">Número de seguimiento:</p>
          <p className="font-mono font-bold text-lg">{shipment.trackingNumber}</p>
        </div>
      )}

      {/* Label Download */}
      {shipment.labelUrl && (
        <div className="mb-6">
          <Button variant="outline" size="sm" asChild>
            <a href={shipment.labelUrl} target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" />
              Descargar etiqueta
            </a>
          </Button>
        </div>
      )}

      {/* Estimated Delivery */}
      {shipment.estimatedDelivery && shipment.status !== "delivered" && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-600">Entrega estimada:</p>
          <p className="font-bold text-blue-800">
            {format(new Date(shipment.estimatedDelivery), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
      )}

      {/* Delivered Info */}
      {shipment.status === "delivered" && shipment.deliveredAt && (
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-600">Entregado el:</p>
          <p className="font-bold text-green-800">
            {format(new Date(shipment.deliveredAt), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
          </p>
          {shipment.receivedBy && (
            <p className="text-sm text-green-600 mt-1">
              Recibido por: {shipment.receivedBy}
            </p>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="relative flex gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                index === 0 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
              }`}>
                <div className="w-2 h-2 rounded-full bg-current" />
              </div>
              
              <div className="flex-1 pb-6">
                <p className="font-medium text-gray-900">{event.description}</p>
                
                {event.location && (
                  <p className="text-sm text-gray-500">{event.location}</p>
                )}
                
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(event.timestamp), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
