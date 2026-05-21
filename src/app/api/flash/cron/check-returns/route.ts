import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logFlashAudit } from "@/lib/flash/audit"

// GET /api/flash/cron/check-returns
// Cron job: marca como RETURNED_TO_SENDER los envíos con 3 intentos fallidos
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const toReturn = await prisma.flashShipment.findMany({
    where: { status: "FAILED_ATTEMPT_3" },
    select: { id: true, status: true },
  })

  let updated = 0
  for (const s of toReturn) {
    await prisma.flashShipment.update({
      where: { id: s.id },
      data: { status: "RETURNED_TO_SENDER" },
    })
    await logFlashAudit({
      shipmentId: s.id,
      actorId: "SYSTEM",
      actorRole: "SYSTEM",
      action: "AUTO_RETURNED_TO_SENDER",
      previousStatus: s.status,
      newStatus: "RETURNED_TO_SENDER",
    })
    updated++
  }

  return NextResponse.json({ updated })
}
