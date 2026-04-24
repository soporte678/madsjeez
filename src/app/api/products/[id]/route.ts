import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: { order: "asc" } },
        attributes: true,
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            sellerName: true,
            reputationColor: true,
            totalSales: true,
            sellerSince: true,
            subscriptionTier: true,
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                name: true,
                image: true,
              }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: { reviews: true }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    // Incrementar contador de vistas
    await prisma.product.update({
      where: { id: params.id },
      data: { views: { increment: 1 } }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Error al cargar producto" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { title, description, price, stock, isActive } = body

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        title,
        description,
        price: price ? parseFloat(price) : undefined,
        stock: stock ? parseInt(stock) : undefined,
        isActive,
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.product.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Producto eliminado" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 }
    )
  }
}
