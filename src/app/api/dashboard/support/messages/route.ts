import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET: Obtener mensajes de un ticket
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get("ticketId")

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId requerido" }, { status: 400 })
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 })
    }

    const messages = await prisma.supportMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { name: true, image: true },
        },
      },
    })

    return NextResponse.json({ messages, ticket })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 })
  }
}

// POST: Enviar un mensaje en un ticket
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    if (!body.ticketId || !body.content) {
      return NextResponse.json({ error: "ticketId y content son requeridos" }, { status: 400 })
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: body.ticketId, userId },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 })
    }

    const message = await prisma.supportMessage.create({
      data: {
        content: body.content,
        isAgent: false,
        ticketId: body.ticketId,
        senderId: userId,
      },
      include: {
        sender: {
          select: { name: true, image: true },
        },
      },
    })

    // Reabrir ticket si estaba cerrado/resuelto
    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
      await prisma.supportTicket.update({
        where: { id: body.ticketId },
        data: { status: "OPEN", resolvedAt: null },
      })
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 })
  }
}
