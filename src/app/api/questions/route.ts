import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/questions - Listar preguntas
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    
    const productId = searchParams.get("productId")
    const sellerId = searchParams.get("sellerId")
    const status = searchParams.get("status") // pending, answered, all
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (productId) {
      where.productId = productId
    }
    
    if (sellerId) {
      where.product = { sellerId }
    }
    
    if (status && status !== "all") {
      where.status = status
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
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
      }),
      prisma.question.count({ where })
    ])

    // Si hay usuario logueado, marcar cuáles son sus preguntas
    const questionsWithOwnership = questions.map((q: any) => ({
      ...q,
      isBuyer: session?.user?.id === q.buyerId,
      isSeller: session?.user?.id === q.product.seller?.id
    }))

    return NextResponse.json({
      questions: questionsWithOwnership,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json(
      { error: "Error al obtener preguntas" },
      { status: 500 }
    )
  }
}

// POST /api/questions - Crear una pregunta
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para hacer una pregunta" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, question } = body

    if (!productId || !question?.trim()) {
      return NextResponse.json(
        { error: "Producto y pregunta son requeridos" },
        { status: 400 }
      )
    }

    // Verificar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, sellerId: true, title: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    // No permitir preguntar sobre productos propios
    if (product.sellerId === session.user.id) {
      return NextResponse.json(
        { error: "No puedes hacer preguntas sobre tus propios productos" },
        { status: 400 }
      )
    }

    const newQuestion = await prisma.question.create({
      data: {
        productId,
        buyerId: session.user.id,
        question: question.trim(),
        status: "pending"
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

    // Crear notificación para el vendedor
    await prisma.notification.create({
      data: {
        userId: product.sellerId,
        type: "question",
        topic: "new_question",
        resourceId: newQuestion.id,
        title: "Nueva pregunta sobre tu producto",
        message: `Te han hecho una pregunta sobre "${product.title}"`
      }
    })

    return NextResponse.json(newQuestion, { status: 201 })
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json(
      { error: "Error al crear la pregunta" },
      { status: 500 }
    )
  }
}
