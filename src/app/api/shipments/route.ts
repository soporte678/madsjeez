import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/shipments?orderId=xxx - Obtener envío de una orden
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID es requerido" },
        { status: 400 }
      )
    }

    // Verificar que el usuario tiene acceso a esta orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { buyerId: true }
    })

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      )
    }

    const hasAccess = order.buyerId === session.user.id || 
      await prisma.orderItem.findFirst({
        where: {
          orderId,
          product: { sellerId: session.user.id }
        }
      })

    if (!hasAccess) {
      return NextResponse.json(
        { error: "No tienes acceso a este envío" },
        { status: 403 }
      )
    }

    const shipment = await prisma.shipment.findUnique({
      where: { orderId },
      include: {
        events: {
          orderBy: { timestamp: "desc" }
        }
      }
    })

    if (!shipment) {
      return NextResponse.json(
        { error: "Envío no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(shipment)
  } catch (error) {
    console.error("Error fetching shipment:", error)
    return NextResponse.json(
      { error: "Error al obtener envío" },
      { status: 500 }
    )
  }
}

// POST /api/shipments - Crear envío
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      orderId, 
      carrier, 
      carrierName, 
      trackingNumber,
      estimatedDelivery,
      shippingAddress 
    } = body

    if (!orderId || !carrier) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      )
    }

    // Verificar que el usuario es el vendedor de la orden
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        orderId,
        product: { sellerId: session.user.id }
      }
    })

    if (!orderItem) {
      return NextResponse.json(
        { error: "No tienes permiso para crear este envío" },
        { status: 403 }
      )
    }

    const shipment = await prisma.shipment.create({
      data: {
        orderId,
        carrier,
        carrierName,
        trackingNumber,
        status: "pending",
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        shippingAddress
      }
    })

    // Crear evento inicial
    await prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        status: "pending",
        description: "Envío creado, pendiente de preparación",
        timestamp: new Date()
      }
    })

    // Notificar al comprador
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { buyerId: true, orderNumber: true }
    })

    if (order) {
      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: "order",
          topic: "shipment_created",
          resourceId: orderId,
          title: "Envío creado",
          message: `Se ha creado el envío para tu orden #${order.orderNumber}`
        }
      })
    }

    return NextResponse.json(shipment, { status: 201 })
  } catch (error) {
    console.error("Error creating shipment:", error)
    return NextResponse.json(
      { error: "Error al crear envío" },
      { status: 500 }
    )
  }
}
