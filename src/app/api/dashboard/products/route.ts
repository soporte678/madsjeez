import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Try Prisma first (legacy products)
    const userId = session.user.id
    const where: any = { sellerId: userId }
    if (status === "active") where.isActive = true
    if (status === "paused") where.isActive = false
    if (status === "low_stock") where.stock = { lte: 5 }
    if (status === "no_sales") where.sales = 0

    const [prismaProducts, prismaTotal] = await Promise.all([
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

    // Also fetch from Supabase (imported products)
    const supabase = getSupabaseClient()
    const { data: supabaseUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", session.user.email)
      .maybeSingle()

    let supabaseProducts: any[] = []
    let supabaseTotal = 0

    if (supabaseUser?.id) {
      let supabaseQuery = supabase
        .from("products")
        .select("*, product_images(*), categories:category_id(id, name)", { count: "exact" })
        .eq("seller_id", supabaseUser.id)
        .order("created_at", { ascending: false })
        .range(skip, skip + limit - 1)

      if (status === "active") supabaseQuery = supabaseQuery.eq("is_active", true)
      if (status === "paused") supabaseQuery = supabaseQuery.eq("is_active", false)
      if (status === "low_stock") supabaseQuery = supabaseQuery.lte("stock", 5)
      if (status === "no_sales") supabaseQuery = supabaseQuery.eq("sales", 0)

      const { data, count, error } = await supabaseQuery
      if (!error && data) {
        supabaseProducts = data
        supabaseTotal = count || 0
      }
    }

    // Transform Supabase products to match Prisma format
    const transformedSupabaseProducts = supabaseProducts.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      sku: p.sku,
      price: p.price,
      originalPrice: p.original_price,
      stock: p.stock,
      isActive: p.is_active,
      views: p.views,
      sales: p.sales,
      condition: p.condition,
      freeShipping: p.free_shipping,
      shippingCost: p.shipping_cost,
      qualityScore: p.quality_score || 0,
      categoryId: p.category_id,
      category: p.categories ? { name: p.categories.name } : null,
      images: (p.product_images || []).map((img: any) => ({ url: img.url })),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }))

    // Combine products (Prisma + Supabase)
    const allProducts = [...prismaProducts, ...transformedSupabaseProducts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)

    const total = prismaTotal + supabaseTotal

    // Summary counts from both sources
    const prismaActive = await prisma.product.count({ where: { sellerId: userId, isActive: true } })
    const prismaPaused = await prisma.product.count({ where: { sellerId: userId, isActive: false } })
    const prismaLowStock = await prisma.product.count({ where: { sellerId: userId, stock: { lte: 5 } } })
    const prismaNoSales = await prisma.product.count({ where: { sellerId: userId, sales: 0 } })

    let supabaseActive = 0, supabasePaused = 0, supabaseLowStock = 0, supabaseNoSales = 0
    if (supabaseUser?.id) {
      const { count: a } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("seller_id", supabaseUser.id).eq("is_active", true)
      const { count: pa } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("seller_id", supabaseUser.id).eq("is_active", false)
      const { count: l } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("seller_id", supabaseUser.id).lte("stock", 5)
      const { count: n } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("seller_id", supabaseUser.id).eq("sales", 0)
      supabaseActive = a || 0
      supabasePaused = pa || 0
      supabaseLowStock = l || 0
      supabaseNoSales = n || 0
    }

    // Top products from both sources
    const prismaTop = await prisma.product.findMany({
      where: { sellerId: userId },
      orderBy: { sales: "desc" },
      take: 5,
      select: { id: true, title: true, sales: true, price: true, views: true },
    })

    const supabaseTop = supabaseProducts
      .sort((a: any, b: any) => (b.sales || 0) - (a.sales || 0))
      .slice(0, 5)
      .map((p: any) => ({
        id: p.id,
        title: p.title,
        sales: p.sales || 0,
        price: p.price,
        views: p.views || 0,
      }))

    const topProducts = [...prismaTop, ...supabaseTop]
      .sort((a, b) => (b.sales || 0) - (a.sales || 0))
      .slice(0, 5)

    return NextResponse.json({
      products: allProducts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
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
