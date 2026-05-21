import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFlashDriver } from "@/lib/flash/auth"

export async function GET() {
  const auth = await requireFlashDriver()
  if (auth instanceof NextResponse) return auth

  const now = new Date()
  const blocks = await prisma.flashDriverBlock.findMany({
    where: {
      OR: [
        { status: "AVAILABLE", startsAt: { gte: now } },
        { driverId: auth.driverId },
      ],
    },
    orderBy: { startsAt: "asc" },
    take: 20,
  })

  return NextResponse.json({ blocks })
}

export async function POST(req: NextRequest) {
  const auth = await requireFlashDriver()
  if (auth instanceof NextResponse) return auth

  const { blockId, action } = await req.json()
  if (!blockId || !action) {
    return NextResponse.json({ error: "blockId y action requeridos" }, { status: 400 })
  }

  const block = await prisma.flashDriverBlock.findUnique({ where: { id: blockId } })
  if (!block) return NextResponse.json({ error: "Bloque no encontrado" }, { status: 404 })

  if (action === "reserve" && block.status === "AVAILABLE") {
    const updated = await prisma.flashDriverBlock.update({
      where: { id: blockId },
      data: { status: "RESERVED", driverId: auth.driverId },
    })
    return NextResponse.json({ block: updated })
  }

  if (action === "cancel" && block.driverId === auth.driverId) {
    const updated = await prisma.flashDriverBlock.update({
      where: { id: blockId },
      data: { status: "CANCELLED", driverId: null },
    })
    return NextResponse.json({ block: updated })
  }

  return NextResponse.json({ error: "Acción no permitida" }, { status: 400 })
}
