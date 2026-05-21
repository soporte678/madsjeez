import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import {
  listMergedSellerPublications,
  parseSellerPublicationQuery,
} from "@/lib/dashboard/seller-publications-query"

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20))
    const q = parseSellerPublicationQuery(searchParams)

    const userId = session.user.id
    const supabase = getSupabaseClient()
    const { data: supabaseUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", session.user.email)
      .maybeSingle()

    const { products, total, totalPages, page: outPage } = await listMergedSellerPublications({
      prisma,
      supabase,
      prismaUserId: userId,
      supabaseUserId: supabaseUser?.id ?? null,
      q,
      page,
      limit,
    })

    const productsOut = products.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      sku: p.sku,
      price: p.price,
      originalPrice: p.originalPrice,
      stock: p.stock,
      isActive: p.isActive,
      views: p.views,
      sales: p.sales,
      condition: p.condition,
      freeShipping: p.freeShipping,
      shippingCost: p.shippingCost,
      qualityScore: p.qualityScore,
      categoryId: p.categoryId,
      category: p.category ? { id: p.category.id, name: p.category.name } : null,
      images:
        p.images?.length && (p.images[0]?.url || "").length > 0
          ? p.images
          : [{ url: "https://via.placeholder.com/48" }],
      createdAt: p.createdAt,
      updatedAt: p.createdAt,
    }))

    const prismaActive = await prisma.product.count({ where: { sellerId: userId, isActive: true } })
    const prismaPaused = await prisma.product.count({ where: { sellerId: userId, isActive: false } })
    const prismaLowStock = await prisma.product.count({ where: { sellerId: userId, stock: { lte: 5 } } })
    const prismaNoSales = await prisma.product.count({ where: { sellerId: userId, sales: 0 } })

    let supabaseActive = 0,
      supabasePaused = 0,
      supabaseLowStock = 0,
      supabaseNoSales = 0
    if (supabaseUser?.id) {
      const { count: a } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", supabaseUser.id)
        .eq("is_active", true)
      const { count: pa } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", supabaseUser.id)
        .eq("is_active", false)
      const { count: l } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", supabaseUser.id)
        .lte("stock", 5)
      const { count: n } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", supabaseUser.id)
        .eq("sales", 0)
      supabaseActive = a || 0
      supabasePaused = pa || 0
      supabaseLowStock = l || 0
      supabaseNoSales = n || 0
    }

    const prismaTop = await prisma.product.findMany({
      where: { sellerId: userId },
      orderBy: { sales: "desc" },
      take: 5,
      select: { id: true, title: true, sales: true, price: true, views: true },
    })

    let supabaseTop: { id: string; title: string; sales: number; price: number; views: number }[] = []
    if (supabaseUser?.id) {
      const { data: sbTop } = await supabase
        .from("products")
        .select("id, title, sales, price, views")
        .eq("seller_id", supabaseUser.id)
        .order("sales", { ascending: false })
        .limit(5)
      supabaseTop = (sbTop || []).map((p: Record<string, unknown>) => ({
        id: String(p.id),
        title: String(p.title),
        sales: Number(p.sales ?? 0),
        price: Number(p.price ?? 0),
        views: Number(p.views ?? 0),
      }))
    }

    const topProducts = [...prismaTop, ...supabaseTop]
      .sort((a, b) => (b.sales || 0) - (a.sales || 0))
      .slice(0, 5)

    return NextResponse.json({
      products: productsOut,
      total,
      page: outPage,
      totalPages,
      summary: {
        active: prismaActive + supabaseActive,
        paused: prismaPaused + supabasePaused,
        lowStock: prismaLowStock + supabaseLowStock,
        noSales: prismaNoSales + supabaseNoSales,
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
