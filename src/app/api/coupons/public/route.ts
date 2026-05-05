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

// Cupones de DEMO organizados por categoría
const DEMO_COUPONS: PublicCoupon[] = [
  // Electrónica, Audio y Video
  {
    id: "coupon-1",
    code: "PRESALE2026",
    title: "5% OFF PRE HOTSALE",
    description: "En productos seleccionados",
    discountType: "percentage",
    discountValue: 5,
    minPurchase: 25249,
    maxDiscount: 21251,
    expiresAt: "2026-05-31",
    store: {
      name: "GADNIC",
      logo: "https://placehold.co/50x50/2563EB/white?text=G",
      reputation: "gold"
    },
    category: "Electrónica, Audio y Video",
    categorySlug: "electronica",
    productCount: 15,
    isDemo: true
  },
  {
    id: "coupon-2",
    code: "INTEL20K",
    title: "$20.000 OFF Extra Intel",
    description: "En productos seleccionados",
    discountType: "fixed",
    discountValue: 20000,
    minPurchase: 200000,
    maxDiscount: 20000,
    expiresAt: "2026-07-31",
    store: {
      name: "Intel Argentina",
      logo: "https://placehold.co/50x50/0071C5/white?text=I",
      reputation: "platinum"
    },
    category: "Electrónica, Audio y Video",
    categorySlug: "electronica",
    productCount: 8,
    isDemo: true
  },
  {
    id: "coupon-3",
    code: "LOGITECH20K",
    title: "$20.000 OFF",
    description: "En productos seleccionados",
    discountType: "fixed",
    discountValue: 20000,
    minPurchase: 120000,
    maxDiscount: 20000,
    expiresAt: "2026-05-31",
    store: {
      name: "Logitech Store",
      logo: "https://placehold.co/50x50/00B8FC/white?text=L",
      reputation: "platinum"
    },
    category: "Electrónica, Audio y Video",
    categorySlug: "electronica",
    productCount: 12,
    isDemo: true
  },

  // Hogar, Muebles y Jardín
  {
    id: "coupon-4",
    code: "HOGAR5",
    title: "5% OFF GADNIC HOGAR",
    description: "En productos seleccionados",
    discountType: "percentage",
    discountValue: 5,
    minPurchase: 61669,
    maxDiscount: 15405,
    expiresAt: "2026-05-31",
    store: {
      name: "GADNIC",
      logo: "https://placehold.co/50x50/2563EB/white?text=G",
      reputation: "gold"
    },
    category: "Hogar, Muebles y Jardín",
    categorySlug: "hogar",
    productCount: 23,
    isDemo: true
  },
  {
    id: "coupon-5",
    code: "ELEGI10K",
    title: "$10.000 OFF ELEGI LOGUS",
    description: "En productos seleccionados",
    discountType: "fixed",
    discountValue: 10000,
    minPurchase: 50000,
    maxDiscount: 10000,
    expiresAt: "2026-06-01",
    store: {
      name: "ELEGI",
      logo: "https://placehold.co/50x50/8B5CF6/white?text=E",
      reputation: "silver"
    },
    category: "Hogar, Muebles y Jardín",
    categorySlug: "hogar",
    productCount: 18,
    isDemo: true
  },
  {
    id: "coupon-6",
    code: "DISNEY5K",
    title: "$5.000 OFF DISNEY-MARVEL",
    description: "En productos seleccionados",
    discountType: "fixed",
    discountValue: 5000,
    minPurchase: 85000,
    maxDiscount: 20000,
    expiresAt: "2026-06-01",
    store: {
      name: "DISNEY STORE",
      logo: "https://placehold.co/50x50/FF0000/white?text=D",
      reputation: "platinum"
    },
    category: "Hogar, Muebles y Jardín",
    categorySlug: "hogar",
    productCount: 45,
    isDemo: true
  },
  {
    id: "coupon-7",
    code: "LOGUS2500",
    title: "$2.500 OFF OFERTAS LOGUS",
    description: "En productos seleccionados",
    discountType: "fixed",
    discountValue: 2500,
    minPurchase: 25000,
    maxDiscount: 2500,
    expiresAt: "2026-06-01",
    store: {
      name: "LOGUS",
      logo: "https://placehold.co/50x50/10B981/white?text=L",
      reputation: "gold"
    },
    category: "Hogar, Muebles y Jardín",
    categorySlug: "hogar",
    productCount: 32,
    isDemo: true,
    isEnding: true
  },
  {
    id: "coupon-8",
    code: "LICXV5",
    title: "5% OFF LICXV",
    description: "En productos seleccionados",
    discountType: "percentage",
    discountValue: 5,
    minPurchase: 44262,
    maxDiscount: 15000,
    expiresAt: "2026-06-01",
    store: {
      name: "LICXV",
      logo: "https://placehold.co/50x50/F59E0B/white?text=L",
      reputation: "silver"
    },
    category: "Hogar, Muebles y Jardín",
    categorySlug: "hogar",
    productCount: 9,
    isDemo: true,
    isEnding: true
  },
  {
    id: "coupon-9",
    code: "SEGUIDOR3500",
    title: "$3.500 OFF Seguidor",
    description: "En productos de Tienda Objetos",
    discountType: "fixed",
    discountValue: 3500,
    minPurchase: 70000,
    maxDiscount: 3500,
    expiresAt: "2026-05-29",
    store: {
      name: "Tienda Objetos",
      logo: "https://placehold.co/50x50/EC4899/white?text=T",
      reputation: "gold"
    },
    category: "Hogar, Muebles y Jardín",
    categorySlug: "hogar",
    productCount: 7,
    isDemo: true
  },

  // Moda y Accesorios
  {
    id: "coupon-10",
    code: "MODA30",
    title: "30% OFF en Moda",
    description: "En productos seleccionados",
    discountType: "percentage",
    discountValue: 30,
    minPurchase: 5000,
    maxDiscount: 120000,
    expiresAt: "2026-06-30",
    store: {
      name: "Fashion Store",
      logo: "https://placehold.co/50x50/6366F1/white?text=F",
      reputation: "platinum"
    },
    category: "Moda y Accesorios",
    categorySlug: "moda",
    productCount: 156,
    isDemo: true
  },
  {
    id: "coupon-11",
    code: "MODA40",
    title: "40% OFF en Moda",
    description: "En productos seleccionados",
    discountType: "percentage",
    discountValue: 40,
    minPurchase: 5000,
    maxDiscount: 150000,
    expiresAt: "2026-06-30",
    store: {
      name: "Trendy Shop",
      logo: "https://placehold.co/50x50/8B5CF6/white?text=T",
      reputation: "gold"
    },
    category: "Moda y Accesorios",
    categorySlug: "moda",
    productCount: 89,
    isDemo: true
  },
  {
    id: "coupon-12",
    code: "MODA5",
    title: "5% OFF en Moda",
    description: "En productos seleccionados",
    discountType: "percentage",
    discountValue: 5,
    minPurchase: 5000,
    maxDiscount: 50000,
    expiresAt: "2026-06-30",
    store: {
      name: "Style Plus",
      logo: "https://placehold.co/50x50/F43F5E/white?text=S",
      reputation: "silver"
    },
    category: "Moda y Accesorios",
    categorySlug: "moda",
    productCount: 234,
    isDemo: true
  },
  {
    id: "coupon-13",
    code: "MODA20",
    title: "20% OFF en Moda",
    description: "En productos seleccionados",
    discountType: "percentage",
    discountValue: 20,
    minPurchase: 5000,
    maxDiscount: 90000,
    expiresAt: "2026-06-30",
    store: {
      name: "Urban Wear",
      logo: "https://placehold.co/50x50/14B8A6/white?text=U",
      reputation: "gold"
    },
    category: "Moda y Accesorios",
    categorySlug: "moda",
    productCount: 67,
    isDemo: true
  },
  {
    id: "coupon-14",
    code: "CARE5",
    title: "5% OFF CARE by GADNIC",
    description: "En productos seleccionados",
    discountType: "percentage",
    discountValue: 5,
    minPurchase: 34082,
    maxDiscount: 8670,
    expiresAt: "2026-05-31",
    store: {
      name: "CARE GADNIC",
      logo: "https://placehold.co/50x50/22C55E/white?text=C",
      reputation: "platinum"
    },
    category: "Moda y Accesorios",
    categorySlug: "moda",
    productCount: 42,
    isDemo: true
  },
  {
    id: "coupon-15",
    code: "MODA10",
    title: "10% OFF en Moda",
    description: "En productos seleccionados",
    discountType: "percentage",
    discountValue: 10,
    minPurchase: 5000,
    maxDiscount: 90000,
    expiresAt: "2026-06-30",
    store: {
      name: "Moda Express",
      logo: "https://placehold.co/50x50/EAB308/white?text=M",
      reputation: "silver"
    },
    category: "Moda y Accesorios",
    categorySlug: "moda",
    productCount: 123,
    isDemo: true
  },

  // Deportes y Fitness
  {
    id: "coupon-16",
    code: "DEPORTES30",
    title: "30% OFF en Deportes",
    description: "En productos seleccionados",
    discountType: "percentage",
    discountValue: 30,
    minPurchase: 5000,
    maxDiscount: 120000,
    expiresAt: "2026-06-30",
    store: {
      name: "Sport World",
      logo: "https://placehold.co/50x50/3B82F6/white?text=S",
      reputation: "platinum"
    },
    category: "Deportes y Fitness",
    categorySlug: "deportes",
    productCount: 78,
    isDemo: true
  },
  {
    id: "coupon-17",
    code: "DEPORTES5",
    title: "5% OFF Activa",
    description: "En productos seleccionados",
    discountType: "percentage",
    discountValue: 5,
    minPurchase: 53252,
    maxDiscount: 13313,
    expiresAt: "2026-05-31",
    store: {
      name: "GADNIC SPORT",
      logo: "https://placehold.co/50x50/22C55E/white?text=G",
      reputation: "gold"
    },
    category: "Deportes y Fitness",
    categorySlug: "deportes",
    productCount: 34,
    isDemo: true
  },
  {
    id: "coupon-18",
    code: "PADEL6K",
    title: "$6.000 OFF PADEL",
    description: "En productos seleccionados",
    discountType: "fixed",
    discountValue: 6000,
    minPurchase: 180000,
    maxDiscount: 6000,
    expiresAt: "2026-05-31",
    store: {
      name: "Padel Pro",
      logo: "https://placehold.co/50x50/F97316/white?text=P",
      reputation: "silver"
    },
    category: "Deportes y Fitness",
    categorySlug: "deportes",
    productCount: 15,
    isDemo: true,
    isEnding: true
  },
  {
    id: "coupon-19",
    code: "BULL10",
    title: "10% OFF BULLPREMIER",
    description: "En productos seleccionados",
    discountType: "percentage",
    discountValue: 10,
    minPurchase: 100000,
    maxDiscount: 21000,
    expiresAt: "2026-05-18",
    store: {
      name: "BULLPREMIER",
      logo: "https://placehold.co/50x50/EF4444/white?text=B",
      reputation: "platinum"
    },
    category: "Deportes y Fitness",
    categorySlug: "deportes",
    productCount: 28,
    isDemo: true
  },
  {
    id: "coupon-20",
    code: "BICIS5",
    title: "5% OFF BICIS GARIOTTI",
    description: "En productos seleccionados",
    discountType: "percentage",
    discountValue: 5,
    minPurchase: 10000,
    maxDiscount: 5000,
    expiresAt: "2026-06-30",
    store: {
      name: "GARIOTTI",
      logo: "https://placehold.co/50x50/06B6D4/white?text=G",
      reputation: "gold"
    },
    category: "Deportes y Fitness",
    categorySlug: "deportes",
    productCount: 56,
    isDemo: true,
    isEnding: true
  },

  // Accesorios para Vehículos
  {
    id: "coupon-21",
    code: "TIRE20K",
    title: "$20.000 OFF Go Tire",
    description: "En productos seleccionados",
    discountType: "fixed",
    discountValue: 20000,
    minPurchase: 450000,
    maxDiscount: 20000,
    expiresAt: "2026-06-30",
    store: {
      name: "Go Tire",
      logo: "https://placehold.co/50x50/1F2937/white?text=G",
      reputation: "platinum"
    },
    category: "Accesorios para Vehículos",
    categorySlug: "vehiculos",
    productCount: 89,
    isDemo: true
  },
  {
    id: "coupon-22",
    code: "TIRE30K",
    title: "$30.000 OFF GO TIRE",
    description: "En productos seleccionados",
    discountType: "fixed",
    discountValue: 30000,
    minPurchase: 700000,
    maxDiscount: 30000,
    expiresAt: "2026-06-30",
    store: {
      name: "Go Tire Pro",
      logo: "https://placehold.co/50x50/DC2626/white?text=G",
      reputation: "gold"
    },
    category: "Accesorios para Vehículos",
    categorySlug: "vehiculos",
    productCount: 45,
    isDemo: true,
    isEnding: true
  },
  {
    id: "coupon-23",
    code: "TIRE5K",
    title: "$5.000 OFF GO TIRE",
    description: "En productos seleccionados",
    discountType: "fixed",
    discountValue: 5000,
    minPurchase: 135000,
    maxDiscount: 5000,
    expiresAt: "2026-06-30",
    store: {
      name: "Go Tire Express",
      logo: "https://placehold.co/50x50/7C3AED/white?text=G",
      reputation: "silver"
    },
    category: "Accesorios para Vehículos",
    categorySlug: "vehiculos",
    productCount: 123,
    isDemo: true,
    isEnding: true
  },
  {
    id: "coupon-24",
    code: "FULL7",
    title: "7% OFF FULL",
    description: "En productos seleccionados",
    discountType: "percentage",
    discountValue: 7,
    minPurchase: 10000,
    maxDiscount: 7000,
    expiresAt: "2026-06-30",
    store: {
      name: "FULL STORE",
      logo: "https://placehold.co/50x50/059669/white?text=F",
      reputation: "platinum"
    },
    category: "Accesorios para Vehículos",
    categorySlug: "vehiculos",
    productCount: 234,
    isDemo: true,
    isEnding: true
  },

  // Juegos, Juguetes y Bebés
  {
    id: "coupon-25",
    code: "DISNEYBEBE5K",
    title: "$5.000 OFF DISNEY-MARVEL",
    description: "En productos seleccionados",
    discountType: "fixed",
    discountValue: 5000,
    minPurchase: 85000,
    maxDiscount: 20000,
    expiresAt: "2026-06-01",
    store: {
      name: "DISNEY BABY",
      logo: "https://placehold.co/50x50/FF6B9D/white?text=D",
      reputation: "platinum"
    },
    category: "Juegos, Juguetes y Bebés",
    categorySlug: "juguetes",
    productCount: 67,
    isDemo: true
  },
  {
    id: "coupon-26",
    code: "PADEL10",
    title: "10% OFF ROYAL PADEL",
    description: "En productos seleccionados",
    discountType: "percentage",
    discountValue: 10,
    minPurchase: 50000,
    maxDiscount: 8000,
    expiresAt: "2026-06-01",
    store: {
      name: "ROYAL PADEL",
      logo: "https://placehold.co/50x50/FBBF24/white?text=R",
      reputation: "gold"
    },
    category: "Juegos, Juguetes y Bebés",
    categorySlug: "juguetes",
    productCount: 23,
    isDemo: true
  },
  {
    id: "coupon-27",
    code: "MONOPATIN20K",
    title: "$20.000 OFF MONOPATIN",
    description: "En productos seleccionados",
    discountType: "fixed",
    discountValue: 20000,
    minPurchase: 500000,
    maxDiscount: 20000,
    expiresAt: "2026-06-01",
    store: {
      name: "Monopatin Shop",
      logo: "https://placehold.co/50x50/6366F1/white?text=M",
      reputation: "silver"
    },
    category: "Juegos, Juguetes y Bebés",
    categorySlug: "juguetes",
    productCount: 12,
    isDemo: true
  },

  // Más de $5000
  {
    id: "coupon-28",
    code: "PLAY100K",
    title: "$100.000 OFF PLAYSTATION",
    description: "En productos seleccionados",
    discountType: "fixed",
    discountValue: 100000,
    minPurchase: 1000001,
    maxDiscount: 100000,
    expiresAt: "2026-05-05",
    store: {
      name: "PlayStation Store",
      logo: "https://placehold.co/50x50/003791/white?text=P",
      reputation: "platinum"
    },
    category: "Más de $5000",
    categorySlug: "premium",
    productCount: 8,
    isDemo: true,
    isUrgent: true
  },
  {
    id: "coupon-29",
    code: "POINT44K",
    title: "$44.000 OFF EN TU POINT",
    description: "En productos seleccionados",
    discountType: "fixed",
    discountValue: 44000,
    minPurchase: 44998,
    maxDiscount: 44000,
    expiresAt: "2026-06-30",
    store: {
      name: "POINT Store",
      logo: "https://placehold.co/50x50/8B5CF6/white?text=P",
      reputation: "gold"
    },
    category: "Más de $5000",
    categorySlug: "premium",
    productCount: 15,
    isDemo: true,
    isEnding: true
  },
  {
    id: "coupon-30",
    code: "PADEL6K2",
    title: "$6.000 OFF PADEL",
    description: "En productos seleccionados",
    discountType: "fixed",
    discountValue: 6000,
    minPurchase: 180000,
    maxDiscount: 6000,
    expiresAt: "2026-05-31",
    store: {
      name: "Padel Center",
      logo: "https://placehold.co/50x50/F97316/white?text=P",
      reputation: "silver"
    },
    category: "Más de $5000",
    categorySlug: "premium",
    productCount: 19,
    isDemo: true
  }
]

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
          discountValue: coupon.discountValue,
          minPurchase: coupon.minPurchase || 0,
          maxDiscount: coupon.maxDiscount || coupon.discountValue,
          expiresAt,
          store: {
            name: coupon.seller.sellerName || coupon.seller.name || "Tienda MadsJeez",
            logo: coupon.seller.image || "https://placehold.co/50x50/FF6B4A/white?text=M",
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
      : [...DEMO_COUPONS]

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
      total: realCoupons.length > 0 ? usableRealCoupons.length : DEMO_COUPONS.length,
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
