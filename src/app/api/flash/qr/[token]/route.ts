import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildGoogleMapsUrl } from "@/lib/flash/types"

// GET /api/flash/qr/[token] — chofer escanea QR, recibe datos del pedido
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { token } = await params

  const shipment = await prisma.flashShipment.findUnique({
    where: { qrToken: token },
    include: {
      order: { select: { orderNumber: true } },
      attempts: { include: { photos: true }, orderBy: { attemptNumber: "asc" } },
      authorizedPeople: true,
      deliveryProof: true,
      driver: { include: { user: { select: { name: true } } } },
    },
  })

  if (!shipment) return NextResponse.json({ error: "QR inválido o expirado" }, { status: 404 })

  const driver = await prisma.flashDriver.findUnique({
    where: { userId: (session.user as { id: string }).id },
  })
  if (!driver) return NextResponse.json({ error: "No sos chofer" }, { status: 403 })
  if (shipment.driverId !== driver.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const mapsUrl = buildGoogleMapsUrl({
    recipientName: shipment.recipientName,
    recipientDni: shipment.recipientDni,
    recipientPhone: shipment.recipientPhone,
    street: shipment.street,
    streetNumber: shipment.streetNumber,
    floor: shipment.floor ?? undefined,
    apartment: shipment.apartment ?? undefined,
    betweenStreet1: shipment.betweenStreet1,
    betweenStreet2: shipment.betweenStreet2,
    city: shipment.city,
    province: shipment.province,
    postalCode: shipment.postalCode,
  })

  return NextResponse.json({ shipment, mapsUrl })
}
