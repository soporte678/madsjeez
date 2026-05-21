import { prisma } from "@/lib/prisma"
import { isPrismaSchemaDriftError } from "@/lib/flash/prisma-safe"

/** Tarifas configurables desde admin — referencia inicial AR ~3032.90 por pedido */
export type FlashRateSettings = {
  basePerOrder: number
  basePerPackage: number
  extraPerKm: number
  extraWaitPerMinute: number
  rainBonusPercent: number
  nightBonusPercent: number
  highDemandBonusPercent: number
  difficultZoneBonusPercent: number
  minGuaranteedPerBlock: number
  platformCommissionPercent: number
  defaultTipEstimate: number
}

export const DEFAULT_FLASH_RATE_SETTINGS: FlashRateSettings = {
  basePerOrder: 3032.9,
  basePerPackage: 2850,
  extraPerKm: 180,
  extraWaitPerMinute: 45,
  rainBonusPercent: 15,
  nightBonusPercent: 12,
  highDemandBonusPercent: 20,
  difficultZoneBonusPercent: 10,
  minGuaranteedPerBlock: 12000,
  platformCommissionPercent: 8,
  defaultTipEstimate: 0,
}

export async function getFlashRateSettings(): Promise<FlashRateSettings> {
  try {
    const row = await prisma.flashRateConfig.findUnique({ where: { id: "default" } })
    if (!row?.settings || typeof row.settings !== "object") {
      return DEFAULT_FLASH_RATE_SETTINGS
    }
    return { ...DEFAULT_FLASH_RATE_SETTINGS, ...(row.settings as FlashRateSettings) }
  } catch (e) {
    if (isPrismaSchemaDriftError(e)) return DEFAULT_FLASH_RATE_SETTINGS
    throw e
  }
}

export async function ensureFlashRateConfig(): Promise<void> {
  try {
    const existing = await prisma.flashRateConfig.findUnique({ where: { id: "default" } })
    if (!existing) {
      await prisma.flashRateConfig.create({
        data: {
          id: "default",
          label: "Tarifas Flash Argentina",
          currency: "ARS",
          settings: DEFAULT_FLASH_RATE_SETTINGS,
        },
      })
    }
  } catch (e) {
    if (isPrismaSchemaDriftError(e)) return
    throw e
  }
}

export { formatArs } from "@/lib/flash/format"
