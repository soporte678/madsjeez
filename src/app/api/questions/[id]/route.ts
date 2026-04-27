import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// PUT /api/questions/[id] - Responder una pregunta
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
    const { answer } = body

    if (!answer?.trim()) {
      return NextResponse.json(
        { error: "La respuesta es requerida" },
        { status: 400 }
      )
    }

    // Verificar que la pregunta existe y obtener el producto
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        product: {
          select: { sellerId: true, title: true }
        }
      }
    })

    if (!question) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      )
    }

    // Solo el vendedor del producto puede responder
    if (question.product.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "Solo el vendedor puede responder esta pregunta" },
        { status: 403 }
      )
    }

    // Verificar que no esté ya respondida
    if (question.status === "answered") {
      return NextResponse.json(
        { error: "Esta pregunta ya fue respondida" },
        { status: 400 }
      )
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        answer: answer.trim(),
        answeredAt: new Date(),
        answeredBy: session.user.id,
        status: "answered"
      },
      include: {
        buyer: {
          select: { id: true, name: true, image: true }
        },
        product: {
          select: { 
            id: true, 
            title: true, 
            images: true,
            seller: { select: { id: true, name: true } }
          }
        }
      }
    })

    // Notificar al comprador que su pregunta fue respondida
    await prisma.notification.create({
      data: {
        userId: question.buyerId,
        type: "question",
        topic: "question_answered",
        resourceId: question.id,
        title: "Tu pregunta fue respondida",
        message: `El vendedor respondió tu pregunta sobre "${question.product.title}"`
      }
    })

    return NextResponse.json(updatedQuestion)
  } catch (error) {
    console.error("Error answering question:", error)
    return NextResponse.json(
      { error: "Error al responder la pregunta" },
      { status: 500 }
    )
  }
}

// DELETE /api/questions/[id] - Eliminar una pregunta (solo comprador o admin)
export async function DELETE(
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

    const question = await prisma.question.findUnique({
      where: { id },
      select: { buyerId: true, status: true }
    })

    if (!question) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      )
    }

    // Solo el comprador puede eliminar sus preguntas pendientes
    const isBuyer = question.buyerId === session.user.id
    const isAdmin = (session.user as any).role === "ADMIN"
    
    if (!isBuyer && !isAdmin) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar esta pregunta" },
        { status: 403 }
      )
    }

    // No permitir eliminar preguntas ya respondidas (solo admin)
    if (question.status === "answered" && !isAdmin) {
      return NextResponse.json(
        { error: "No puedes eliminar una pregunta que ya fue respondida" },
        { status: 400 }
      )
    }

    await prisma.question.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json(
      { error: "Error al eliminar la pregunta" },
      { status: 500 }
    )
  }
}
