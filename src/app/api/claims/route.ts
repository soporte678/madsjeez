import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"

// GET /api/claims - Listar reclamos
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
    const asBuyer = searchParams.get("asBuyer") === "true"
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (asBuyer) {
      where.buyerId = session.user.id
    } else {
      where.sellerId = session.user.id
    }
    
    if (status) {
      where.status = status
    }

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          buyer: {
            select: { id: true, name: true, image: true }
          },
          seller: {
            select: { id: true, name: true, image: true }
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              items: {
                include: {
                  product: {
                    select: { id: true, title: true, images: true }
                  }
                }
              }
            }
          },
          _count: {
            select: { claimMessages: true }
          }
        }
      }),
      prisma.claim.count({ where })
    ])

    return NextResponse.json({
      claims,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("Error fetching claims:", error)
    return NextResponse.json(
      { error: "Error al obtener reclamos" },
      { status: 500 }
    )
  }
}

// POST /api/claims - Crear reclamo
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Rate limit: 5 req/min por usuario
    const { allowed, retryAfter } = rateLimit(`claims:${session.user.id}`, 5, 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiados reclamos en poco tiempo. Esperá un momento." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      )
    }

    const body = await request.json()
    const { orderId, type, reason, description, images } = body

    if (!orderId || !type || !reason || !description) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      )
    }

    // Verificar que la orden existe y pertenece al usuario
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: { sellerId: true }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      )
    }

    if (order.buyerId !== session.user.id) {
      return NextResponse.json(
        { error: "No puedes crear un reclamo para esta orden" },
        { status: 403 }
      )
    }

    // Verificar que no existe un reclamo activo para esta orden
    const existingClaim = await prisma.claim.findFirst({
      where: {
        orderId,
        status: { in: ["OPEN", "IN_REVIEW"] }
      }
    })

    if (existingClaim) {
      return NextResponse.json(
        { error: "Ya existe un reclamo activo para esta orden" },
        { status: 400 }
      )
    }

    // El seller es el del primer item (asumiendo una orden de un solo vendedor)
    const sellerId = order.items[0]?.product.sellerId

    if (!sellerId) {
      return NextResponse.json(
        { error: "No se pudo determinar el vendedor" },
        { status: 400 }
      )
    }

    const claim = await prisma.claim.create({
      data: {
        orderId,
        buyerId: session.user.id,
        sellerId,
        type,
        reason,
        description,
        images: images || [],
        status: "OPEN"
      },
      include: {
        buyer: {
          select: { id: true, name: true, image: true }
        },
        seller: {
          select: { id: true, name: true, image: true }
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true
          }
        }
      }
    })

    // Notificar al vendedor
    await prisma.notification.create({
      data: {
        userId: sellerId,
        type: "claim",
        topic: "new_claim",
        resourceId: claim.id,
        title: "Nuevo reclamo recibido",
        message: `El comprador ha iniciado un reclamo para la orden #${order.orderNumber}`
      }
    })

    return NextResponse.json(claim, { status: 201 })
  } catch (error) {
    console.error("Error creating claim:", error)
    return NextResponse.json(
      { error: "Error al crear reclamo" },
      { status: 500 }
    )
  }
}
