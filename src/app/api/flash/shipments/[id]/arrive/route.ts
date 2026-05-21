import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logFlashAudit } from "@/lib/flash/audit"

// POST — chofer registra llegada al domicilio con GPS
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params
  const { latitude, longitude } = await req.json()

  const shipment = await prisma.flashShipment.findUnique({
    where: { id },
    include: { attempts: { orderBy: { attemptNumber: "desc" }, take: 1 } },
  })
  if (!shipment) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })

  const driver = await prisma.flashDriver.findUnique({
    where: { userId: (session.user as { id: string }).id },
  })
  if (!driver) return NextResponse.json({ error: "No sos chofer" }, { status: 403 })

  const lastAttempt = shipment.attempts[0]
  const attemptNumber = lastAttempt ? lastAttempt.attemptNumber + 1 : 1
  if (attemptNumber > 3) {
    return NextResponse.json({ error: "Máximo 3 intentos alcanzado" }, { status: 400 })
  }

  const attempt = await prisma.flashDeliveryAttempt.create({
    data: {
      shipmentId: id,
      driverId: driver.id,
      attemptNumber,
      arrivedAt: new Date(),
      latitude,
      longitude,
      status: "IN_PROGRESS",
    },
  })

  await prisma.flashShipment.update({
    where: { id },
    data: { status: "ARRIVED_AT_ADDRESS" },
  })

  await logFlashAudit({
    shipmentId: id,
    actorId: driver.userId,
    actorRole: "DRIVER",
    action: `ARRIVED_ATTEMPT_${attemptNumber}`,
    previousStatus: shipment.status,
    newStatus: "ARRIVED_AT_ADDRESS",
    metadata: { latitude, longitude, attemptNumber },
  })

  return NextResponse.json({ attempt })
}
