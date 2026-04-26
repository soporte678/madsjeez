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
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: any = { seller_id: userId }
    if (status === "active") where.is_active = true
    if (status === "paused") where.is_active = false
    if (status === "low_stock") where.stock = { lte: 5 }
    if (status === "no_sales") where.sales = 0

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          category: { select: { name: true } },
        },
      }),
      prisma.product.count({ where }),
    ])

    // Resumen
    const [activeCount, pausedCount, lowStockCount, noSalesCount] = await Promise.all([
      prisma.product.count({ where: { seller_id: userId, is_active: true } }),
      prisma.product.count({ where: { seller_id: userId, is_active: false } }),
      prisma.product.count({ where: { seller_id: userId, stock: { lte: 5 } } }),
      prisma.product.count({ where: { seller_id: userId, sales: 0 } }),
    ])

    // Productos más vendidos
    const topProducts = await prisma.product.findMany({
      where: { seller_id: userId },
      orderBy: { sales: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        sales: true,
        price: true,
        views: true,
      },
    })

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: {
        active: activeCount,
        paused: pausedCount,
        lowStock: lowStockCount,
        noSales: noSalesCount,
      },
      topProducts,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 })
  }
}
