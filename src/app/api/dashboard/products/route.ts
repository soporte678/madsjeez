import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: any = { sellerId: userId }
    if (status === "active") where.isActive = true
    if (status === "paused") where.isActive = false
    if (status === "low_stock") where.stock = { lte: 5 }
    if (status === "no_sales") where.sales = 0

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          category: { select: { name: true } },
          images: { select: { url: true }, take: 1 },
        },
      }),
      prisma.product.count({ where }),
    ])

    // Resumen
    const [activeCount, pausedCount, lowStockCount, noSalesCount] = await Promise.all([
      prisma.product.count({ where: { sellerId: userId, isActive: true } }),
      prisma.product.count({ where: { sellerId: userId, isActive: false } }),
      prisma.product.count({ where: { sellerId: userId, stock: { lte: 5 } } }),
      prisma.product.count({ where: { sellerId: userId, sales: 0 } }),
    ])

    // Productos más vendidos
    const topProducts = await prisma.product.findMany({
      where: { sellerId: userId },
      orderBy: { sales: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        sales: true,
        price: true,
        views: true,
      },
    })

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: {
        active: activeCount,
        paused: pausedCount,
        lowStock: lowStockCount,
        noSales: noSalesCount,
      },
      topProducts,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    const product = await prisma.product.create({
      data: {
        title: body.title || body.name,
        description: body.description || "",
        sku: body.sku || `SKU-${Date.now()}`,
        price: parseFloat(body.price),
        originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : null,
        stock: parseInt(body.stock) || 0,
        categoryId: body.categoryId || null,
        sellerId: userId,
        condition: body.condition || "new",
        freeShipping: body.freeShipping || false,
        shippingCost: body.shippingCost ? parseFloat(body.shippingCost) : 0,
        qualityScore: 0,
        isActive: true,
      },
    })

    if (body.images && body.images.length > 0) {
      await prisma.productImage.createMany({
        data: body.images.map((url: string, idx: number) => ({
          productId: product.id,
          url,
          order: idx,
        })),
      })
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const existing = await prisma.product.findFirst({
      where: { id, sellerId: userId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.name !== undefined) updateData.title = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.sku !== undefined) updateData.sku = data.sku
    if (data.price !== undefined) updateData.price = parseFloat(data.price)
    if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice ? parseFloat(data.originalPrice) : null
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock)
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.condition !== undefined) updateData.condition = data.condition
    if (data.freeShipping !== undefined) updateData.freeShipping = data.freeShipping
    if (data.shippingCost !== undefined) updateData.shippingCost = parseFloat(data.shippingCost)
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    })

    // Actualizar imágenes si se proporcionan
    if (data.images !== undefined) {
      await prisma.productImage.deleteMany({ where: { productId: id } })
      if (data.images.length > 0) {
        await prisma.productImage.createMany({
          data: data.images.map((url: string, idx: number) => ({
            productId: id,
            url,
            order: idx,
          })),
        })
      }
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const existing = await prisma.product.findFirst({
      where: { id, sellerId: userId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 })
  }
}
