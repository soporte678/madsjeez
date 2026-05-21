import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { isMarketplaceAdminEmail } from "@/lib/admin-api"

async function assertCanManageProduct(productId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    }
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, sellerId: true },
  })

  if (!product) {
    return {
      error: NextResponse.json({ error: "Producto no encontrado" }, { status: 404 }),
    }
  }

  const isAdmin = await isMarketplaceAdminEmail(session.user.email)
  if (!isAdmin && product.sellerId !== session.user.id) {
    return {
      error: NextResponse.json({ error: "No tienes permiso para modificar este producto" }, { status: 403 }),
    }
  }

  return { session, product }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
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
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const access = await assertCanManageProduct(id)
    if (access.error) return access.error

    const body = await req.json()
    const { title, description, price, stock, isActive } = body

    const product = await prisma.product.update({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const access = await assertCanManageProduct(id)
    if (access.error) return access.error

    await prisma.product.delete({
      where: { id }
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
