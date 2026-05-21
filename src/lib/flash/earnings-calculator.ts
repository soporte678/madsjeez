import type { FlashShipment } from "@prisma/client"
import {
  getFlashRateSettings,
  type FlashRateSettings,
} from "@/lib/flash/rate-config"

export type EarningBreakdown = {
  base: number
  kmExtra: number
  bonuses: { label: string; amount: number }[]
  gross: number
  platformFee: number
  net: number
  tip: number
}

/** Estima pago por envío (distancia simulada si no hay GPS) */
export function estimateShipmentEarning(
  shipment: Pick<FlashShipment, "city" | "province" | "status">,
  rates: FlashRateSettings,
  opts?: { km?: number; rain?: boolean; night?: boolean; highDemand?: boolean }
): EarningBreakdown {
  const km = opts?.km ?? 4.5
  const base = rates.basePerPackage
  const kmExtra = Math.round(km * rates.extraPerKm)
  const bonuses: { label: string; amount: number }[] = []

  if (opts?.rain) {
    bonuses.push({
      label: "Lluvia",
      amount: Math.round((base + kmExtra) * (rates.rainBonusPercent / 100)),
    })
  }
  if (opts?.night) {
    bonuses.push({
      label: "Nocturno",
      amount: Math.round((base + kmExtra) * (rates.nightBonusPercent / 100)),
    })
  }
  if (opts?.highDemand) {
    bonuses.push({
      label: "Alta demanda",
      amount: Math.round((base + kmExtra) * (rates.highDemandBonusPercent / 100)),
    })
  }

  const bonusTotal = bonuses.reduce((s, b) => s + b.amount, 0)
  const gross = base + kmExtra + bonusTotal
  const platformFee = Math.round(gross * (rates.platformCommissionPercent / 100))
  const net = gross - platformFee

  return {
    base,
    kmExtra,
    bonuses,
    gross,
    platformFee,
    net,
    tip: rates.defaultTipEstimate,
  }
}

export async function estimateShipmentEarningAsync(
  shipment: Pick<FlashShipment, "city" | "province" | "status">
): Promise<EarningBreakdown> {
  const rates = await getFlashRateSettings()
  const hour = new Date().getHours()
  return estimateShipmentEarning(shipment, rates, {
    night: hour >= 21 || hour < 6,
    highDemand: false,
  })
}
