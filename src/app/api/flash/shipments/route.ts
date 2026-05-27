import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateFlashAddress } from "@/lib/flash/types"
import { generateQrToken } from "@/lib/flash/qr"
import { logFlashAudit } from "@/lib/flash/audit"
import { adminJson, requireFlashAdmin } from "@/lib/flash/auth"

const shipmentInclude = {
  order: { select: { orderNumber: true, buyer: { select: { name: true, email: true } } } },
  driver: { include: { user: { select: { name: true, email: true } } } },
  attempts: { include: { photos: true }, orderBy: { attemptNumber: "asc" } as const },
  authorizedPeople: { select: { id: true, name: true, dni: true } },
  deliveryProof: true,
  auditLogs: { orderBy: { createdAt: "asc" } as const },
}

// POST — comprador crea envío Flash
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const body = await req.json()
  const { orderId, addressData } = body

  if (!orderId || !addressData) {
    return NextResponse.json({ error: "orderId y addressData son requeridos" }, { status: 400 })
  }

  const errors = validateFlashAddress(addressData)
  if (errors.length > 0) {
    return NextResponse.json({ error: "Datos incompletos", details: errors }, { status: 422 })
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: (session.user as { id: string }).id },
  })
  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })

  const existing = await prisma.flashShipment.findUnique({ where: { orderId } })
  if (existing) return NextResponse.json({ shipment: existing }, { status: 200 })

  const qrToken = generateQrToken()
  const estimated = new Date()
  estimated.setHours(estimated.getHours() + 24)

  const shipment = await prisma.flashShipment.create({
    data: {
      orderId,
      recipientName: addressData.recipientName,
      recipientDni: addressData.recipientDni.replace(/\D/g, ""),
      recipientPhone: addressData.recipientPhone,
      street: addressData.street,
      streetNumber: addressData.streetNumber,
      floor: addressData.floor || null,
      apartment: addressData.apartment || null,
      betweenStreet1: addressData.betweenStreet1,
      betweenStreet2: addressData.betweenStreet2,
      city: addressData.city,
      province: addressData.province,
      postalCode: addressData.postalCode,
      shippingTier: addressData.shippingTier ?? null,
      shippingPrice: addressData.shippingPrice ?? null,
      priorityScore: addressData.priorityScore ?? 50,
      qrToken,
      estimatedDelivery: estimated,
      status: "PAYMENT_CONFIRMED",
    },
  })

  await logFlashAudit({
    shipmentId: shipment.id,
    actorId: (session.user as { id: string }).id,
    actorRole: "SYSTEM",
    action: "SHIPMENT_CREATED",
    newStatus: "PAYMENT_CONFIRMED",
  })

  return NextResponse.json({ shipment }, { status: 201 })
}

// GET — listado (admin panel | vendedor | comprador | chofer)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const role = searchParams.get("role") ?? "buyer"
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 20
  const skip = (page - 1) * limit

  if (role === "admin") {
    const admin = await requireFlashAdmin(req)
    if (admin instanceof NextResponse) return admin

    const [shipments, total] = await Promise.all([
      prisma.flashShipment.findMany({
        where: {},
        include: shipmentInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.flashShipment.count(),
    ])

    return adminJson(admin, {
      shipments,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const userId = (session.user as { id: string }).id

  let where = {}
  if (role === "seller") {
    where = { order: { items: { some: { product: { sellerId: userId } } } } }
  } else if (role === "driver") {
    const driver = await prisma.flashDriver.findUnique({ where: { userId } })
    where = driver ? { driverId: driver.id } : { id: "none" }
  } else {
    where = { order: { buyerId: userId } }
  }

  const [shipments, total] = await Promise.all([
    prisma.flashShipment.findMany({
      where,
      include: shipmentInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.flashShipment.count({ where }),
  ])

  return NextResponse.json({ shipments, total, page, pages: Math.ceil(total / limit) })
}
