import type { FlashDriverDutyStatus, FlashDriverTier } from "@prisma/client"

export type FlashSupportCategory = { id: string; label: string; urgent?: boolean }

export const FLASH_SUPPORT_CATEGORIES: FlashSupportCategory[] = [
  { id: "no_contact", label: "No puedo contactar al cliente" },
  { id: "client_no_receive", label: "El cliente no recibe el pedido" },
  { id: "wrong_address", label: "Dirección incorrecta" },
  { id: "payment_issue", label: "Problema con el pago" },
  { id: "package_issue", label: "Problema con el paquete" },
  { id: "stolen", label: "Pedido robado o extraviado" },
  { id: "emergency", label: "Accidente o emergencia", urgent: true },
  { id: "vehicle", label: "Vehículo averiado" },
  { id: "app_issue", label: "Problema con la app" },
  { id: "call_support", label: "Solicitar llamada de soporte" },
  { id: "chat_support", label: "Chatear con soporte" },
  { id: "evidence", label: "Enviar foto o evidencia" },
] as const

export const DUTY_STATUS_LABELS: Record<FlashDriverDutyStatus, string> = {
  OFFLINE: "Desconectado",
  ONLINE: "Disponible",
  ON_TRIP: "En viaje",
  ON_BREAK: "En pausa",
}

export const DUTY_STATUS_COLORS: Record<FlashDriverDutyStatus, string> = {
  OFFLINE: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  ONLINE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  ON_TRIP: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  ON_BREAK: "bg-amber-500/20 text-amber-400 border-amber-500/30",
}

export const TIER_LABELS: Record<FlashDriverTier, string> = {
  BRONZE: "Bronce",
  SILVER: "Plata",
  GOLD: "Oro",
  DIAMOND: "Diamante",
}
