import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

type MinimalItem = { quantity: number; price: number | { toNumber?(): number }; order: { createdAt: Date } }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const userId = session.user.id
    const now = new Date()

    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    const [todayItems, yesterdayItems] = await Promise.all([
      prisma.orderItem.findMany({
        where: {
          product: { sellerId: userId },
          order: {
            createdAt: { gte: todayStart },
            status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
          },
        },
        select: {
          quantity: true,
          price: true,
          product: { select: { title: true, images: { take: 1, select: { url: true } } } },
          order: { select: { id: true, createdAt: true, buyerId: true } },
        },
      }),
      prisma.orderItem.findMany({
        where: {
          product: { sellerId: userId },
          order: {
            createdAt: { gte: yesterdayStart, lt: todayStart },
            status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
          },
        },
        select: {
          quantity: true,
          price: true,
          order: { select: { id: true, createdAt: true } },
        },
      }),
    ])

    const sumTotal = (items: MinimalItem[]) =>
      items.reduce((s, i) => s + Number(i.price) * i.quantity, 0)

    const todayTotal = sumTotal(todayItems)
    const yesterdayTotal = sumTotal(yesterdayItems)

    const hourlyToday = buildHourly(todayItems)
    const hourlyYesterday = buildHourly(yesterdayItems)

    const uniqueOrdersToday = new Set(todayItems.map(i => i.order.id))
    const uniqueBuyersToday = new Set(todayItems.map(i => i.order.buyerId).filter(Boolean))
    const unitsSold = todayItems.reduce((s, i) => s + i.quantity, 0)
    const avgPrice = uniqueOrdersToday.size > 0 ? todayTotal / uniqueOrdersToday.size : 0

    const seller = await prisma.user.findUnique({
      where: { id: userId },
      select: { monthlyViews: true },
    })
    const todayViews = Math.round((seller?.monthlyViews || 0) / 30)
    const conversion = todayViews > 0
      ? `${((uniqueOrdersToday.size / todayViews) * 100).toFixed(1)}%`
      : '0%'

    const topMap = new Map<string, { title: string; img: string; qty: number; amount: number }>()
    for (const item of todayItems) {
      const key = item.product.title
      const existing = topMap.get(key) || { title: item.product.title, img: item.product.images[0]?.url || '', qty: 0, amount: 0 }
      existing.qty += item.quantity
      existing.amount += Number(item.price) * item.quantity
      topMap.set(key, existing)
    }
    const topProducts = Array.from(topMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    return NextResponse.json({
      todayTotal,
      yesterdayTotal,
      metrics: {
        uniqueVisits: todayViews,
        totalBuyers: uniqueBuyersToday.size,
        orderCount: uniqueOrdersToday.size,
        conversion,
        unitsSold,
        avgPrice,
      },
      hourlyToday,
      hourlyYesterday,
      topProducts,
      updatedAt: now.toISOString(),
    })
  } catch (error) {
    logger.error("Error en /api/dashboard/monitor-ventas:", error)
    return NextResponse.json({ error: "Error al cargar monitor" }, { status: 500 })
  }
}

function buildHourly(items: MinimalItem[]) {
  const map: Record<number, number> = {}
  for (let h = 0; h < 24; h++) map[h] = 0
  for (const item of items) {
    const h = item.order.createdAt.getHours()
    map[h] = (map[h] || 0) + Number(item.price) * item.quantity
  }
  return Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2,'0')}:00`, amount: map[h] }))
}
