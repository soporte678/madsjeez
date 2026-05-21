import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFlashDriver } from "@/lib/flash/auth"
import { ensureFlashRateConfig, getFlashRateSettings } from "@/lib/flash/rate-config"
import { estimateShipmentEarning } from "@/lib/flash/earnings-calculator"

function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfWeek(d = new Date()) {
  const x = startOfDay(d)
  const day = x.getDay()
  const diff = day === 0 ? 6 : day - 1
  x.setDate(x.getDate() - diff)
  return x
}

export async function GET() {
  const auth = await requireFlashDriver()
  if (auth instanceof NextResponse) return auth

  await ensureFlashRateConfig()
  const rates = await getFlashRateSettings()

  const now = new Date()
  const dayStart = startOfDay(now)
  const weekStart = startOfWeek(now)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const driver = await prisma.flashDriver.findUnique({
    where: { id: auth.driverId },
    include: {
      user: { select: { name: true, email: true, image: true } },
    },
  })

  if (!driver) {
    return NextResponse.json({ error: "Conductor no encontrado" }, { status: 404 })
  }

  const shipments = await prisma.flashShipment.findMany({
    where: { driverId: auth.driverId },
    include: {
      order: { select: { orderNumber: true } },
      attempts: { select: { id: true, attemptNumber: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  })

  const earnings = await prisma.flashDriverEarning.findMany({
    where: { driverId: auth.driverId },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const sumEarnings = (from: Date, to?: Date) => {
    return earnings
      .filter((e) => e.createdAt >= from && (!to || e.createdAt < to))
      .reduce(
        (acc, e) => {
          acc.gross += e.grossAmount
          acc.net += e.netAmount
          acc.tips += e.tipAmount
          return acc
        },
        { gross: 0, net: 0, tips: 0 }
      )
  }

  const todayEarn = sumEarnings(dayStart)
  const weekEarn = sumEarnings(weekStart)
  const monthEarn = sumEarnings(monthStart)

  const deliveredToday = shipments.filter(
    (s) => s.status === "DELIVERED" && s.updatedAt >= dayStart
  ).length

  const pendingStatuses = [
    "ASSIGNED_TO_DRIVER",
    "IN_TRANSIT",
    "ARRIVED_AT_ADDRESS",
    "PENDING_VISIT_2",
    "PENDING_VISIT_3",
  ]
  const activeShipments = shipments.filter((s) => pendingStatuses.includes(s.status))
  const failedCount = shipments.filter((s) =>
    s.status.startsWith("FAILED") || s.status === "RETURNED_TO_SENDER"
  ).length

  const connectedMinutes = driver.connectedAt
    ? Math.floor((now.getTime() - driver.connectedAt.getTime()) / 60000)
    : 0

  const openTickets = await prisma.flashSupportTicket.count({
    where: { driverId: auth.driverId, status: { in: ["OPEN", "IN_PROGRESS"] } },
  })

  const availableBlocks = await prisma.flashDriverBlock.findMany({
    where: {
      OR: [
        { status: "AVAILABLE", startsAt: { gte: now } },
        { driverId: auth.driverId, status: { in: ["RESERVED", "ACTIVE"] } },
      ],
    },
    orderBy: { startsAt: "asc" },
    take: 10,
  })

  const walletPending = earnings
    .filter((e) => e.status === "PENDING")
    .reduce((s, e) => s + e.netAmount, 0)
  const walletProcessing = earnings
    .filter((e) => e.status === "PROCESSING")
    .reduce((s, e) => s + e.netAmount, 0)
  const walletPaid = earnings
    .filter((e) => e.status === "PAID")
    .reduce((s, e) => s + e.netAmount, 0)

  const shipmentsWithEstimate = activeShipments.map((s) => {
    const est = estimateShipmentEarning(s, rates, { km: 5 })
    return {
      ...s,
      estimatedPay: est.net,
      estimatedGross: est.gross,
    }
  })

  const notifications = [
    ...(activeShipments.length > 0
      ? [{ id: "n1", type: "order", title: `${activeShipments.length} pedido(s) activo(s)`, read: false }]
      : []),
    ...(availableBlocks.length > 0
      ? [{ id: "n2", type: "block", title: "Bloques Flex disponibles cerca tuyo", read: false }]
      : []),
    ...(openTickets > 0
      ? [{ id: "n3", type: "support", title: "Soporte respondió tu solicitud", read: false }]
      : []),
  ]

  return NextResponse.json({
    driver: {
      id: driver.id,
      name: driver.user.name,
      email: driver.user.email,
      image: driver.user.image,
      phone: driver.phone,
      vehicleType: driver.vehicleType,
      dutyStatus: driver.dutyStatus,
      workMode: driver.workMode,
      rating: driver.rating,
      tier: driver.tier,
      acceptanceRate: driver.acceptanceRate,
      payoutCbu: driver.payoutCbu,
      connectedMinutes,
      totalKm: driver.totalKm,
    },
    summary: {
      earnedToday: todayEarn.net,
      earnedWeek: weekEarn.net,
      earnedMonth: monthEarn.net,
      commissionToday: todayEarn.net,
      tipsToday: todayEarn.tips,
      grossToday: todayEarn.gross,
      deliveredToday,
      pendingCount: activeShipments.length,
      failedCount,
      nextPayoutEstimate: walletPending,
      nextPayoutStatus: walletProcessing > 0 ? "PROCESSING" : "PENDING",
    },
    wallet: {
      available: walletPaid,
      pending: walletPending,
      processing: walletProcessing,
    },
    performance: {
      acceptanceRate: driver.acceptanceRate,
      successRate:
        shipments.length > 0
          ? Math.round(
              ((shipments.filter((s) => s.status === "DELIVERED").length) / shipments.length) * 1000
            ) / 10
          : 100,
      avgDeliveryMin: 28,
      rating: driver.rating,
      tier: driver.tier,
    },
    rates,
    shipments: shipmentsWithEstimate,
    allShipments: shipments,
    earnings: earnings.slice(0, 20),
    blocks: availableBlocks,
    notifications,
    supportOpen: openTickets,
  })
}
