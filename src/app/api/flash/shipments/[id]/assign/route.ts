import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logFlashAudit } from "@/lib/flash/audit"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params
  const { driverId } = await req.json()

  const [shipment, driver] = await Promise.all([
    prisma.flashShipment.findUnique({ where: { id } }),
    prisma.flashDriver.findUnique({ where: { id: driverId } }),
  ])

  if (!shipment) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })
  if (!driver) return NextResponse.json({ error: "Chofer no encontrado" }, { status: 404 })
  if (!driver.isActive) return NextResponse.json({ error: "Chofer inactivo" }, { status: 400 })

  const updated = await prisma.flashShipment.update({
    where: { id },
    data: { driverId, status: "ASSIGNED_TO_DRIVER" },
    include: { driver: { include: { user: { select: { name: true, email: true } } } } },
  })

  await logFlashAudit({
    shipmentId: id,
    actorId: (session.user as { id: string }).id,
    actorRole: "ADMIN",
    action: "DRIVER_ASSIGNED",
    previousStatus: shipment.status,
    newStatus: "ASSIGNED_TO_DRIVER",
    metadata: { driverId },
  })

  return NextResponse.json({ shipment: updated })
}
