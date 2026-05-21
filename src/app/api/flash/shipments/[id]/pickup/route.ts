import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFlashDriver } from "@/lib/flash/auth"
import { logFlashAudit } from "@/lib/flash/audit"

/**
 * POST /api/flash/shipments/[id]/pickup
 * El repartidor confirma que retiró el paquete del vendedor.
 * Puede ser invocado tras escanear el QR de la etiqueta en el local del vendedor.
 * Cambia ACCEPTED_BY_DRIVER | DRIVER_EN_ROUTE_TO_PICKUP → PACKAGE_PICKED_UP → IN_TRANSIT
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireFlashDriver()
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  const shipment = await prisma.flashShipment.findUnique({
    where: { id },
    select: { id: true, status: true, driverId: true },
  })

  if (!shipment) {
    return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })
  }

  if (shipment.driverId !== auth.driverId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const validPrevious = ["ACCEPTED_BY_DRIVER", "DRIVER_EN_ROUTE_TO_PICKUP", "ASSIGNED_TO_DRIVER", "PACKAGE_READY"]
  if (!validPrevious.includes(shipment.status)) {
    return NextResponse.json(
      { error: `Estado inválido para retirar: ${shipment.status}` },
      { status: 400 }
    )
  }

  const previousStatus = shipment.status

  const updated = await prisma.flashShipment.update({
    where: { id },
    data: { status: "IN_TRANSIT" },
    select: {
      id: true,
      status: true,
      recipientName: true,
      recipientPhone: true,
      street: true,
      streetNumber: true,
      floor: true,
      apartment: true,
      city: true,
      province: true,
      betweenStreet1: true,
      betweenStreet2: true,
      order: { select: { orderNumber: true } },
    },
  })

  await logFlashAudit({
    shipmentId: id,
    actorId: auth.driverId,
    actorRole: "DRIVER",
    action: "STATUS_CHANGED",
    previousStatus,
    newStatus: "IN_TRANSIT",
    metadata: { pickup: true },
  })

  return NextResponse.json({ shipment: updated })
}
