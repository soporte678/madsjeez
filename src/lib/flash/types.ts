import type { FlashShipmentStatus, FlashReceiverType, FlashAttemptStatus } from "@prisma/client"

export type { FlashShipmentStatus, FlashReceiverType, FlashAttemptStatus }

export interface FlashAddressData {
  recipientName: string
  recipientDni: string
  recipientPhone: string
  street: string
  streetNumber: string
  floor?: string
  apartment?: string
  betweenStreet1: string
  betweenStreet2: string
  city: string
  province: string
  postalCode: string
}

export interface FlashShipmentWithRelations {
  id: string
  orderId: string
  recipientName: string
  recipientDni: string
  recipientPhone: string
  street: string
  streetNumber: string
  floor: string | null
  apartment: string | null
  betweenStreet1: string
  betweenStreet2: string
  city: string
  province: string
  postalCode: string
  status: FlashShipmentStatus
  qrToken: string
  labelUrl: string | null
  labelPrintCount: number
  estimatedDelivery: Date | null
  driverId: string | null
  driver?: {
    id: string
    phone: string
    vehicleType: string
    user: { name: string | null; email: string }
  } | null
  attempts: FlashAttemptWithPhotos[]
  authorizedPeople: { id: string; name: string; dni: string }[]
  deliveryProof?: FlashDeliveryProofData | null
  order?: {
    orderNumber: string
    buyer: { name: string | null; email: string }
  }
  auditLogs?: {
    id: string
    action: string
    actorRole: string
    previousStatus?: FlashShipmentStatus | null
    newStatus?: FlashShipmentStatus | null
    createdAt: Date | string
    metadata?: Record<string, unknown> | null
  }[]
  createdAt: Date
  updatedAt: Date
}

export interface FlashAttemptWithPhotos {
  id: string
  shipmentId: string
  driverId: string
  attemptNumber: number
  arrivedAt: Date | null
  completedAt: Date | null
  latitude: number | null
  longitude: number | null
  status: FlashAttemptStatus
  notes: string | null
  photos: { id: string; url: string }[]
  createdAt: Date
}

export interface FlashDeliveryProofData {
  id: string
  receiverType: FlashReceiverType
  receiverName: string
  receiverDni: string
  photos: string[]
  signedAt: Date
}

export const ARGENTINA_PROVINCES = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const

export type ArgentinaProvince = (typeof ARGENTINA_PROVINCES)[number]

export const FLASH_STATUS_LABELS: Record<FlashShipmentStatus, string> = {
  CREATED: "Compra creada",
  PAYMENT_CONFIRMED: "Pago confirmado",
  LABEL_GENERATED: "Etiqueta generada",
  PACKAGE_READY: "Paquete preparado",
  AVAILABLE: "Disponible para retirar",
  ACCEPTED_BY_DRIVER: "Aceptado por repartidor",
  DRIVER_EN_ROUTE_TO_PICKUP: "Repartidor en camino",
  PACKAGE_PICKED_UP: "Paquete retirado",
  ASSIGNED_TO_DRIVER: "Asignado al chofer",
  IN_TRANSIT: "En camino",
  ARRIVED_AT_ADDRESS: "Llegó al domicilio",
  DELIVERED: "Entregado",
  FAILED_ATTEMPT_1: "1er intento fallido",
  PENDING_VISIT_2: "2da visita pendiente",
  FAILED_ATTEMPT_2: "2do intento fallido",
  PENDING_VISIT_3: "3ra visita pendiente",
  FAILED_ATTEMPT_3: "3er intento fallido",
  RETURNED_TO_SENDER: "Devuelto al remitente",
  RETURNED_TO_SELLER: "Devuelto al vendedor",
  CANCELLED: "Cancelado",
}

export const FLASH_STATUS_COLORS: Record<FlashShipmentStatus, string> = {
  CREATED: "bg-gray-100 text-gray-700",
  PAYMENT_CONFIRMED: "bg-blue-100 text-blue-700",
  LABEL_GENERATED: "bg-purple-100 text-purple-700",
  PACKAGE_READY: "bg-indigo-100 text-indigo-700",
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  ACCEPTED_BY_DRIVER: "bg-sky-100 text-sky-700",
  DRIVER_EN_ROUTE_TO_PICKUP: "bg-sky-200 text-sky-800",
  PACKAGE_PICKED_UP: "bg-cyan-100 text-cyan-700",
  ASSIGNED_TO_DRIVER: "bg-cyan-100 text-cyan-700",
  IN_TRANSIT: "bg-yellow-100 text-yellow-700",
  ARRIVED_AT_ADDRESS: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  FAILED_ATTEMPT_1: "bg-red-100 text-red-700",
  PENDING_VISIT_2: "bg-amber-100 text-amber-700",
  FAILED_ATTEMPT_2: "bg-red-200 text-red-800",
  PENDING_VISIT_3: "bg-amber-200 text-amber-800",
  FAILED_ATTEMPT_3: "bg-red-300 text-red-900",
  RETURNED_TO_SENDER: "bg-gray-300 text-gray-800",
  RETURNED_TO_SELLER: "bg-orange-200 text-orange-900",
  CANCELLED: "bg-gray-200 text-gray-600",
}

export function buildGoogleMapsUrl(data: FlashAddressData): string {
  const address = encodeURIComponent(
    `${data.street} ${data.streetNumber}${data.apartment ? ` ${data.apartment}` : ""}, ${data.city}, ${data.province}, Argentina`
  )
  return `https://www.google.com/maps/dir/?api=1&destination=${address}`
}

export function validateFlashAddress(data: Partial<FlashAddressData>): string[] {
  const errors: string[] = []
  if (!data.recipientName?.trim()) errors.push("Nombre completo es obligatorio")
  if (!data.recipientDni?.trim()) errors.push("DNI es obligatorio")
  else if (!/^\d{7,8}$/.test(data.recipientDni.replace(/\D/g, "")))
    errors.push("DNI debe tener 7 u 8 dígitos")
  if (!data.recipientPhone?.trim()) errors.push("Teléfono WhatsApp es obligatorio")
  if (!data.street?.trim()) errors.push("Calle es obligatoria")
  if (!data.streetNumber?.trim()) errors.push("Número de calle es obligatorio")
  if (!data.betweenStreet1?.trim()) errors.push("Entre calles es obligatorio")
  if (!data.betweenStreet2?.trim()) errors.push("Entre calles es obligatorio")
  if (!data.city?.trim()) errors.push("Localidad es obligatoria")
  if (!data.province?.trim()) errors.push("Provincia es obligatoria")
  if (!data.postalCode?.trim()) errors.push("Código postal es obligatorio")
  else if (!/^\d{4}$/.test(data.postalCode)) errors.push("Código postal debe tener 4 dígitos")
  return errors
}
