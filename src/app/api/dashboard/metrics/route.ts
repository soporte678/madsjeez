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
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Ventas del mes (no canceladas)
    const monthlySales = await prisma.order.aggregate({
      where: {
        buyer: { id: userId },
        created_at: { gte: startOfMonth },
        status: { not: "CANCELLED" }
      },
      _sum: { total: true },
      _count: { id: true },
    })

    // Ventas de hoy
    const todaySales = await prisma.order.aggregate({
      where: {
        buyer: { id: userId },
        created_at: { gte: startOfDay },
        status: { not: "CANCELLED" }
      },
      _sum: { total: true },
      _count: { id: true },
    })

    // Ventas del vendedor (como seller via OrderItem)
    const sellerOrders = await prisma.orderItem.findMany({
      where: {
        product: { seller_id: userId },
        order: {
          created_at: { gte: startOfMonth },
          status: { not: "CANCELLED" }
        }
      },
      include: {
        order: { select: { total: true, status: true, created_at: true } },
        product: { select: { title: true, images: true } },
      },
    })

    const sellerRevenue = sellerOrders.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)
    const sellerSalesCount = sellerOrders.length

    // Ventas de hoy del vendedor
    const todaySellerOrders = await prisma.orderItem.findMany({
      where: {
        product: { seller_id: userId },
        order: {
          created_at: { gte: startOfDay },
          status: { not: "CANCELLED" }
        }
      },
    })
    const todaySellerRevenue = todaySellerOrders.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)

    // Productos publicados
    const productsCount = await prisma.product.count({
      where: { seller_id: userId, is_active: true },
    })

    // Total de visitas
    const viewsData = await prisma.product.aggregate({
      where: { seller_id: userId },
      _sum: { views: true },
    })

    // Órdenes recientes como vendedor
    const recentOrders = await prisma.order.findMany({
      where: {
        order_items: {
          some: {
            product: { seller_id: userId }
          }
        }
      },
      orderBy: { created_at: "desc" },
      take: 10,
      include: {
        order_items: {
          include: {
            product: {
              select: { title: true, images: true, price: true }
            }
          }
        },
      },
    })

    // Reseñas
    const reviewsData = await prisma.review.aggregate({
      where: {
        product: { seller_id: userId }
      },
      _avg: { rating: true },
      _count: { id: true },
    })

    const pendingReviews = await prisma.review.count({
      where: {
        product: { seller_id: userId },
        comment: { not: null },
      },
    })

    // Reclamos (claims) - usamos órdenes con problemas
    const claimsCount = await prisma.order.count({
      where: {
        order_items: { some: { product: { seller_id: userId } } },
        status: "REFUNDED",
      },
    })

    // Preguntas sin responder
    const pendingQuestions = await prisma.productAttribute.count({
      where: {
        product: { seller_id: userId },
      },
    })

    // Promociones activas (boosts)
    const activePromotions = await prisma.productBoost.count({
      where: {
        seller_id: userId,
        end_date: { gte: now },
      },
    })

    // Envíos express (productos con envío gratis)
    const expressShippingCount = await prisma.product.count({
      where: {
        seller_id: userId,
        is_active: true,
      },
    })

    return NextResponse.json({
      sales: {
        total: sellerRevenue,
        count: sellerSalesCount,
        today: todaySellerRevenue,
        todayCount: todaySellerOrders.length,
      },
      products: {
        total: productsCount,
        views: viewsData._sum.views || 0,
      },
      orders: recentOrders,
      claims: {
        open: claimsCount,
      },
      reviews: {
        pending: pendingReviews,
        average: reviewsData._avg.rating || 0,
        total: reviewsData._count.id,
      },
      questions: {
        pending: pendingQuestions,
      },
      promotions: {
        active: activePromotions,
      },
      shipping: {
        express: expressShippingCount,
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error)
    return NextResponse.json(
      { error: "Error al obtener métricas" },
      { status: 500 }
    )
  }
}
