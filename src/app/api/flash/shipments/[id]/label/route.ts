import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateLabelHtml } from "@/lib/flash/label"
import { logFlashAudit } from "@/lib/flash/audit"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params

  const shipment = await prisma.flashShipment.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          buyer: { select: { name: true, email: true } },
          items: { include: { product: { include: { seller: true } } }, take: 1 },
        },
      },
      attempts: { include: { photos: true } },
      authorizedPeople: true,
      deliveryProof: true,
    },
  })

  if (!shipment) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })
  if (shipment.labelPrintCount >= 3) {
    return NextResponse.json({ error: "Límite de impresiones alcanzado (máx 3)" }, { status: 400 })
  }

  const seller = shipment.order?.items?.[0]?.product?.seller
  const sellerName = seller?.sellerName ?? seller?.name ?? "Vendedor"
  const sellerPhone = shipment.order?.items?.[0]?.product?.seller?.email ?? ""

  const shipmentForLabel = {
    ...shipment,
    driver: null,
    attempts: [],
    authorizedPeople: [],
    deliveryProof: null,
    order: shipment.order
      ? {
          orderNumber: shipment.order.orderNumber,
          buyer: shipment.order.buyer,
        }
      : undefined,
  }

  const html = await generateLabelHtml(shipmentForLabel, sellerName, sellerPhone)

  await prisma.flashShipment.update({
    where: { id },
    data: {
      labelPrintCount: { increment: 1 },
      status: shipment.status === "PAYMENT_CONFIRMED" ? "LABEL_GENERATED" : shipment.status,
    },
  })

  await logFlashAudit({
    shipmentId: id,
    actorId: (session.user as { id: string }).id,
    actorRole: "SELLER",
    action: "LABEL_PRINTED",
    previousStatus: shipment.status,
    newStatus: shipment.status === "PAYMENT_CONFIRMED" ? "LABEL_GENERATED" : shipment.status,
  })

  return NextResponse.json({ html })
}
