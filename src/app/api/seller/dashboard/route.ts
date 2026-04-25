import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/seller/dashboard - Métricas del vendedor
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    if (!session.user.isSeller) {
      return NextResponse.json(
        { error: "Solo los vendedores pueden ver el dashboard" },
        { status: 403 }
      )
    }

    const sellerId = session.user.id

    // Obtener métricas
    const [
      totalProducts,
      activeProducts,
      totalSales,
      totalRevenue,
      pendingOrders,
      recentOrders,
      monthlyStats,
      productsByCategory,
    ] = await Promise.all([
      // Total de productos
      prisma.product.count({
        where: { sellerId }
      }),
      
      // Productos activos
      prisma.product.count({
        where: { sellerId, isActive: true }
      }),
      
      // Total de ventas
      prisma.orderItem.count({
        where: {
          product: { sellerId }
        }
      }),
      
      // Ingresos totales
      prisma.order.aggregate({
        where: {
          items: {
            some: {
              product: { sellerId }
            }
          },
          status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] }
        },
        _sum: { total: true }
      }),
      
      // Órdenes pendientes
      prisma.order.count({
        where: {
          items: {
            some: {
              product: { sellerId }
            }
          },
          status: "PENDING"
        }
      }),
      
      // Órdenes recientes
      prisma.order.findMany({
        where: {
          items: {
            some: {
              product: { sellerId }
            }
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: { title: true, images: { take: 1 } }
              }
            }
          },
          buyer: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      
      // Estadísticas mensuales (últimos 6 meses)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', o.created_at) as month,
          COUNT(DISTINCT o.id) as orders,
          SUM(o.total) as revenue
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE p.seller_id = ${sellerId}
          AND o.created_at >= NOW() - INTERVAL '6 months'
          AND o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
        GROUP BY DATE_TRUNC('month', o.created_at)
        ORDER BY month DESC
      `,
      
      // Productos por categoría
      prisma.product.groupBy({
        by: ['categoryId'],
        where: { sellerId },
        _count: { id: true },
      }),
    ])

    // Obtener información de categorías
    const categoryIds = productsByCategory.map(p => p.categoryId)
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true }
    })

    const categoryData = productsByCategory.map(p => ({
      category: categories.find(c => c.id === p.categoryId)?.name || "Sin categoría",
      count: p._count.id
    }))

    // Calcular métricas de suscripción
    const user = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        subscriptionTier: true,
        reputationColor: true,
        totalSales: true,
        successfulSales: true,
        claimRate: true,
      }
    })

    return NextResponse.json({
      overview: {
        totalProducts,
        activeProducts,
        totalSales,
        totalRevenue: totalRevenue._sum?.total || 0,
        pendingOrders,
      },
      recentOrders,
      monthlyStats,
      productsByCategory: categoryData,
      subscription: {
        tier: user?.subscriptionTier,
        reputationColor: user?.reputationColor,
        successRate: (user?.totalSales ?? 0) > 0 
          ? ((user?.successfulSales ?? 0) / (user?.totalSales ?? 1) * 100).toFixed(1)
          : 0,
        claimRate: user?.claimRate || 0,
      }
    })
  } catch (error) {
    console.error("Error fetching seller dashboard:", error)
    return NextResponse.json(
      { error: "Error al cargar dashboard" },
      { status: 500 }
    )
  }
}
