import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasValidProductImageUrl, primaryImageUrlFromRows } from "@/lib/productVisibility"

/** Escapa caracteres wildcard de ILIKE para evitar SQL injection via wildcards */
function escapeIlikeTerm(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&")
}

// GET /api/products - Listar productos
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    if (searchParams.get("deals") === "true") {
      const limit = Math.min(parseInt(searchParams.get("limit") || "48", 10), 100)
      const { data: products, error } = await supabase
        .from("products")
        .select(`
          id,
          title,
          price,
          original_price,
          compare_price,
          product_images(url, order, is_primary),
          seller:users(id, full_name, seller_name)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error

      const dealsList = (products || []).filter((p: Record<string, unknown>) => {
        const listPrice = (p.compare_price ?? p.original_price) as number | null | undefined
        const price = p.price as number
        return typeof listPrice === "number" && listPrice > 0 && price < listPrice
      })

      const normalized = dealsList
        .filter((p: any) => hasValidProductImageUrl(primaryImageUrlFromRows(p.product_images)))
        .map((p: any) => {
          const rows = (p.product_images || []).filter((im: { url?: string }) =>
            hasValidProductImageUrl(im.url)
          )
          const sorted = [...rows].sort((a: any, b: any) => {
            if (a.is_primary && !b.is_primary) return -1
            if (!a.is_primary && b.is_primary) return 1
            return (a.order ?? 0) - (b.order ?? 0)
          })
          const listPrice = p.compare_price ?? p.original_price
          return {
            id: p.id,
            title: p.title,
            price: p.price,
            original_price: listPrice,
            images: sorted.map((im: { url: string }) => ({ url: String(im.url).trim() })),
            seller: {
              id: p.seller?.id,
              full_name: p.seller?.seller_name || p.seller?.full_name || "Vendedor",
            },
          }
        })

      return NextResponse.json({ products: normalized })
    }

    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const seller = searchParams.get("seller")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const sort = searchParams.get("sort") || "relevance"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    // /api/products es genérico. Para filtros geo usar /api/search/listings.
    let query = supabase
      .from('products')
      .select(`
        *,
        product_images(url, order, is_primary),
        seller:users(id, name, sellerName, reputation_color),
        category:categories(id, name, slug),
        reviews(count)
      `, { count: 'exact' })

    // Aplicar filtros
    if (category) {
      query = query.eq('category.slug', category)
    }
    if (search) {
      const safeSearch = escapeIlikeTerm(search)
      query = query.or(`title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`)
    }
    if (seller) {
      query = query.eq('seller_id', seller)
    }
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice))
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice))
    }

    // Aplicar ordenamiento
    switch (sort) {
      case "price_asc":
        query = query.order('price', { ascending: true })
        break
      case "price_desc":
        query = query.order('price', { ascending: false })
        break
      case "newest":
        query = query.order('created_at', { ascending: false })
        break
      case "popular":
        query = query.order('sales', { ascending: false })
        break
      default:
        query = query.order('is_boosted', { ascending: false })
    }

    // Paginación
    query = query.range((page - 1) * limit, page * limit - 1)

    const { data: products, error, count } = await query

    if (error) throw error

    const total = count || 0

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

    // Enforce listing limits según tier efectivo (incluye trial 14 días).
    const { prisma: prismaClient } = await import("@/lib/prisma");
    const { getEffectiveTier, canPublishMore } = await import("@/lib/subscription/effective-tier");

    const userRow = await prismaClient.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true, subscriptionExpiry: true },
    });
    const trialRow = await prismaClient.$queryRaw<Array<{ trial_ends_at: Date | null }>>`
      SELECT trial_ends_at FROM users WHERE id = ${session.user.id}
    `;
    const effective = getEffectiveTier({
      subscriptionTier: userRow?.subscriptionTier ?? "FREE",
      subscriptionExpiry: userRow?.subscriptionExpiry ?? null,
      trialEndsAt: trialRow[0]?.trial_ends_at ?? null,
    });

    const activeCount = await prismaClient.product.count({
      where: { sellerId: session.user.id, isActive: true },
    });
    const check = canPublishMore(effective.tier, activeCount);
    if (!check.allowed) {
      return NextResponse.json(
        {
          error: `Llegaste al tope de ${check.max} publicaciones de tu plan. Suscribite a un plan mayor para publicar más.`,
          tier: effective.tier,
          activeCount,
          max: check.max,
          inTrial: effective.inTrial,
        },
        { status: 403 },
      );
    }

    const body = await req.json()
    const { title, description, price, comparePrice, stock, categoryId, condition, images, attributes } = body

    // Crear producto principal
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        title,
        description,
        price: parseFloat(price),
        compare_price: comparePrice ? parseFloat(comparePrice) : null,
        stock: parseInt(stock),
        category_id: categoryId,
        condition: condition || "new",
        seller_id: session.user.id,
        status: 'ACTIVE'
      })
      .select()
      .single()

    if (productError) throw productError

    // Crear imágenes
    if (images && images.length > 0) {
      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(
          images.map((url: string, index: number) => ({
            product_id: product.id,
            url,
            order: index,
          }))
        )
      
      if (imagesError) throw imagesError
    }

    // Crear atributos
    if (attributes && attributes.length > 0) {
      const { error: attributesError } = await supabase
        .from('product_attributes')
        .insert(
          attributes.map((attr: { name: string; value: string }) => ({
            product_id: product.id,
            name: attr.name,
            value: attr.value,
          }))
        )
      
      if (attributesError) throw attributesError
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    )
  }
}
