import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { firstProductImageUrl, hasValidProductImageUrl } from "@/lib/productVisibility"

// Productos de DEMO - se muestran cuando no hay ofertas reales
// Estos productos tienen descuentos significativos para atraer usuarios
const DEMO_OFFERS = [
  {
    id: "demo-1",
    title: "Generador Electrico Pektra 2.2kw 6.5 Hp Nafta",
    price: 305821,
    original_price: 552000,
    discount_percentage: 45,
    badge: "SUPER OFERTA",
    badge_color: "hot",
    image: "https://images.unsplash.com/photo-1626428442728-c977e508e46a?w=400&h=400&fit=crop",
    seller: { id: "demo-seller-1", full_name: "GROPEK", reputation: "platinum" },
    category: { name: "Herramientas", slug: "herramientas" },
    shipping: "free",
    rating: 4.7,
    reviews_count: 326,
    installments: "6 cuotas de $63.181",
    isDemo: true
  },
  {
    id: "demo-2",
    title: "Caja Engranaje Para Desmalezadora 52cc 260/280/450",
    price: 62662,
    original_price: 140000,
    discount_percentage: 75,
    badge: "DESTACADO HOY",
    badge_color: "day",
    image: "https://images.unsplash.com/photo-1581094794329-c8112c4e5c8b?w=400&h=400&fit=crop",
    seller: { id: "demo-seller-2", full_name: "RAISMAN", reputation: "gold" },
    category: { name: "Jardín", slug: "jardin" },
    shipping: "free",
    rating: 4.7,
    reviews_count: 51,
    installments: "Cuota inicial menos 6 cuotas de $14.75",
    isDemo: true
  },
  {
    id: "demo-3",
    title: "Tijera Piela Modiste Sastre Costura Profesional Acero Inoxidable Dorado",
    price: 8999,
    original_price: 19998,
    discount_percentage: 55,
    badge: "TOP EN VENTAS",
    badge_color: "top",
    image: "https://images.unsplash.com/photo-1598618827237-66c8bc62c8b3?w=400&h=400&fit=crop",
    seller: { id: "demo-seller-3", full_name: "ELECTROLAND", reputation: "platinum" },
    category: { name: "Belleza", slug: "belleza" },
    shipping: "free",
    rating: 4.9,
    reviews_count: 25,
    installments: "6 cuotas de $20.042",
    isDemo: true
  },
  {
    id: "demo-4",
    title: "Desmalezadora Motoguadaña Explosión Naftera 52cc 2.2hp Podeweb",
    price: 127376,
    original_price: 241000,
    discount_percentage: 47,
    badge: "SUPER OFERTA",
    badge_color: "hot",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=400&fit=crop",
    seller: { id: "demo-seller-4", full_name: "PIDEWEB", reputation: "gold" },
    category: { name: "Jardín", slug: "jardin" },
    shipping: "free",
    rating: 4.6,
    reviews_count: 5540,
    installments: "6 cuotas de $28.814",
    isDemo: true
  },
  {
    id: "demo-5",
    title: "Mesa Exterior Plegable 180 Cm Polipropileno Hierro",
    price: 69550,
    original_price: 94000,
    discount_percentage: 26,
    badge: "DESTACADO HOY",
    badge_color: "day",
    image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&h=400&fit=crop",
    seller: { id: "demo-seller-5", full_name: "Alpine Color", reputation: "silver" },
    category: { name: "Hogar", slug: "hogar" },
    shipping: "free",
    rating: 4.9,
    reviews_count: 11796,
    installments: "6 cuotas de $16.733",
    isDemo: true
  },
  {
    id: "demo-6",
    title: "Omega 3 Max 1000 Epa + 500 Dha Antioxidantes 60 Caps",
    price: 101300,
    original_price: 126625,
    discount_percentage: 20,
    badge: "TOP EN VENTAS",
    badge_color: "top",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop",
    seller: { id: "demo-seller-6", full_name: "Alpine Natural", reputation: "platinum" },
    category: { name: "Salud", slug: "salud" },
    shipping: "free",
    rating: 4.8,
    reviews_count: 6715,
    installments: "Mismo precio 12 cuotas de $8.441",
    isDemo: true
  },
  {
    id: "demo-7",
    title: "Smart Tv Led 50 Pulgadas 4k Google Tv Noblex",
    price: 537199,
    original_price: 849999,
    discount_percentage: 37,
    badge: "DESTACADO HOY",
    badge_color: "day",
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&h=400&fit=crop",
    seller: { id: "demo-seller-7", full_name: "DIMAKER ACERCANDO OPORTUNIDADES", reputation: "gold" },
    category: { name: "Electrónica", slug: "electronica" },
    shipping: "free",
    rating: 4.8,
    reviews_count: 210,
    installments: "6 cuotas de $121.523",
    isDemo: true
  },
  {
    id: "demo-8",
    title: "Escalera Articulada Black + Decker 4x4 16 Escalones 150 Kg",
    price: 191060,
    original_price: 248000,
    discount_percentage: 23,
    badge: "DESTACADO HOY",
    badge_color: "day",
    image: "https://images.unsplash.com/photo-1581147036324-c17ac41dd161?w=400&h=400&fit=crop",
    seller: { id: "demo-seller-8", full_name: "FASTSTORE", reputation: "platinum" },
    category: { name: "Herramientas", slug: "herramientas" },
    shipping: "free",
    rating: 4.8,
    reviews_count: 1928,
    installments: "6 cuotas de $43.220",
    isDemo: true
  },
  {
    id: "demo-9",
    title: "Colchón 1 Plaza (80x190) Sealy Cocoon Chill Box Gris",
    price: 183754,
    original_price: 549998,
    discount_percentage: 66,
    badge: "DESTACADO HOY",
    badge_color: "day",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
    seller: { id: "demo-seller-9", full_name: "Sealy", reputation: "platinum" },
    category: { name: "Hogar", slug: "hogar" },
    shipping: "free",
    rating: 4.8,
    reviews_count: 702,
    installments: "6 cuotas de $41.566",
    isDemo: true
  },
  {
    id: "demo-10",
    title: "Edge 70 Fusion Silhouette Motorola",
    price: 854999,
    original_price: 899999,
    discount_percentage: 5,
    badge: "DESTACADO HOY",
    badge_color: "day",
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop",
    seller: { id: "demo-seller-10", full_name: "Motorola", reputation: "platinum" },
    category: { name: "Celulares", slug: "celulares" },
    shipping: "free",
    rating: 4.6,
    reviews_count: 9593,
    installments: "Mismo precio 12 cuotas de $71.249",
    isDemo: true
  },
  {
    id: "demo-11",
    title: "Notebook Exo Smart T38 Intel N4020 4gb Ssd128gb Windows 11",
    price: 310275,
    original_price: 565000,
    discount_percentage: 45,
    badge: "DESTACADO HOY",
    badge_color: "day",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
    seller: { id: "demo-seller-11", full_name: "EXO", reputation: "gold" },
    category: { name: "Computación", slug: "computacion" },
    shipping: "free",
    rating: 4.5,
    reviews_count: 9593,
    installments: "6 cuotas de $70.189",
    isDemo: true
  },
  {
    id: "demo-12",
    title: "Placa De Video Xfx Speedster Swft210 Amd Rx7600 8gb Hdmi Dp6",
    price: 704999,
    original_price: 874998,
    discount_percentage: 19,
    badge: "DESTACADO HOY",
    badge_color: "day",
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop",
    seller: { id: "demo-seller-12", full_name: "COMPUFANSTORE", reputation: "platinum" },
    category: { name: "Computación", slug: "computacion" },
    shipping: "free",
    rating: 4.8,
    reviews_count: 173,
    installments: "Mismo precio 18 cuotas de $39.166",
    isDemo: true
  }
]

