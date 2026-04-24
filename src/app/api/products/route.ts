import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/products - Listar productos
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const seller = searchParams.get("seller")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const sort = searchParams.get("sort") || "relevance"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: any = {
      isActive: true,
    }

    if (category) {
      where.category = { slug: category }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (seller) {
      where.sellerId = seller
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    // Ordenamiento
    let orderBy: any = {}
    switch (sort) {
      case "price_asc":
        orderBy = { price: "asc" }
        break
      case "price_desc":
        orderBy = { price: "desc" }
        break
      case "newest":
        orderBy = { createdAt: "desc" }
        break
      case "popular":
        orderBy = { sales: "desc" }
        break
      default:
        // Por relevancia: productos boosteados primero
        orderBy = { isBoosted: "desc" }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { take: 1 },
          seller: {
            select: {
              id: true,
              name: true,
              sellerName: true,
              reputationColor: true,
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          },
          _count: {
            select: { reviews: true }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where })
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Error al cargar productos" },
      { status: 500 }
    )
  }
}

// POST /api/products - Crear producto
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    if (!session.user.isSeller) {
      return NextResponse.json(
        { error: "Solo los vendedores pueden publicar productos" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { title, description, price, comparePrice, stock, categoryId, condition, images, attributes } = body

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        stock: parseInt(stock),
        categoryId,
        condition: condition || "new",
        sellerId: session.user.id,
        images: {
          create: images.map((url: string, index: number) => ({
            url,
            order: index,
          }))
        },
        attributes: {
          create: attributes?.map((attr: { name: string; value: string }) => ({
            name: attr.name,
            value: attr.value,
          })) || []
        }
      },
      include: {
        images: true,
        category: true,
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    )
  }
}
