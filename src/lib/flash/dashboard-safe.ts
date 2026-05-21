import { prisma } from "@/lib/prisma"
import { isPrismaSchemaDriftError } from "@/lib/flash/prisma-safe"
import {
  DEFAULT_FLASH_RATE_SETTINGS,
  type FlashRateSettings,
  getFlashRateSettings,
  ensureFlashRateConfig,
} from "@/lib/flash/rate-config"
import type { FlashDriverDutyStatus, FlashDriverTier } from "@prisma/client"

export async function safeEnsureFlashRateConfig(): Promise<void> {
  try {
    await ensureFlashRateConfig()
  } catch (e) {
    if (!isPrismaSchemaDriftError(e)) throw e
  }
}

export async function safeGetFlashRateSettings(): Promise<FlashRateSettings> {
  try {
    return await getFlashRateSettings()
  } catch (e) {
    if (isPrismaSchemaDriftError(e)) return DEFAULT_FLASH_RATE_SETTINGS
    throw e
  }
}

const DRIVER_FALLBACK_SELECT = {
  id: true,
  phone: true,
  vehicleType: true,
  isActive: true,
  user: { select: { name: true, email: true, image: true } },
} as const

export type SafeDriverRow = {
  id: string
  phone: string
  vehicleType: string
  dutyStatus: FlashDriverDutyStatus
  workMode: string
  rating: number
  tier: FlashDriverTier
  acceptanceRate: number
  payoutCbu: string | null
  connectedAt: Date | null
  totalKm: number
  user: { name: string | null; email: string; image: string | null }
}

export async function safeGetFlashDriver(driverId: string): Promise<SafeDriverRow | null> {
  try {
    const d = await prisma.flashDriver.findUnique({
      where: { id: driverId },
      include: { user: { select: { name: true, email: true, image: true } } },
    })
    if (!d) return null
    return {
      id: d.id,
      phone: d.phone,
      vehicleType: d.vehicleType,
      dutyStatus: d.dutyStatus,
      workMode: d.workMode,
      rating: d.rating,
      tier: d.tier,
      acceptanceRate: d.acceptanceRate,
      payoutCbu: d.payoutCbu,
      connectedAt: d.connectedAt,
      totalKm: d.totalKm,
      user: d.user,
    }
  } catch (e) {
    if (!isPrismaSchemaDriftError(e)) throw e
    const d = await prisma.flashDriver.findUnique({
      where: { id: driverId },
      select: DRIVER_FALLBACK_SELECT,
    })
    if (!d) return null
    return {
      id: d.id,
      phone: d.phone,
      vehicleType: d.vehicleType,
      dutyStatus: "OFFLINE",
      workMode: "hybrid",
      rating: 5,
      tier: "BRONZE",
      acceptanceRate: 100,
      payoutCbu: null,
      connectedAt: null,
      totalKm: 0,
      user: d.user,
    }
  }
}

export async function safeFlashDriverEarnings(driverId: string) {
  try {
    return await prisma.flashDriverEarning.findMany({
      where: { driverId },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
  } catch (e) {
    if (isPrismaSchemaDriftError(e)) return []
    throw e
  }
}

export async function safeFlashSupportOpenCount(driverId: string): Promise<number> {
  try {
    return await prisma.flashSupportTicket.count({
      where: { driverId, status: { in: ["OPEN", "IN_PROGRESS"] } },
    })
  } catch (e) {
    if (isPrismaSchemaDriftError(e)) return 0
    throw e
  }
}

export async function safeFlashDriverBlocks(driverId: string, now: Date) {
  try {
    return await prisma.flashDriverBlock.findMany({
      where: {
        OR: [
          { status: "AVAILABLE", startsAt: { gte: now } },
          { driverId, status: { in: ["RESERVED", "ACTIVE"] } },
        ],
      },
      orderBy: { startsAt: "asc" },
      take: 10,
    })
  } catch (e) {
    if (isPrismaSchemaDriftError(e)) return []
    throw e
  }
}
