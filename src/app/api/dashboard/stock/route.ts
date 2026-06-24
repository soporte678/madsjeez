import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

const LOW_STOCK_THRESHOLD = 5
const CRITICAL_STOCK_THRESHOLD = 1

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const userId = session.user.id

    const products = await prisma.product.findMany({
      where: { sellerId: userId },
      select: {
        id: true,
        title: true,
        sku: true,
        stock: true,
        price: true,
        sales: true,
        isActive: true,
        images: { take: 1, select: { url: true } },
        category: { select: { name: true } },
      },
      orderBy: { stock: "asc" },
    })

    const outOfStock = products.filter(p => p.stock === 0)
    const critical = products.filter(p => p.stock > 0 && p.stock <= CRITICAL_STOCK_THRESHOLD)
    const lowStock = products.filter(p => p.stock > CRITICAL_STOCK_THRESHOLD && p.stock <= LOW_STOCK_THRESHOLD)
    const normal = products.filter(p => p.stock > LOW_STOCK_THRESHOLD)

    const totalStockValue = products.reduce((s, p) => s + Number(p.price) * p.stock, 0)
    const activeProducts = products.filter(p => p.isActive)
    const inactiveProducts = products.filter(p => !p.isActive)

    // Distribución por categoría
    const byCat: Record<string, { count: number; stock: number }> = {}
    for (const p of products) {
      const cat = p.category?.name ?? "Sin categoría"
      if (!byCat[cat]) byCat[cat] = { count: 0, stock: 0 }
      byCat[cat].count++
      byCat[cat].stock += p.stock
    }

    return NextResponse.json({
      summary: {
        total: products.length,
        active: activeProducts.length,
        inactive: inactiveProducts.length,
        outOfStock: outOfStock.length,
        critical: critical.length,
        lowStock: lowStock.length,
        normal: normal.length,
        totalStockValue,
        totalUnits: products.reduce((s, p) => s + p.stock, 0),
      },
      alerts: [
        ...outOfStock.map(p => ({ ...p, alertLevel: "out" as const, price: Number(p.price), img: p.images[0]?.url ?? null, categoryName: p.category?.name ?? null })),
        ...critical.map(p => ({ ...p, alertLevel: "critical" as const, price: Number(p.price), img: p.images[0]?.url ?? null, categoryName: p.category?.name ?? null })),
        ...lowStock.map(p => ({ ...p, alertLevel: "low" as const, price: Number(p.price), img: p.images[0]?.url ?? null, categoryName: p.category?.name ?? null })),
      ].slice(0, 30),
      byCategory: Object.entries(byCat)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => a.stock - b.stock),
    })
  } catch (error) {
    logger.error("Error en /api/dashboard/stock:", error)
    return NextResponse.json({ error: "Error al cargar stock" }, { status: 500 })
  }
}
