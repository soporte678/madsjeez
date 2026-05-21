import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logFlashAudit } from "@/lib/flash/audit"
import { adminActorId, adminJson, requireFlashAdmin } from "@/lib/flash/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  const { id } = await params
  const { driverId } = await req.json()

  const [shipment, driver] = await Promise.all([
    prisma.flashShipment.findUnique({ where: { id } }),
    prisma.flashDriver.findUnique({ where: { id: driverId } }),
  ])

  if (!shipment) return adminJson(admin, { error: "Envío no encontrado" }, { status: 404 })
  if (!driver) return adminJson(admin, { error: "Chofer no encontrado" }, { status: 404 })
  if (!driver.isActive) return adminJson(admin, { error: "Chofer inactivo" }, { status: 400 })

  const updated = await prisma.flashShipment.update({
    where: { id },
    data: { driverId, status: "ASSIGNED_TO_DRIVER" },
    include: { driver: { include: { user: { select: { name: true, email: true } } } } },
  })

  await logFlashAudit({
    shipmentId: id,
    actorId: adminActorId(admin),
    actorRole: "ADMIN",
    action: "DRIVER_ASSIGNED",
    previousStatus: shipment.status,
    newStatus: "ASSIGNED_TO_DRIVER",
    metadata: { driverId },
  })

  return adminJson(admin, { shipment: updated })
}
