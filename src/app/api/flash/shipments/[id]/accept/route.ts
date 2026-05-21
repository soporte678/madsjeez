import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFlashDriver } from "@/lib/flash/auth"
import { logFlashAudit } from "@/lib/flash/audit"
import { isPrismaSchemaDriftError } from "@/lib/flash/prisma-safe"

/**
 * POST /api/flash/shipments/[id]/accept
 * El repartidor acepta un envío disponible (status AVAILABLE).
 * Cambia a ACCEPTED_BY_DRIVER y asigna driverId.
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

  // Solo se puede aceptar si está AVAILABLE (sin driver)
  if (shipment.status !== "AVAILABLE" || shipment.driverId !== null) {
    return NextResponse.json(
      { error: "Este envío ya no está disponible" },
      { status: 409 }
    )
  }

  try {
    const updated = await prisma.flashShipment.update({
      where: {
        id,
        status: "AVAILABLE", // optimistic lock
        driverId: null,
      },
      data: {
        driverId: auth.driverId,
        status: "ACCEPTED_BY_DRIVER",
      },
      select: {
        id: true,
        status: true,
        city: true,
        province: true,
        street: true,
        streetNumber: true,
        floor: true,
        apartment: true,
        betweenStreet1: true,
        betweenStreet2: true,
        postalCode: true,
        recipientName: true,
        recipientPhone: true,
        order: { select: { orderNumber: true } },
      },
    })

    await logFlashAudit({
      shipmentId: id,
      actorId: auth.driverId,
      actorRole: "DRIVER",
      action: "DRIVER_ASSIGNED",
      previousStatus: "AVAILABLE",
      newStatus: "ACCEPTED_BY_DRIVER",
      metadata: { selfAssigned: true },
    })

    return NextResponse.json({ shipment: updated })
  } catch (e) {
    if (isPrismaSchemaDriftError(e)) {
      return NextResponse.json({ error: "Error de schema, intente más tarde" }, { status: 500 })
    }
    // P2025 = record not found (race condition — otro driver aceptó primero)
    const err = e as { code?: string }
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Este envío ya no está disponible" }, { status: 409 })
    }
    throw e
  }
}
