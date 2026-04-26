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

    const where: any = {
      order_items: { some: { product: { seller_id: userId } } }
    }
    if (status && status !== "all") {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          order_items: {
            include: {
              product: {
                select: { id: true, title: true, price: true }
              }
            }
          },
        },
      }),
      prisma.order.count({ where }),
    ])

    // Resumen por estado
    const statusSummary = await prisma.order.groupBy({
      by: ["status"],
      where: {
        order_items: { some: { product: { seller_id: userId } } }
      },
      _count: { id: true },
      _sum: { total: true },
    })

    return NextResponse.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      statusSummary: statusSummary.reduce((acc: any, item: any) => {
        acc[item.status] = {
          count: item._count.id,
          total: item._sum.total || 0,
        }
        return acc
      }, {} as Record<string, { count: number; total: number }>),
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 })
  }
}
