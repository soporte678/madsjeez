import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/variations?productId=xxx - Obtener variaciones de un producto
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    const variations = await prisma.productVariation.findMany({
      where: { productId },
      orderBy: { createdAt: "asc" }
    })

    return NextResponse.json({ variations })
  } catch (error) {
    console.error("Error fetching variations:", error)
    return NextResponse.json(
      { error: "Error al obtener variaciones" },
      { status: 500 }
    )
  }
}

// POST /api/variations - Crear variación
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, sku, attributes, price, comparePrice, stock, images } = body

    // Verificar que el producto existe y pertenece al usuario
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { sellerId: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    if (product.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para modificar este producto" },
        { status: 403 }
      )
    }

    const variation = await prisma.productVariation.create({
      data: {
        productId,
        sku,
        attributes,
        price,
        comparePrice,
        stock: stock || 0,
        images: images || []
      }
    })

    return NextResponse.json(variation, { status: 201 })
  } catch (error) {
    console.error("Error creating variation:", error)
    return NextResponse.json(
      { error: "Error al crear variación" },
      { status: 500 }
    )
  }
}
