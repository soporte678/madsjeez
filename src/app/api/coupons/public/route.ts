import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type PublicCoupon = {
  id: string
  code: string
  title: string
  description: string
  discountType: "percentage" | "fixed"
  discountValue: number
  minPurchase: number
  maxDiscount: number
  expiresAt: string
  store: {
    name: string
    logo: string
    reputation: string
  }
  category: string
  categorySlug: string
  productCount: number
  isDemo?: boolean
  isEnding?: boolean
  isUrgent?: boolean
}


// GET /api/coupons/public - Listar cupones públicos para compradores
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const minDiscount = searchParams.get("minDiscount")
    const store = searchParams.get("store")
    const endingSoon = searchParams.get("endingSoon") === "true"
    const tab = searchParams.get("tab") || "all" // all, categories, ending, most-used, new

    const now = new Date()
    const realCoupons = await prisma.coupon.findMany({
      where: {
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
      orderBy: [{ isBoosted: "desc" }, { expiresAt: "asc" }],
      take: 100,
      include: {
        seller: {
          select: {
            sellerName: true,
            name: true,
            image: true,
            reputationLevel: true,
            products: {
              where: { isActive: true },
              take: 1,
              select: {
                category: { select: { name: true, slug: true } },
              },
            },
            _count: {
              select: { products: { where: { isActive: true } } },
            },
          },
        },
      },
    })

    const usableRealCoupons = realCoupons.filter((coupon) => coupon.maxUses === null || coupon.usedCount < coupon.maxUses)

    let coupons: PublicCoupon[] = usableRealCoupons.length > 0
      ? usableRealCoupons.map((coupon) => {
        const firstCategory = coupon.seller.products[0]?.category
        const expiresAt = coupon.expiresAt.toISOString()
        const daysToExpire = Math.ceil((coupon.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: coupon.id,
          code: coupon.code,
          title: coupon.description || `${coupon.discountValue}${coupon.discountType === "percentage" ? "%" : "$"} OFF`,
          description: coupon.description || "Cupón activo del vendedor",
          discountType: coupon.discountType as "percentage" | "fixed",
          discountValue: Number(coupon.discountValue),
          minPurchase: Number(coupon.minPurchase) || 0,
          maxDiscount: Number(coupon.maxDiscount) || Number(coupon.discountValue),
          expiresAt,
          store: {
            name: coupon.seller.sellerName || coupon.seller.name || "Tienda MadsJeez",
            logo: coupon.seller.image || "https://placehold.co/50x50/ff4d2e/white?text=M",
            reputation: coupon.seller.reputationLevel || "VENDEDOR NUEVO",
          },
          category: firstCategory?.name || "Cupones de vendedores",
          categorySlug: firstCategory?.slug || "vendedores",
          productCount: coupon.seller._count.products,
          isDemo: false,
          isEnding: daysToExpire <= 3,
          isUrgent: daysToExpire <= 1,
        }
      })
      : []

    // Filtrar por búsqueda
    if (search) {
      const searchLower = search.toLowerCase()
      coupons = coupons.filter(c => 
        c.title.toLowerCase().includes(searchLower) ||
        c.store.name.toLowerCase().includes(searchLower) ||
        c.code.toLowerCase().includes(searchLower) ||
        c.category.toLowerCase().includes(searchLower)
      )
    }

    // Filtrar por categoría
    if (category) {
      coupons = coupons.filter(c => c.categorySlug === category)
    }

    // Filtrar por tienda
    if (store) {
      coupons = coupons.filter(c => c.store.name.toLowerCase().includes(store.toLowerCase()))
    }

    // Filtrar por descuento mínimo
    if (minDiscount) {
      const min = parseInt(minDiscount)
      coupons = coupons.filter(c => c.discountValue >= min)
    }

    // Filtrar por vencimiento próximo
    if (endingSoon) {
      const today = new Date()
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
      coupons = coupons.filter(c => {
        const expiry = new Date(c.expiresAt)
        return expiry <= threeDaysFromNow
      })
    }

    // Filtrar por tabs
    switch (tab) {
      case "ending":
        coupons = coupons.filter(c => c.isEnding)
        break
      case "most-used":
        // Ordenar por productCount (simulación de más usados)
        coupons = coupons.sort((a, b) => b.productCount - a.productCount)
        break
      case "new":
        // Cupones que vencen más lejos (simulación de nuevos)
        coupons = coupons.sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime())
        break
    }

    // Agrupar por categoría
    const groupedByCategory = coupons.reduce((acc, coupon) => {
      if (!acc[coupon.category]) {
        acc[coupon.category] = {
          name: coupon.category,
          slug: coupon.categorySlug,
          coupons: []
        }
      }
      acc[coupon.category].coupons.push(coupon)
      return acc
    }, {} as Record<string, { name: string; slug: string; coupons: typeof coupons }>)

    // Calcular estadísticas
    const stats = {
      total: usableRealCoupons.length,
      filtered: coupons.length,
      byCategory: Object.keys(groupedByCategory).length,
      endingSoon: coupons.filter(c => c.isEnding).length,
      categories: Object.values(groupedByCategory).map(cat => ({
        name: cat.name,
        slug: cat.slug,
        count: cat.coupons.length
      }))
    }

    return NextResponse.json({
      coupons,
      groupedByCategory: Object.values(groupedByCategory),
      stats,
      search_segment: "coupons"
    })

  } catch (error) {
    console.error("Error in coupons API:", error)
    return NextResponse.json(
      { error: "Error al cargar cupones", details: String(error) },
      { status: 500 }
    )
  }
}
