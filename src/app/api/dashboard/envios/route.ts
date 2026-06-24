import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const userId = session.user.id

    const seller = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        delayedShipments: true,
        onTimeDeliveries: true,
        delayRate: true,
      },
    })

    // Envíos de los últimos 30 días
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const shipments = await prisma.shipment.findMany({
      where: {
        order: {
          items: { some: { product: { sellerId: userId } } },
          createdAt: { gte: since30 },
        },
      },
      select: {
        id: true,
        status: true,
        carrier: true,
        carrierName: true,
        estimatedDelivery: true,
        deliveredAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    const flashShipments = await prisma.flashShipment.findMany({
      where: {
        order: {
          items: { some: { product: { sellerId: userId } } },
          createdAt: { gte: since30 },
        },
      },
      select: {
        id: true,
        status: true,
        shippingTier: true,
        estimatedDelivery: true,
        createdAt: true,
        city: true,
        province: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    // Agrupar por semana ISO
    const weeklyMap = new Map<string, { correct: number; delayed: number; total: number }>()

    const getWeekKey = (d: Date) => {
      const monday = new Date(d)
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      return `${monday.getDate()}/${monday.getMonth() + 1}`
    }

    for (const s of shipments) {
      const key = getWeekKey(s.createdAt)
      if (!weeklyMap.has(key)) weeklyMap.set(key, { correct: 0, delayed: 0, total: 0 })
      const w = weeklyMap.get(key)!
      w.total++
      if (s.status === "DELAYED") w.delayed++
      else w.correct++
    }

    const weeklyData = Array.from(weeklyMap.entries())
      .slice(-6)
      .map(([week, d]) => ({
        week,
        correct: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 100,
        delayed: d.total > 0 ? Math.round((d.delayed / d.total) * 100) : 0,
        total: d.total,
      }))

    // Estadísticas de envíos Flash por provincia
    const flashByProvince: Record<string, number> = {}
    for (const f of flashShipments) {
      const p = f.province || "Desconocida"
      flashByProvince[p] = (flashByProvince[p] || 0) + 1
    }

    const totalShipments = shipments.length
    const onTime = seller?.onTimeDeliveries ?? shipments.filter(s => s.status !== "DELAYED").length
    const delayed = seller?.delayedShipments ?? shipments.filter(s => s.status === "DELAYED").length
    const onTimePct = totalShipments > 0 ? ((onTime / (onTime + delayed)) * 100).toFixed(1) : "100.0"

    return NextResponse.json({
      summary: {
        totalShipments,
        onTime,
        delayed,
        onTimePct,
        delayRate: seller?.delayRate?.toFixed(2) ?? "0.00",
        flashCount: flashShipments.length,
        regularCount: shipments.length,
      },
      weeklyData,
      flashByProvince: Object.entries(flashByProvince).map(([province, count]) => ({ province, count })),
      recentDelayed: shipments
        .filter(s => s.status === "DELAYED")
        .slice(0, 10)
        .map(s => ({
          id: s.id,
          carrier: s.carrierName ?? s.carrier,
          estimatedDelivery: s.estimatedDelivery?.toISOString() ?? null,
          createdAt: s.createdAt.toISOString(),
        })),
    })
  } catch (error) {
    logger.error("Error en /api/dashboard/envios:", error)
    return NextResponse.json({ error: "Error al cargar envíos" }, { status: 500 })
  }
}
