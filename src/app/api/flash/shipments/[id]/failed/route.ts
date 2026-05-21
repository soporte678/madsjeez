import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logFlashAudit } from "@/lib/flash/audit"
import type { FlashShipmentStatus } from "@prisma/client"

const FAILED_STATUS: Record<number, FlashShipmentStatus> = {
  1: "FAILED_ATTEMPT_1",
  2: "FAILED_ATTEMPT_2",
  3: "FAILED_ATTEMPT_3",
}
const PENDING_STATUS: Record<number, FlashShipmentStatus> = {
  1: "PENDING_VISIT_2",
  2: "PENDING_VISIT_3",
}

// POST — chofer registra visita fallida (cliente no encontrado)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params
  const { attemptId, notes, photos, arrivedAt } = await req.json()

  const driver = await prisma.flashDriver.findUnique({
    where: { userId: (session.user as { id: string }).id },
  })
  if (!driver) return NextResponse.json({ error: "No sos chofer" }, { status: 403 })

  const attempt = await prisma.flashDeliveryAttempt.findUnique({ where: { id: attemptId } })
  if (!attempt) return NextResponse.json({ error: "Intento no encontrado" }, { status: 404 })

  // Validar 10 minutos de espera
  const arrivedTime = attempt.arrivedAt ? new Date(attempt.arrivedAt) : new Date(arrivedAt)
  const waitedMs = Date.now() - arrivedTime.getTime()
  const tenMinutesMs = 10 * 60 * 1000
  if (waitedMs < tenMinutesMs) {
    const remaining = Math.ceil((tenMinutesMs - waitedMs) / 60000)
    return NextResponse.json(
      { error: `Debés esperar ${remaining} minuto(s) más antes de registrar cliente no encontrado` },
      { status: 400 }
    )
  }

  const shipment = await prisma.flashShipment.findUnique({ where: { id } })
  if (!shipment) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })

  const attemptNumber = attempt.attemptNumber
  const failedStatus = FAILED_STATUS[attemptNumber]
  const nextStatus: FlashShipmentStatus =
    attemptNumber >= 3 ? "RETURNED_TO_SENDER" : PENDING_STATUS[attemptNumber]

  await prisma.$transaction([
    prisma.flashDeliveryAttempt.update({
      where: { id: attemptId },
      data: {
        status: "CLIENT_NOT_FOUND",
        completedAt: new Date(),
        notes,
      },
    }),
    ...(photos?.length
      ? [
          prisma.flashAttemptPhoto.createMany({
            data: photos.map((url: string) => ({ attemptId, url })),
          }),
        ]
      : []),
    prisma.flashShipment.update({
      where: { id },
      data: { status: nextStatus },
    }),
  ])

  await logFlashAudit({
    shipmentId: id,
    actorId: driver.userId,
    actorRole: "DRIVER",
    action: `CLIENT_NOT_FOUND_ATTEMPT_${attemptNumber}`,
    previousStatus: shipment.status,
    newStatus: nextStatus,
    metadata: { attemptNumber, notes },
  })

  return NextResponse.json({
    status: nextStatus,
    failedStatus,
    isReturned: nextStatus === "RETURNED_TO_SENDER",
    message:
      nextStatus === "RETURNED_TO_SENDER"
        ? "3er intento fallido — paquete marcado para devolución al remitente"
        : `Visita ${attemptNumber} registrada — se reagendará una nueva visita`,
  })
}
