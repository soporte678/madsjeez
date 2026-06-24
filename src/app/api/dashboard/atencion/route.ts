import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = Math.min(90, Math.max(7, parseInt(searchParams.get("days") || "30")))
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  try {
    const userId = session.user.id

    // Métricas del seller (agregadas)
    const seller = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        openClaims: true,
        resolvedClaims: true,
        claimsAgainst: true,
        claimRate: true,
        cancellationRate: true,
        delayRate: true,
        delayedShipments: true,
        onTimeDeliveries: true,
      },
    })

    // Reclamos recientes (como seller)
    const claims = await prisma.claim.findMany({
      where: {
        sellerId: userId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        reason: true,
        status: true,
        refundAmount: true,
        createdAt: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            items: {
              take: 1,
              select: {
                product: { select: { title: true } },
              },
            },
          },
        },
      },
    })

    // Cancelaciones en el período
    const canceledOrders = await prisma.order.count({
      where: {
        items: { some: { product: { sellerId: userId } } },
        status: "CANCELLED",
        createdAt: { gte: since },
      },
    })

    // Total órdenes en el período (para calcular tasas del período)
    const totalOrdersInPeriod = await prisma.order.count({
      where: {
        items: { some: { product: { sellerId: userId } } },
        createdAt: { gte: since },
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] },
      },
    })

    // Envíos tardíos en el período
    const delayedShipments = await prisma.shipment.findMany({
      where: {
        order: {
          items: { some: { product: { sellerId: userId } } },
          createdAt: { gte: since },
        },
        status: "DELAYED",
      },
      take: 20,
      select: {
        id: true,
        carrier: true,
        carrierName: true,
        trackingNumber: true,
        status: true,
        estimatedDelivery: true,
        createdAt: true,
        order: {
          select: {
            orderNumber: true,
            items: {
              take: 1,
              select: { product: { select: { title: true } } },
            },
          },
        },
      },
    })

    // Agrupar reclamos por tipo
    const claimsByType: Record<string, number> = {}
    for (const c of claims) {
      const t = c.type || "Otro"
      claimsByType[t] = (claimsByType[t] || 0) + 1
    }

    const claimRate = seller?.claimRate != null
      ? seller.claimRate
      : (totalOrdersInPeriod > 0 ? (claims.length / totalOrdersInPeriod) * 100 : 0)

    const cancRate = seller?.cancellationRate != null
      ? seller.cancellationRate
      : (totalOrdersInPeriod > 0 ? (canceledOrders / totalOrdersInPeriod) * 100 : 0)

    return NextResponse.json({
      summary: {
        openClaims: seller?.openClaims ?? 0,
        resolvedClaims: seller?.resolvedClaims ?? 0,
        totalClaims: claims.length,
        claimRate: claimRate.toFixed(2),
        cancellationRate: cancRate.toFixed(2),
        canceledOrders,
        totalOrders: totalOrdersInPeriod,
        delayedCount: seller?.delayedShipments ?? delayedShipments.length,
        onTimeCount: seller?.onTimeDeliveries ?? 0,
        delayRate: seller?.delayRate != null ? seller.delayRate.toFixed(2) : "0.00",
      },
      claimsByType: Object.entries(claimsByType).map(([type, count]) => ({ type, count })),
      recentClaims: claims.map(c => ({
        id: c.id,
        type: c.type,
        reason: c.reason,
        status: c.status,
        refundAmount: Number(c.refundAmount ?? 0),
        createdAt: c.createdAt.toISOString(),
        orderNumber: c.order?.orderNumber ?? null,
        productTitle: c.order?.items[0]?.product?.title ?? null,
      })),
      delayedShipments: delayedShipments.map(s => ({
        id: s.id,
        carrier: s.carrierName ?? s.carrier,
        tracking: s.trackingNumber,
        estimatedDelivery: s.estimatedDelivery?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
        orderNumber: s.order?.orderNumber ?? null,
        productTitle: s.order?.items[0]?.product?.title ?? null,
      })),
    })
  } catch (error) {
    logger.error("Error en /api/dashboard/atencion:", error)
    return NextResponse.json({ error: "Error al cargar atención" }, { status: 500 })
  }
}