// GET /api/offers - Buscar solo en ofertas (productos con descuento)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const minDiscount = searchParams.get("minDiscount") || "10"
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const freeShipping = searchParams.get("freeShipping") === "true"
    const flash = searchParams.get("flash") === "true"
    const sort = searchParams.get("sort") || "discount_desc"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const includeDemo = searchParams.get("demo") !== "false" // Por defecto incluye demo

    // Buscar productos con descuento en la base de datos
    let query = supabase
      .from('products')
      .select(`
        *,
        product_images(url, order, is_primary),
        seller:users(id, full_name, seller_name, reputation_color),
        category:categories(id, name, slug),
        reviews(count, rating_avg)
      `, { count: 'exact' })
      .not('compare_price', 'is', null)
      .gt('compare_price', 0)
      .lt('price', supabase.rpc('compare_price'))
      .eq('is_active', true)

    // Aplicar filtros de búsqueda
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    if (category) {
      query = query.eq('category.slug', category)
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice))
    }
    
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice))
    }

    if (freeShipping) {
      query = query.eq('free_shipping', true)
    }

    if (flash) {
      query = query.eq('is_flash_deal', true)
    }

    // Ordenar según el criterio
    switch (sort) {
      case "discount_desc":
        // Calculamos el porcentaje de descuento y ordenamos
        query = query.order('compare_price', { ascending: false })
        break
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
        query = query.order('views', { ascending: false })
        break
      default:
        query = query.order('is_boosted', { ascending: false })
    }

    // Paginación
    query = query.range((page - 1) * limit, page * limit - 1)

    const { data: realOffers, error, count } = await query

    if (error) {
      console.error("Error fetching offers:", error)
    }

    // Transformar productos reales al formato de ofertas
    let offers = (realOffers || []).map((product: any) => {
      const discountPercentage = product.compare_price 
        ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
        : 0

      let badge = "OFERTA MADSJEEZ"
      let badgeColor = "day"

      if (discountPercentage >= 50) {
        badge = "SUPER OFERTA"
        badgeColor = "hot"
      } else if (product.is_flash_deal) {
        badge = "FLASH MADSJEEZ"
        badgeColor = "flash"
      } else if (discountPercentage >= 30) {
        badge = "DESTACADO HOY"
        badgeColor = "day"
      } else if (product.sales > 100) {
        badge = "TOP EN VENTAS"
        badgeColor = "top"
      }

      return {
        id: product.id,
        title: product.title,
        price: product.price,
        original_price: product.compare_price,
        discount_percentage: discountPercentage,
        badge,
        badge_color: badgeColor,
        image: firstProductImageUrl(product) || "",
        seller: {
          id: product.seller?.id,
          full_name: product.seller?.seller_name || product.seller?.full_name || "Vendedor",
          reputation: product.seller?.reputation_color || "silver"
        },
        category: {
          name: product.category?.name,
          slug: product.category?.slug
        },
        shipping: product.free_shipping ? "free" : "paid",
        rating: product.reviews?.rating_avg || 0,
        reviews_count: product.reviews?.count || 0,
        installments: `6 cuotas de $${Math.round(product.price / 6).toLocaleString("es-AR")}`,
        isDemo: false
      }
    }).filter(
      (offer: any) =>
        offer.discount_percentage >= parseInt(minDiscount) &&
        hasValidProductImageUrl(offer.image)
    )

    const realOffersCount = offers.length

    // Si no hay suficientes ofertas reales, completar con productos de demo
    if (includeDemo && offers.length < limit) {
      const neededDemoCount = limit - offers.length
      const demoOffers = DEMO_OFFERS.slice(0, neededDemoCount)
      
      // Filtrar demo según búsqueda si hay search
      let filteredDemo = demoOffers
      if (search) {
        const searchLower = search.toLowerCase()
        filteredDemo = demoOffers.filter(demo => 
          demo.title.toLowerCase().includes(searchLower) ||
          demo.category.name.toLowerCase().includes(searchLower)
        )
      }
      
      // Filtrar demo por categoría si hay category
      if (category) {
        filteredDemo = filteredDemo.filter(demo => demo.category.slug === category)
      }

      // Filtrar por precio
      if (minPrice) {
        filteredDemo = filteredDemo.filter(demo => demo.price >= parseFloat(minPrice))
      }
      if (maxPrice) {
        filteredDemo = filteredDemo.filter(demo => demo.price <= parseFloat(maxPrice))
      }

      // Filtrar por descuento mínimo
      filteredDemo = filteredDemo.filter(demo => demo.discount_percentage >= parseInt(minDiscount))

      offers = [...offers, ...filteredDemo]
    }

    // Calcular estadísticas para la UI
    const stats = {
      total_offers: count || 0,
      demo_offers_used: offers.filter((o: any) => o.isDemo).length,
      real_offers: (count || 0),
      has_real_offers: realOffersCount > 0,
      filters_applied: {
        search: search || null,
        category: category || null,
        minDiscount,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
        freeShipping,
        flash
      }
    }

    // Categorías disponibles en ofertas (reales + demo)
    const categoriesMap = new Map()
    
    // Agregar categorías de ofertas reales
    realOffers?.forEach((product: any) => {
      if (!product.category) return
      if (!hasValidProductImageUrl(firstProductImageUrl(product))) return
      categoriesMap.set(product.category.slug, {
        name: product.category.name,
        slug: product.category.slug,
        count: (categoriesMap.get(product.category.slug)?.count || 0) + 1
      })
    })
    
    // Agregar categorías de demo
    DEMO_OFFERS.forEach(demo => {
      const existing = categoriesMap.get(demo.category.slug)
      if (existing) {
        existing.count += 1
      } else {
        categoriesMap.set(demo.category.slug, {
          name: demo.category.name,
          slug: demo.category.slug,
          count: 1
        })
      }
    })

    return NextResponse.json({
      offers,
      stats,
      categories: Array.from(categoriesMap.values()),
      pagination: {
        page,
        limit,
        total: offers.length,
        totalPages: Math.ceil(offers.length / limit)
      },
      search_segment: "offers" // Indica que la búsqueda es solo en ofertas
    })

  } catch (error) {
    console.error("Error in offers API:", error)
    return NextResponse.json(
      { error: "Error al cargar ofertas", details: String(error) },
      { status: 500 }
    )
  }
}
