import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const ALLOWED_SHIPMENT_STATUS = new Set([
  "pending",
  "ready_to_ship",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
]);

type ShipmentOrderItem = { product: { sellerId: string } };

// PATCH /api/shipments/[id] - Actualizar estado de envío
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { status, trackingNumber, labelUrl } = body
    if (status && !ALLOWED_SHIPMENT_STATUS.has(String(status))) {
      return NextResponse.json(
        { error: "Estado de envio invalido" },
        { status: 400 }
      )
    }

    // Verificar que el envío existe
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        order: {
          select: { 
            id: true, 
            buyerId: true, 
            orderNumber: true,
            items: {
              include: {
                product: { select: { sellerId: true } }
              }
            }
          }
        }
      }
    })

    if (!shipment) {
      return NextResponse.json(
        { error: "Envío no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que el usuario es el vendedor
    const isSeller = shipment.order.items.some(
      (item: ShipmentOrderItem) => item.product.sellerId === session.user.id
    )

    if (!isSeller) {
      return NextResponse.json(
        { error: "No tienes permiso para actualizar este envío" },
        { status: 403 }
      )
    }

    const updateData: {
      status?: string;
      trackingNumber?: string;
      labelUrl?: string;
      labelGeneratedAt?: Date;
    } = {}
    if (status) updateData.status = status
    if (trackingNumber) updateData.trackingNumber = trackingNumber
    if (labelUrl) {
      updateData.labelUrl = labelUrl
      updateData.labelGeneratedAt = new Date()
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id },
      data: updateData
    })

    // Crear evento de tracking
    const statusDescriptions: Record<string, string> = {
      ready_to_ship: "Paquete listo para envío",
      shipped: "Paquete enviado",
      in_transit: "En tránsito",
      out_for_delivery: "En camino a domicilio",
      delivered: "Entregado",
      exception: "Problema con el envío"
    }

    if (status) {
      await prisma.shipmentEvent.create({
        data: {
          shipmentId: id,
          status,
          description: statusDescriptions[status] || `Estado actualizado a: ${status}`,
          timestamp: new Date()
        }
      })

      // Notificar al comprador
      await prisma.notification.create({
        data: {
          userId: shipment.order.buyerId,
          type: "order",
          topic: "shipment_updated",
          resourceId: shipment.order.id,
          title: "Actualización de envío",
          message: `Tu orden #${shipment.order.orderNumber}: ${statusDescriptions[status] || status}`
        }
      })
    }

    return NextResponse.json(updatedShipment)
  } catch (error) {
    console.error("Error updating shipment:", error)
    return NextResponse.json(
      { error: "Error al actualizar envío" },
      { status: 500 }
    )
  }
}

// POST /api/shipments/[id]/events - Agregar evento de tracking
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id: shipmentId } = params
    const body = await request.json()
    const { status, description, location } = body
    if (!status || !ALLOWED_SHIPMENT_STATUS.has(String(status))) {
      return NextResponse.json(
        { error: "Estado de envio invalido" },
        { status: 400 }
      )
    }
    if (!description || !String(description).trim()) {
      return NextResponse.json(
        { error: "Descripcion requerida" },
        { status: 400 }
      )
    }

    // Verificar que el envío existe y pertenece al vendedor
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
          select: { 
            id: true, 
            buyerId: true, 
            orderNumber: true,
            items: {
              include: {
                product: { select: { sellerId: true } }
              }
            }
          }
        }
      }
    })

    if (!shipment) {
      return NextResponse.json(
        { error: "Envío no encontrado" },
        { status: 404 }
      )
    }

    const isSeller = shipment.order.items.some(
      (item: ShipmentOrderItem) => item.product.sellerId === session.user.id
    )

    if (!isSeller) {
      return NextResponse.json(
        { error: "No tienes permiso" },
        { status: 403 }
      )
    }

    const event = await prisma.shipmentEvent.create({
      data: {
        shipmentId,
        status,
        description,
        location,
        timestamp: new Date()
      }
    })

    // Si es entrega, actualizar el envío
    if (status === "delivered") {
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: {
          status: "delivered",
          deliveredAt: new Date()
        }
      })
    }

    // Notificar al comprador
    await prisma.notification.create({
      data: {
        userId: shipment.order.buyerId,
        type: "order",
        topic: "shipment_event",
        resourceId: shipment.order.id,
        title: "Actualización de envío",
        message: `${description}${location ? ` - ${location}` : ""}`
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { error: "Error al crear evento" },
      { status: 500 }
    )
  }
}
