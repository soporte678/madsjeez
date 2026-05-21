import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { adminJson, requireFlashAdmin } from "@/lib/flash/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const shipment = await prisma.flashShipment.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          orderNumber: true,
          buyerId: true,
          buyer: { select: { name: true, email: true } },
          items: { select: { product: { select: { sellerId: true } } }, take: 1 },
        },
      },
      driver: { include: { user: { select: { name: true, email: true } } } },
      attempts: { include: { photos: true }, orderBy: { attemptNumber: "asc" } },
      authorizedPeople: true,
      deliveryProof: true,
      auditLogs: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!shipment) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })

  const admin = await requireFlashAdmin(req)
  if (!(admin instanceof NextResponse)) {
    return adminJson(admin, { shipment })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const userId = session.user.id
  const buyerId = shipment.order?.buyerId
  const sellerId = shipment.order?.items?.[0]?.product?.sellerId
  const driverUserId = shipment.driver?.userId ?? null

  const allowed =
    userId === buyerId ||
    userId === sellerId ||
    userId === driverUserId

  if (!allowed) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  return NextResponse.json({ shipment })
}
