import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const userId = session.user.id

    const seller = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        sellerName: true,
        storeSlug: true,
        reputationScore: true,
        reputationLevel: true,
        reputationColor: true,
        totalSales: true,
        successfulSales: true,
        totalRevenue: true,
        monthlyViews: true,
        conversionRate: true,
      },
    })

    // Productos agrupados por categoría con ventas
    const products = await prisma.product.findMany({
      where: { sellerId: userId, isActive: true },
      select: {
        id: true,
        title: true,
        price: true,
        sales: true,
        views: true,
        category: { select: { id: true, name: true } },
      },
    })

    // Agrupar por categoría
    const catMap = new Map<string, { id: string; name: string; revenue: number; sales: number; views: number; count: number }>()
    for (const p of products) {
      const cat = p.category ? { id: p.category.id, name: p.category.name } : { id: "none", name: "Sin categoría" }
      if (!catMap.has(cat.id)) {
        catMap.set(cat.id, { id: cat.id, name: cat.name, revenue: 0, sales: 0, views: 0, count: 0 })
      }
      const c = catMap.get(cat.id)!
      c.revenue += Number(p.price) * p.sales
      c.sales += p.sales
      c.views += p.views
      c.count++
    }

    const byCategory = Array.from(catMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map(c => ({
        ...c,
        conversionRate: c.views > 0 ? ((c.sales / c.views) * 100).toFixed(2) : "0.00",
      }))

    const totalRevenue = Number(seller?.totalRevenue ?? 0)
    const totalSales = seller?.successfulSales ?? 0

    return NextResponse.json({
      seller: {
        name: seller?.sellerName ?? "Mi tienda",
        slug: seller?.storeSlug ?? null,
        reputationScore: seller?.reputationScore ?? 0,
        reputationLevel: seller?.reputationLevel ?? null,
        reputationColor: seller?.reputationColor ?? "grey",
        totalRevenue,
        totalSales,
        monthlyViews: seller?.monthlyViews ?? 0,
        conversionRate: seller?.conversionRate?.toFixed(2) ?? "0.00",
      },
      byCategory,
      // Datos de competidores requieren integración con MercadoLibre.
      // Pendiente cuando se active la sincronización de cuenta MeLi.
      competitorsAvailable: false,
    })
  } catch (error) {
    logger.error("Error en /api/dashboard/mercado:", error)
    return NextResponse.json({ error: "Error al cargar datos de mercado" }, { status: 500 })
  }
}
