import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET: Listar tickets del usuario
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: any = { userId }
    if (status && status !== "all") {
      where.status = status
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            items: {
              take: 1,
              include: {
                product: {
                  select: {
                    title: true,
                    images: { select: { url: true }, take: 1 },
                  },
                },
              },
            },
          },
        },
      },
    })

    // Contar por estado
    const [openCount, inProgressCount, resolvedCount, closedCount] = await Promise.all([
      prisma.supportTicket.count({ where: { userId, status: "OPEN" } }),
      prisma.supportTicket.count({ where: { userId, status: "IN_PROGRESS" } }),
      prisma.supportTicket.count({ where: { userId, status: "RESOLVED" } }),
      prisma.supportTicket.count({ where: { userId, status: "CLOSED" } }),
    ])

    return NextResponse.json({
      tickets,
      summary: {
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount,
        total: openCount + inProgressCount + resolvedCount + closedCount,
      },
    })
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json({ error: "Error al obtener consultas" }, { status: 500 })
  }
}

// POST: Crear un nuevo ticket
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    if (!body.subject || !body.message) {
      return NextResponse.json({ error: "Asunto y mensaje son requeridos" }, { status: 400 })
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        subject: body.subject,
        category: body.category || "OTROS",
        userId,
        orderId: body.orderId || null,
        messages: {
          create: {
            content: body.message,
            isAgent: false,
            senderId: userId,
          },
        },
      },
      include: {
        messages: true,
      },
    })

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error("Error creating ticket:", error)
    return NextResponse.json({ error: "Error al crear consulta" }, { status: 500 })
  }
}

// PATCH: Cerrar/reabrir un ticket
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const existing = await prisma.supportTicket.findFirst({
      where: { id: body.id, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 })
    }

    const updateData: any = {}
    if (body.status) {
      updateData.status = body.status
      if (body.status === "RESOLVED" || body.status === "CLOSED") {
        updateData.resolvedAt = new Date()
      }
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: body.id },
      data: updateData,
    })

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error("Error updating ticket:", error)
    return NextResponse.json({ error: "Error al actualizar consulta" }, { status: 500 })
  }
}
