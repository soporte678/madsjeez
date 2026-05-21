import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logFlashAudit } from "@/lib/flash/audit"
import type { FlashReceiverType } from "@prisma/client"

// POST — chofer confirma entrega exitosa
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params
  const { receiverType, receiverName, receiverDni, photos, attemptId } = await req.json() as {
    receiverType: FlashReceiverType
    receiverName: string
    receiverDni: string
    photos: string[]
    attemptId: string
  }

  if (!receiverType || !receiverName || !receiverDni) {
    return NextResponse.json({ error: "Datos del receptor incompletos" }, { status: 400 })
  }
  if (!photos || photos.length === 0) {
    return NextResponse.json({ error: "Se requiere al menos 1 foto de evidencia" }, { status: 400 })
  }

  const driver = await prisma.flashDriver.findUnique({
    where: { userId: (session.user as { id: string }).id },
  })
  if (!driver) return NextResponse.json({ error: "No sos chofer" }, { status: 403 })

  const shipment = await prisma.flashShipment.findUnique({ where: { id } })
  if (!shipment) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })

  // Validar DNI del titular si corresponde
  if (receiverType === "TITULAR") {
    const dniClean = receiverDni.replace(/\D/g, "")
    if (dniClean !== shipment.recipientDni) {
      return NextResponse.json({ error: "DNI no coincide con el titular del pedido" }, { status: 422 })
    }
  }

  const [proof] = await prisma.$transaction([
    prisma.flashDeliveryProof.create({
      data: {
        shipmentId: id,
        receiverType,
        receiverName,
        receiverDni: receiverDni.replace(/\D/g, ""),
        photos,
      },
    }),
    prisma.flashDeliveryAttempt.update({
      where: { id: attemptId },
      data: { status: "DELIVERED", completedAt: new Date() },
    }),
    prisma.flashShipment.update({
      where: { id },
      data: { status: "DELIVERED" },
    }),
  ])

  await logFlashAudit({
    shipmentId: id,
    actorId: driver.userId,
    actorRole: "DRIVER",
    action: "DELIVERED",
    previousStatus: shipment.status,
    newStatus: "DELIVERED",
    metadata: { receiverType, receiverName },
  })

  return NextResponse.json({ proof })
}
