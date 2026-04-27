import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// PUT /api/variations/[id] - Actualizar variación
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
    const { sku, attributes, price, comparePrice, stock, images, isActive } = body

    // Verificar que la variación existe y pertenece al usuario
    const variation = await prisma.productVariation.findUnique({
      where: { id },
      include: { product: { select: { sellerId: true } } }
    })

    if (!variation) {
      return NextResponse.json(
        { error: "Variación no encontrada" },
        { status: 404 }
      )
    }

    if (variation.product.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para modificar esta variación" },
        { status: 403 }
      )
    }

    const updatedVariation = await prisma.productVariation.update({
      where: { id },
      data: {
        sku,
        attributes,
        price,
        comparePrice,
        stock,
        images,
        isActive
      }
    })

    return NextResponse.json(updatedVariation)
  } catch (error) {
    console.error("Error updating variation:", error)
    return NextResponse.json(
      { error: "Error al actualizar variación" },
      { status: 500 }
    )
  }
}

// DELETE /api/variations/[id] - Eliminar variación
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

    // Verificar que la variación existe y pertenece al usuario
    const variation = await prisma.productVariation.findUnique({
      where: { id },
      include: { product: { select: { sellerId: true } } }
    })

    if (!variation) {
      return NextResponse.json(
        { error: "Variación no encontrada" },
        { status: 404 }
      )
    }

    if (variation.product.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar esta variación" },
        { status: 403 }
      )
    }

    await prisma.productVariation.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting variation:", error)
    return NextResponse.json(
      { error: "Error al eliminar variación" },
      { status: 500 }
    )
  }
}
