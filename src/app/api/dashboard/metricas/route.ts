import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

const MES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const HOURS = ['00','06','08','10','12','14','16','18','20','22']
const DAY_KEYS = ['dom','lun','mar','mie','jue','vie','sab'] as const

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const days = Math.min(30, Math.max(7, parseInt(searchParams.get("days") || "7")))

  try {
    const userId = session.user.id
    const now = new Date()
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // 1. Datos del seller
    const seller = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalSales: true,
        successfulSales: true,
        canceledSales: true,
        totalRevenue: true,
        monthlyRevenue: true,
        monthlyViews: true,
        conversionRate: true,
      },
    })

    // 2. Ítems de órdenes del seller en el período
    const orderItems = await prisma.orderItem.findMany({
      where: {
        product: { sellerId: userId },
        order: {
          createdAt: { gte: since },
          status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        },
      },
      select: {
        quantity: true,
        price: true,
        order: { select: { id: true, createdAt: true } },
      },
    })

    // 3. Ventas brutas por día
    const dayMap = new Map<string, number>()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      dayMap.set(`${d.getDate()} ${MES[d.getMonth()]}`, 0)
    }
    for (const item of orderItems) {
      const d = item.order.createdAt
      const key = `${d.getDate()} ${MES[d.getMonth()]}`
      dayMap.set(key, (dayMap.get(key) || 0) + Number(item.price) * item.quantity)
    }
    const salesData = Array.from(dayMap.entries()).map(([day, value]) => ({ day, value }))

    // 4. Heatmap por hora/día de semana (de las órdenes del período)
    const hmap: Record<string, Record<string, number>> = {}
    for (const h of HOURS) hmap[h] = { lun: 0, mar: 0, mie: 0, jue: 0, vie: 0, sab: 0, dom: 0 }

    for (const item of orderItems) {
      const h = item.order.createdAt.getHours()
      const bucket = HOURS.reduce((p, c) =>
        Math.abs(parseInt(c) - h) < Math.abs(parseInt(p) - h) ? c : p
      )
      const dayKey = DAY_KEYS[item.order.createdAt.getDay()]
      hmap[bucket][dayKey] = (hmap[bucket][dayKey] || 0) + 1
    }
    const heatmapData = HOURS.map(h => ({ hour: h, ...hmap[h] }))

    // 5. Top publicaciones del seller (activas, ordenadas por ventas)
    const products = await prisma.product.findMany({
      where: { sellerId: userId, isActive: true },
      orderBy: { sales: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        price: true,
        sales: true,
        views: true,
        isBoosted: true,
        condition: true,
        images: { take: 1, select: { url: true } },
      },
    })

    const totalProductSales = products.reduce((s, p) => s + p.sales, 0)
    const publicationsData = products.map(p => ({
      id: p.id,
      sku: p.id.slice(-12).toUpperCase(),
      title: p.title,
      price: Number(p.price),
      sales: p.sales,
      participation: totalProductSales > 0
        ? `${((p.sales / totalProductSales) * 100).toFixed(1)}%`
        : '0.0%',
      visits: p.views,
      img: p.images[0]?.url || '/placeholder.svg',
      condition: p.condition === 'used' ? 'Usado' : p.condition === 'refurbished' ? 'Reacondicionado' : 'Nuevo',
      badge: p.isBoosted ? 'DESTACADO' : null,
    }))

    // 6. Funnel de conversión (visitas → intención → venta)
    const monthlyViews = seller?.monthlyViews || 0
    const successfulSales = seller?.successfulSales || 0
    const grossPeriod = salesData.reduce((s, d) => s + d.value, 0)

    const funnelData = [
      { name: 'Visitas totales', value: monthlyViews, fill: '#E0E7FF' },
      { name: 'Intención de compra', value: Math.round(monthlyViews * 0.65), fill: '#C7D2FE' },
      { name: 'Ventas totales', value: successfulSales, fill: '#6366F1' },
    ]

    // 7. Resumen para las MetricCards
    const totalRevenue = Number(seller?.totalRevenue || 0)
    const avgPrice = successfulSales > 0 ? totalRevenue / successfulSales : 0
    const uniqueOrders = new Set(orderItems.map(i => i.order.id)).size
    const conversionRate = seller?.conversionRate != null
      ? seller.conversionRate.toFixed(1)
      : monthlyViews > 0
        ? ((successfulSales / monthlyViews) * 100).toFixed(1)
        : '0.0'

    return NextResponse.json({
      salesData,
      funnelData,
      heatmapData,
      publicationsData,
      summary: {
        grossPeriod,
        totalRevenue,
        totalSales: successfulSales,
        canceledSales: seller?.canceledSales || 0,
        monthlyViews,
        avgPrice,
        conversionRate,
        ordersInPeriod: uniqueOrders,
        activePublications: products.length,
        avgPerDay: uniqueOrders > 0 ? Math.round(uniqueOrders / days) : 0,
      },
    })
  } catch (error) {
    logger.error("Error en /api/dashboard/metricas:", error)
    return NextResponse.json({ error: "Error al cargar métricas" }, { status: 500 })
  }
}
