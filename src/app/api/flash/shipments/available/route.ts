import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFlashDriver } from "@/lib/flash/auth"

/**
 * GET /api/flash/shipments/available
 * Feed de envíos disponibles para repartidores independientes.
 * Filtra por provincia si se pasa ?province=...
 */
export async function GET(req: NextRequest) {
  const auth = await requireFlashDriver()
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const province = searchParams.get("province")

  const where: Record<string, unknown> = {
    status: "AVAILABLE",
    driverId: null,
  }

  if (province) {
    where.province = { contains: province, mode: "insensitive" }
  }

  const shipments = await prisma.flashShipment.findMany({
    where,
    select: {
      id: true,
      status: true,
      city: true,
      province: true,
      // Dirección de entrega (no mostramos datos del destinatario completos por privacidad)
      street: true,
      streetNumber: true,
      postalCode: true,
      createdAt: true,
      updatedAt: true,
      order: {
        select: {
          orderNumber: true,
          seller: {
            select: {
              storeName: true,
              city: true,
              province: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ shipments })
}
