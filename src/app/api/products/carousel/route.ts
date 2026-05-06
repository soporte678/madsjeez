import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function isMissingColumnError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2022"
  )
}

export async function GET() {
  try {
    // Get random active products with images, rotating daily based on date
    const today = new Date()
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    const hourSeed = today.getHours()
    const minuteOffset = Math.floor(today.getMinutes() / 1) // Changes every minute
    
    // Get total count
    const totalCount = await prisma.product.count({ where: { isActive: true } })
    
    if (totalCount === 0) {
      return NextResponse.json({ products: [], total: 0 })
    }

    // Fetch a large batch of products (we'll paginate on frontend)
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        category: { select: { name: true, slug: true } },
        seller: { select: { sellerName: true, reputationColor: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200, // Large batch for rotation
    })

    // Shuffle based on time seed for "rotation" effect
    const shuffled = [...products].sort((a, b) => {
      const hashA = (a.id.charCodeAt(0) + daySeed + hourSeed + minuteOffset) % 997
      const hashB = (b.id.charCodeAt(0) + daySeed + hourSeed + minuteOffset) % 997
      return hashA - hashB
    })

    const mapped = shuffled.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      originalPrice: p.originalPrice,
      freeShipping: p.freeShipping,
      sales: p.sales,
      image: p.images[0]?.url || null,
      category: p.category?.name || "",
      sellerName: p.seller?.sellerName || "",
      reputation: p.seller?.reputationColor || "",
    }))

    return NextResponse.json({ products: mapped, total: totalCount })
  } catch (error) {
    console.error("Carousel products error:", error)
    // Mitigacion de incidente: si faltan columnas por migraciones pendientes,
    // no tiramos 500 para evitar romper la home mientras se corrige la DB.
    if (isMissingColumnError(error)) {
      return NextResponse.json({ products: [], total: 0 })
    }
    return NextResponse.json({ products: [], total: 0 }, { status: 500 })
  }
}
