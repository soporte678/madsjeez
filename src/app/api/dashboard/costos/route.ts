import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = Math.min(30, Math.max(7, parseInt(searchParams.get("days") || "30")))
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  try {
    const userId = session.user.id

    // Órdenes del seller en el período
    const orders = await prisma.order.findMany({
      where: {
        items: { some: { product: { sellerId: userId } } },
        createdAt: { gte: since },
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
      },
      select: {
        id: true,
        subtotal: true,
        shippingCost: true,
        tax: true,
        total: true,
        status: true,
      },
    })

    // Envíos Flash del seller en el período
    const flashShipments = await prisma.flashShipment.findMany({
      where: {
        order: {
          items: { some: { product: { sellerId: userId } } },
          createdAt: { gte: since },
        },
      },
      select: { shippingPrice: true },
    })

    // Reembolsos por reclamos del seller
    const claimRefunds = await prisma.claim.findMany({
      where: {
        sellerId: userId,
        status: "RESOLVED",
        createdAt: { gte: since },
      },
      select: { refundAmount: true },
    })

    const totalSales = orders.reduce((s, o) => s + Number(o.subtotal), 0)
    const shippingCosts = orders.reduce((s, o) => s + Number(o.shippingCost ?? 0), 0)
    const flashCosts = flashShipments.reduce((s, f) => s + Number(f.shippingPrice ?? 0), 0)
    const taxTotal = orders.reduce((s, o) => s + Number(o.tax ?? 0), 0)
    const refunds = claimRefunds.reduce((s, c) => s + Number(c.refundAmount ?? 0), 0)

    // En Madsjeez comisión = 0%
    const salesCommission = 0
    const totalCosts = shippingCosts + flashCosts + taxTotal + refunds + salesCommission

    // Received = ventas - todos los cargos
    const received = totalSales - totalCosts

    // Top publicaciones por costo (por envío)
    const topProducts = await prisma.product.findMany({
      where: { sellerId: userId, isActive: true },
      orderBy: { sales: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        price: true,
        sales: true,
        freeShipping: true,
        shippingCost: true,
      },
    })

    const costPct = (v: number) => totalCosts > 0 ? `${((v / totalCosts) * 100).toFixed(1)}%` : "0.0%"

    return NextResponse.json({
      summary: {
        totalSales,
        totalCosts,
        received,
        shippingCosts,
        flashCosts,
        taxTotal,
        refunds,
        salesCommission,
        ordersCount: orders.length,
      },
      costDistribution: [
        { label: "Costos de envío estándar", value: shippingCosts, pct: costPct(shippingCosts), color: "#8B5CF6" },
        { label: "Costos de envío Flash", value: flashCosts, pct: costPct(flashCosts), color: "#7C3AED" },
        { label: "Impuestos", value: taxTotal, pct: costPct(taxTotal), color: "#F59E0B" },
        { label: "Reembolsos / devoluciones", value: refunds, pct: costPct(refunds), color: "#EF4444" },
        { label: "Comisión por venta (0%)", value: 0, pct: "0.0%", color: "#10B981" },
      ],
      topProducts: topProducts.map(p => ({
        id: p.id,
        title: p.title,
        price: Number(p.price),
        sales: p.sales,
        revenue: Number(p.price) * p.sales,
        shippingCost: p.freeShipping ? 0 : Number(p.shippingCost ?? 0),
        received: Number(p.price) * p.sales,
      })),
    })
  } catch (error) {
    logger.error("Error en /api/dashboard/costos:", error)
    return NextResponse.json({ error: "Error al cargar costos" }, { status: 500 })
  }
}
