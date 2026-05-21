import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params

  const shipment = await prisma.flashShipment.findUnique({
    where: { id },
    include: {
      order: { select: { orderNumber: true, buyer: { select: { name: true, email: true } } } },
      driver: { include: { user: { select: { name: true, email: true } } } },
      attempts: { include: { photos: true }, orderBy: { attemptNumber: "asc" } },
      authorizedPeople: true,
      deliveryProof: true,
      auditLogs: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!shipment) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })

  return NextResponse.json({ shipment })
}
