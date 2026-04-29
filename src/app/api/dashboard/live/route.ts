import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id
    
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Ventas de hoy del vendedor
    const todaySellerItems = await prisma.orderItem.findMany({
      where: {
        product: { sellerId: userId },
        order: {
          createdAt: { gte: startOfDay },
          status: { not: "CANCELLED" }
        }
      },
      include: {
        product: { select: { id: true, title: true, images: true } },
      },
    })

    const todayRevenue = todaySellerItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)
    const todaySalesCount = todaySellerItems.length

    // Visitas de hoy (total de views de todos los productos del vendedor)
    const viewsData = await prisma.product.aggregate({
      where: { sellerId: userId },
      _sum: { views: true },
    })

    // Productos más vendidos hoy
    const topProductMap = new Map<string, { product: any, quantity: number, revenue: number }>()
    for (const item of todaySellerItems) {
      const existing = topProductMap.get(item.productId)
      if (existing) {
        existing.quantity += item.quantity
        existing.revenue += item.price * item.quantity
      } else {
        topProductMap.set(item.productId, {
          product: item.product,
          quantity: item.quantity,
          revenue: item.price * item.quantity,
        })
      }
    }

    const topProducts = Array.from(topProductMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(item => ({
        id: item.product.id,
        title: item.product.title,
        images: item.product.images,
        quantity: item.quantity,
        revenue: item.revenue,
      }))

    // Ventas por hora (raw query)
    const hourlyData = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM o.created_at)::int as hour,
        COUNT(oi.id)::int as sales_count,
        COALESCE(SUM(oi.price * oi.quantity), 0)::float as total_amount
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE p.seller_id = ${userId}
        AND o.created_at >= ${startOfDay}
        AND o.status != 'CANCELLED'
      GROUP BY EXTRACT(HOUR FROM o.created_at)
      ORDER BY hour
    ` as Array<{ hour: number; sales_count: number; total_amount: number }>

    // Compradores únicos
    const uniqueBuyers = await prisma.order.findMany({
      where: {
        items: { some: { product: { sellerId: userId } } },
        createdAt: { gte: startOfDay },
        status: { not: "CANCELLED" }
      },
      select: { buyerId: true },
      distinct: ['buyerId'],
    })

    const totalViews = viewsData._sum.views || 0
    const conversionRate = totalViews > 0 ? (todaySalesCount / totalViews) * 100 : 0

    return NextResponse.json({
      live: {
        todayRevenue,
        todaySales: todaySalesCount,
        todayViews: totalViews,
        uniqueBuyers: uniqueBuyers.length,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averagePrice: todaySalesCount > 0 ? todayRevenue / todaySalesCount : 0,
      },
      topProducts,
      hourlyData,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching live monitor data:", error)
    return NextResponse.json(
      { error: "Error al obtener datos en vivo" },
      { status: 500 }
    )
  }
}
