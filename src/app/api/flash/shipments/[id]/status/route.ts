import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logFlashAudit } from "@/lib/flash/audit"
import { adminActorId, adminJson, requireFlashAdmin } from "@/lib/flash/auth"
import type { FlashShipmentStatus } from "@prisma/client"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  const { id } = await params
  const { status } = (await req.json()) as { status: FlashShipmentStatus }

  const shipment = await prisma.flashShipment.findUnique({ where: { id } })
  if (!shipment) return adminJson(admin, { error: "Envío no encontrado" }, { status: 404 })

  const updated = await prisma.flashShipment.update({
    where: { id },
    data: { status },
  })

  await logFlashAudit({
    shipmentId: id,
    actorId: adminActorId(admin),
    actorRole: "ADMIN",
    action: "STATUS_UPDATED",
    previousStatus: shipment.status,
    newStatus: status,
  })

  return adminJson(admin, { shipment: updated })
}
