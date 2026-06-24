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
        name: true,
        image: true,
        reputationScore: true,
        reputationLevel: true,
        reputationColor: true,
        monthlyViews: true,
        totalRevenue: true,
        successfulSales: true,
        conversionRate: true,
        subscriptionTier: true,
      },
    })

    // Top productos por vistas
    const topByViews = await prisma.product.findMany({
      where: { sellerId: userId, isActive: true },
      orderBy: { views: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        views: true,
        sales: true,
        price: true,
        images: { take: 1, select: { url: true } },
      },
    })

    // Top productos por ventas
    const topBySales = await prisma.product.findMany({
      where: { sellerId: userId, isActive: true },
      orderBy: { sales: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        views: true,
        sales: true,
        price: true,
        images: { take: 1, select: { url: true } },
      },
    })

    const totalViews = topByViews.reduce((s, p) => s + p.views, 0)
    const profileViews = seller?.monthlyViews ?? 0

    return NextResponse.json({
      profile: {
        name: seller?.sellerName ?? seller?.name ?? "Mi tienda",
        slug: seller?.storeSlug ?? null,
        image: seller?.image ?? null,
        reputationScore: seller?.reputationScore ?? 0,
        reputationLevel: seller?.reputationLevel ?? null,
        reputationColor: seller?.reputationColor ?? "grey",
        monthlyViews: profileViews,
        totalRevenue: Number(seller?.totalRevenue ?? 0),
        successfulSales: seller?.successfulSales ?? 0,
        conversionRate: seller?.conversionRate?.toFixed(2) ?? "0.00",
        subscriptionTier: seller?.subscriptionTier ?? "FREE",
      },
      topByViews: topByViews.map(p => ({
        id: p.id,
        title: p.title,
        views: p.views,
        sales: p.sales,
        price: Number(p.price),
        img: p.images[0]?.url ?? null,
        conversionRate: p.views > 0 ? ((p.sales / p.views) * 100).toFixed(2) : "0.00",
      })),
      topBySales: topBySales.map(p => ({
        id: p.id,
        title: p.title,
        views: p.views,
        sales: p.sales,
        price: Number(p.price),
        img: p.images[0]?.url ?? null,
      })),
      summary: {
        profileViews,
        productViews: totalViews,
        totalViews: profileViews + totalViews,
      },
    })
  } catch (error) {
    logger.error("Error en /api/dashboard/mipagina:", error)
    return NextResponse.json({ error: "Error al cargar Mi página" }, { status: 500 })
  }
}
