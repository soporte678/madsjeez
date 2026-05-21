import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logFlashAudit } from "@/lib/flash/audit"
import type { FlashShipmentStatus } from "@prisma/client"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params
  const { status } = await req.json() as { status: FlashShipmentStatus }

  const shipment = await prisma.flashShipment.findUnique({ where: { id } })
  if (!shipment) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })

  const updated = await prisma.flashShipment.update({
    where: { id },
    data: { status },
  })

  await logFlashAudit({
    shipmentId: id,
    actorId: (session.user as { id: string }).id,
    actorRole: "ADMIN",
    action: "STATUS_UPDATED",
    previousStatus: shipment.status,
    newStatus: status,
  })

  return NextResponse.json({ shipment: updated })
}
