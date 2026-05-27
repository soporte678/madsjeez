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

  const rawShipments = await prisma.flashShipment.findMany({
    where,
    select: {
      id: true,
      status: true,
      city: true,
      province: true,
      street: true,
      streetNumber: true,
      postalCode: true,
      shippingTier: true,
      shippingPrice: true,
      priorityScore: true,
      createdAt: true,
      updatedAt: true,
      order: {
        select: {
          orderNumber: true,
          items: {
            take: 1,
            select: {
              product: {
                select: {
                  seller: {
                    select: {
                      sellerName: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ priorityScore: "desc" }, { createdAt: "asc" }],
    take: 50,
  })

  // Flatten seller data for frontend compatibility
  const shipments = rawShipments.map((s) => {
    const seller = s.order?.items?.[0]?.product?.seller
    return {
      ...s,
      order: {
        orderNumber: s.order?.orderNumber ?? "",
        seller: {
          storeName: seller?.sellerName ?? seller?.name ?? null,
          city: null,
          province: null,
        },
      },
    }
  })

  return NextResponse.json({ shipments })
}
