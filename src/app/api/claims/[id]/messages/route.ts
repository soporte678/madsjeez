import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"

// POST /api/claims/[id]/messages - Enviar mensaje en reclamo
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

    // Rate limit: 5 req/min por usuario
    const { allowed, retryAfter } = rateLimit(`claim-msg:${session.user.id}`, 5, 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiados mensajes en poco tiempo. Esperá un momento." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      )
    }

    const { id: claimId } = params
    const body = await request.json()
    const { content, attachments } = body

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "El mensaje no puede estar vacío" },
        { status: 400 }
      )
    }

    // Verificar que el reclamo existe
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      select: { 
        buyerId: true, 
        sellerId: true,
        status: true
      }
    })

    if (!claim) {
      return NextResponse.json(
        { error: "Reclamo no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que el usuario es parte del reclamo
    const isBuyer = claim.buyerId === session.user.id
    const isSeller = claim.sellerId === session.user.id

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: "No tienes acceso a este reclamo" },
        { status: 403 }
      )
    }

    // No permitir mensajes en reclamos cerrados
    if (claim.status === "CLOSED" || claim.status === "CANCELLED") {
      return NextResponse.json(
        { error: "No se pueden enviar mensajes en un reclamo cerrado" },
        { status: 400 }
      )
    }

    const message = await prisma.claimMessage.create({
      data: {
        claimId,
        senderId: session.user.id,
        content: content.trim(),
        attachments: attachments || []
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        }
      }
    })

    // Notificar al otro participante
    const notifyUserId = isBuyer ? claim.sellerId : claim.buyerId
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: "claim",
        topic: "new_message",
        resourceId: claimId,
        title: "Nuevo mensaje en reclamo",
        message: `${session.user.name || "Usuario"} ha enviado un mensaje en el reclamo`
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json(
      { error: "Error al enviar mensaje" },
      { status: 500 }
    )
  }
}
