import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logFlashAudit } from "@/lib/flash/audit"

/**
 * POST /api/flash/shipments/[id]/ready
 * El vendedor marca el paquete como "Listo para retirar".
 * LABEL_GENERATED | PACKAGE_READY → AVAILABLE
 * Esto hace que el envío aparezca en el feed de repartidores independientes.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params

  const shipment = await prisma.flashShipment.findUnique({
    where: { id },
    include: { order: { select: { sellerId: true } } },
  })

  if (!shipment) {
    return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })
  }

  // Solo el vendedor dueño del envío puede marcarlo como listo
  if (shipment.order.sellerId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const validPrevious = ["LABEL_GENERATED", "PACKAGE_READY"]
  if (!validPrevious.includes(shipment.status)) {
    return NextResponse.json(
      { error: `El envío debe tener etiqueta generada. Estado actual: ${shipment.status}` },
      { status: 400 }
    )
  }

  const previousStatus = shipment.status

  const updated = await prisma.flashShipment.update({
    where: { id },
    data: { status: "AVAILABLE" },
    select: { id: true, status: true },
  })

  await logFlashAudit({
    shipmentId: id,
    actorId: session.user.id,
    actorRole: "SELLER",
    action: "STATUS_CHANGED",
    previousStatus,
    newStatus: "AVAILABLE",
    metadata: { markedReadyBySeller: true },
  })

  return NextResponse.json({ shipment: updated })
}
