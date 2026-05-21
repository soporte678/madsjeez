import { NextRequest, NextResponse } from "next/server"
import type { FlashDriverDutyStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireFlashDriver } from "@/lib/flash/auth"
import { isPrismaSchemaDriftError } from "@/lib/flash/prisma-safe"

const VALID: FlashDriverDutyStatus[] = ["OFFLINE", "ONLINE", "ON_TRIP", "ON_BREAK"]

export async function PATCH(req: NextRequest) {
  const auth = await requireFlashDriver()
  if (auth instanceof NextResponse) return auth

  let body: { dutyStatus?: FlashDriverDutyStatus; workMode?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const data: { dutyStatus?: FlashDriverDutyStatus; workMode?: string; connectedAt?: Date | null } = {}

  if (body.dutyStatus) {
    if (!VALID.includes(body.dutyStatus)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    }
    data.dutyStatus = body.dutyStatus
    if (body.dutyStatus === "ONLINE") {
      data.connectedAt = new Date()
    }
    if (body.dutyStatus === "OFFLINE") {
      data.connectedAt = null
    }
  }

  if (body.workMode && ["hybrid", "blocks", "on_demand"].includes(body.workMode)) {
    data.workMode = body.workMode
  }

  try {
    const driver = await prisma.flashDriver.update({
      where: { id: auth.driverId },
      data,
      select: { dutyStatus: true, workMode: true, connectedAt: true },
    })
    return NextResponse.json({ driver })
  } catch (e) {
    if (!isPrismaSchemaDriftError(e)) throw e
    return NextResponse.json({
      driver: {
        dutyStatus: data.dutyStatus ?? "OFFLINE",
        workMode: data.workMode ?? "hybrid",
        connectedAt: data.connectedAt ?? null,
      },
      warning: "Migración Flash pendiente; el estado no se guardó en la base.",
    })
  }
}
