import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/flash/track/[orderNumber]
 * Endpoint público — no requiere autenticación.
 * Devuelve estado del envío, historial de auditoría y datos básicos de entrega.
 * NO expone datos sensibles del destinatario (solo nombre parcial y ciudad).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params

  const shipment = await prisma.flashShipment.findFirst({
    where: {
      order: { orderNumber },
    },
    select: {
      id: true,
      status: true,
      city: true,
      province: true,
      recipientName: true,
      updatedAt: true,
      createdAt: true,
      driver: {
        select: {
          user: { select: { name: true } },
          vehicleType: true,
          rating: true,
        },
      },
      attempts: {
        select: {
          attemptNumber: true,
          status: true,
          createdAt: true,
        },
        orderBy: { attemptNumber: "asc" },
      },
      auditLogs: {
        select: {
          action: true,
          previousStatus: true,
          newStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      deliveryProof: {
        select: {
          receiverName: true,
          receiverType: true,
          signedAt: true,
          photos: true,
        },
      },
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
  })

  if (!shipment) {
    return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })
  }

  // Parcializar nombre del destinatario por privacidad (ej. "Juan G.")
  const nameParts = shipment.recipientName.trim().split(" ")
  const partialName =
    nameParts.length >= 2
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
      : nameParts[0]

  // Flatten seller data for frontend compatibility
  const seller = shipment.order?.items?.[0]?.product?.seller
  const sellerStoreName = seller?.sellerName ?? seller?.name ?? null

  return NextResponse.json({
    shipment: {
      ...shipment,
      recipientName: partialName,
      order: {
        orderNumber: shipment.order?.orderNumber ?? "",
        seller: {
          storeName: sellerStoreName,
          city: null,
        },
      },
    },
  })
}
