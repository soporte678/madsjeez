import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ClaimStatus } from "@prisma/client"

const RESOLUTION_ALLOWED_STATUSES = new Set<ClaimStatus>([
  ClaimStatus.IN_REVIEW,
  ClaimStatus.RESOLVED,
  ClaimStatus.CLOSED,
  ClaimStatus.CANCELLED,
]);

// GET /api/claims/[id] - Obtener detalle de reclamo
export async function GET(
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

    const claim = await prisma.claim.findUnique({
      where: { id },
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
            status: true,
            items: {
              include: {
                product: {
                  select: { id: true, title: true, images: true, price: true }
                }
              }
            }
          }
        },
        claimMessages: {
          include: {
            sender: {
              select: { id: true, name: true, image: true }
            }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    })

    if (!claim) {
      return NextResponse.json(
        { error: "Reclamo no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que el usuario es parte del reclamo
    if (claim.buyerId !== session.user.id && claim.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes acceso a este reclamo" },
        { status: 403 }
      )
    }

    return NextResponse.json(claim)
  } catch (error) {
    console.error("Error fetching claim:", error)
    return NextResponse.json(
      { error: "Error al obtener reclamo" },
      { status: 500 }
    )
  }
}

// PUT /api/claims/[id] - Actualizar reclamo (resolución)
export async function PUT(
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
    const { status, resolution, resolutionNotes, refundAmount } = body
    if (status && !RESOLUTION_ALLOWED_STATUSES.has(status as ClaimStatus)) {
      return NextResponse.json(
        { error: "Estado de reclamo invalido" },
        { status: 400 }
      )
    }
    if (refundAmount != null && (!Number.isFinite(Number(refundAmount)) || Number(refundAmount) < 0)) {
      return NextResponse.json(
        { error: "Monto de reembolso invalido" },
        { status: 400 }
      )
    }

    const claim = await prisma.claim.findUnique({
      where: { id },
      select: { 
        sellerId: true, 
        buyerId: true,
        orderId: true,
        status: true 
      }
    })

    if (!claim) {
      return NextResponse.json(
        { error: "Reclamo no encontrado" },
        { status: 404 }
      )
    }

    const isSeller = claim.sellerId === session.user.id
    const isAdmin = (session.user as { role?: string }).role === "ADMIN"

    // Solo el vendedor o admin pueden resolver
    if (!isSeller && !isAdmin) {
      return NextResponse.json(
        { error: "No tienes permiso para resolver este reclamo" },
        { status: 403 }
      )
    }

    const updatedClaim = await prisma.claim.update({
      where: { id },
      data: {
        status: (status as ClaimStatus | undefined) ?? claim.status,
        resolution: typeof resolution === "string" ? resolution : undefined,
        resolutionNotes: typeof resolutionNotes === "string" ? resolutionNotes : undefined,
        refundAmount: refundAmount == null ? undefined : Number(refundAmount),
        resolvedAt: new Date(),
        resolvedBy: session.user.id
      }
    })

    // Notificar al comprador de la resolución
    await prisma.notification.create({
      data: {
        userId: claim.buyerId,
        type: "claim",
        topic: "claim_resolved",
        resourceId: id,
        title: "Tu reclamo fue resuelto",
        message: `El vendedor ha resuelto tu reclamo con la siguiente resolución: ${resolution}`
      }
    })

    return NextResponse.json(updatedClaim)
  } catch (error) {
    console.error("Error updating claim:", error)
    return NextResponse.json(
      { error: "Error al actualizar reclamo" },
      { status: 500 }
    )
  }
}
