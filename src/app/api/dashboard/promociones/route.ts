import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = Math.min(30, Math.max(7, parseInt(searchParams.get("days") || "30")))

  try {
    const userId = session.user.id
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Campañas del seller
    const campaigns = await prisma.campaign.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        discountType: true,
        discountValue: true,
        maxBudget: true,
        spentBudget: true,
      },
    })

    // Cupones del seller
    const coupons = await prisma.coupon.findMany({
      where: { sellerId: userId },
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        usedCount: true,
        maxUses: true,
        isBoosted: true,
        startsAt: true,
        expiresAt: true,
      },
    })

    // Órdenes en el período para calcular ventas generales
    const orderItems = await prisma.orderItem.findMany({
      where: {
        product: { sellerId: userId },
        order: {
          createdAt: { gte: since },
          status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        },
      },
      select: { quantity: true, price: true },
    })

    const grossPeriod = orderItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0)
    const unitsSold = orderItems.reduce((s, i) => s + i.quantity, 0)

    // Chart de ventas por día (para las promociones activas)
    const MES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
    const dayMap = new Map<string, number>()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      dayMap.set(`${d.getDate()} ${MES[d.getMonth()]}`, 0)
    }

    const ordersInPeriod = await prisma.orderItem.findMany({
      where: {
        product: { sellerId: userId },
        order: {
          createdAt: { gte: since },
          status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        },
      },
      select: { quantity: true, price: true, order: { select: { createdAt: true } } },
    })

    for (const item of ordersInPeriod) {
      const d = item.order.createdAt
      const key = `${d.getDate()} ${MES[d.getMonth()]}`
      dayMap.set(key, (dayMap.get(key) || 0) + Number(item.price) * item.quantity)
    }

    const chartData = Array.from(dayMap.entries()).map(([day, value]) => ({ day, value }))

    return NextResponse.json({
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        startDate: c.startDate?.toISOString() ?? null,
        endDate: c.endDate?.toISOString() ?? null,
        discountType: c.discountType,
        discountValue: Number(c.discountValue ?? 0),
        maxBudget: Number(c.maxBudget ?? 0),
        spentBudget: Number(c.spentBudget ?? 0),
      })),
      coupons: coupons.map(c => ({
        id: c.id,
        code: c.code,
        discountType: c.discountType,
        discountValue: Number(c.discountValue ?? 0),
        usedCount: c.usedCount,
        maxUses: c.maxUses,
        isBoosted: c.isBoosted,
        startsAt: c.startsAt?.toISOString() ?? null,
        expiresAt: c.expiresAt?.toISOString() ?? null,
      })),
      chartData,
      summary: {
        grossPeriod,
        unitsSold,
        activeCampaigns: campaigns.filter(c => c.status === "ACTIVE").length,
        totalCampaigns: campaigns.length,
        activeCoupons: coupons.filter(c => {
          const now = new Date()
          return (!c.startsAt || c.startsAt <= now) && (!c.expiresAt || c.expiresAt >= now)
        }).length,
        totalCouponUses: coupons.reduce((s, c) => s + c.usedCount, 0),
      },
    })
  } catch (error) {
    logger.error("Error en /api/dashboard/promociones:", error)
    return NextResponse.json({ error: "Error al cargar promociones" }, { status: 500 })
  }
}
