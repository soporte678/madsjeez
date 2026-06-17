import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST — sube hasta 5 fotos a un intento de entrega
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params
  const { attemptId, photos } = await req.json() as { attemptId: string; photos: string[] }

  if (!attemptId || !photos?.length) {
    return NextResponse.json({ error: "attemptId y photos son requeridos" }, { status: 400 })
  }

  const driver = await prisma.flashDriver.findUnique({
    where: { userId: (session.user as { id: string }).id },
  })
  if (!driver) return NextResponse.json({ error: "No sos chofer" }, { status: 403 })

  const attempt = await prisma.flashDeliveryAttempt.findUnique({
    where: { id: attemptId },
    select: { id: true, driverId: true, shipmentId: true },
  })
  if (!attempt) return NextResponse.json({ error: "Intento no encontrado" }, { status: 404 })
  if (attempt.driverId !== driver.id || attempt.shipmentId !== id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const existing = await prisma.flashAttemptPhoto.count({ where: { attemptId } })
  if (existing + photos.length > 5) {
    return NextResponse.json({ error: `Máximo 5 fotos por intento (ya tenés ${existing})` }, { status: 400 })
  }

  const created = await prisma.flashAttemptPhoto.createMany({
    data: photos.map((url: string) => ({ attemptId, url })),
  })

  return NextResponse.json({ count: created.count })
}
