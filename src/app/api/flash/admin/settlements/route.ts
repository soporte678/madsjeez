import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFlashAdmin, adminJson } from "@/lib/flash/auth"

/**
 * GET /api/flash/admin/settlements?status=pending
 * Lista pagos/liquidaciones a conductores.
 */
export async function GET(req: NextRequest) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  try {
    const where = status ? { status } : {}
    const settlements = await prisma.flashDriverSettlement.findMany({
      where,
      include: {
        driver: {
          include: { user: { select: { name: true, email: true } } },
        },
        shipment: {
          select: {
            id: true,
            shippingTier: true,
            shippingPrice: true,
            paymentStatus: true,
            order: { select: { orderNumber: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    return adminJson(admin, { settlements })
  } catch {
    return adminJson(admin, { settlements: [], warning: "Tabla no migrada" })
  }
}

/**
 * PATCH /api/flash/admin/settlements
 * Admin retries settlement or marks as settled.
 * Body: { id, status, externalPaymentId? }
 */
export async function PATCH(req: NextRequest) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  const { id, status, externalPaymentId } = await req.json()
  if (!id || !status) {
    return adminJson(admin, { error: "id y status requeridos" }, { status: 400 })
  }

  const data: Record<string, unknown> = { status }
  if (status === "settled") data.paidAt = new Date()
  if (externalPaymentId) data.externalPaymentId = externalPaymentId

  const settlement = await prisma.flashDriverSettlement.update({
    where: { id },
    data,
  })

  // Also update shipment payment status
  if (status === "settled") {
    await prisma.flashShipment.update({
      where: { id: settlement.shipmentId },
      data: { paymentStatus: "settled_to_driver" },
    })
  }

  return adminJson(admin, { settlement })
}
