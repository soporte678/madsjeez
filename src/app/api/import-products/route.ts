import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const SKU_PREFIX = "MADSJEEZ"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (!session.user.isSeller) {
      return NextResponse.json({ error: "Solo vendedores" }, { status: 403 })
    }

    const body = await request.json()
    const { products } = body as { products: ImportRow[] }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "No hay productos para importar" }, { status: 400 })
    }

    const sellerId = session.user.id

    // Get or create default category
    let defaultCategory = await prisma.category.findFirst({ where: { slug: "general" } })
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: { name: "General", slug: "general", description: "Categoría general" },
      })
    }

    // Build category map
    const allCategories = await prisma.category.findMany()
    const catMap = new Map<string, string>()
    allCategories.forEach(c => catMap.set(c.name.toLowerCase(), c.id))

    // Check for existing products to avoid duplicates
    const existingProducts = await prisma.product.findMany({
      where: { sellerId },
      select: { title: true, sku: true },
    })
    const existingTitles = new Set(existingProducts.map(p => p.title.toLowerCase().trim()))

    // Find highest existing MADSJEEZ SKU number
    let skuCounter = 0
    existingProducts.forEach(p => {
      if (p.sku) {
        const m = p.sku.match(/MADSJEEZ-(\d+)/)
        if (m) skuCounter = Math.max(skuCounter, parseInt(m[1]))
      }
    })
    skuCounter++

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (const row of products) {
      const title = (row.title || "").trim()
      if (!title || Number(row.price) <= 0) { skipped++; continue }

      if (existingTitles.has(title.toLowerCase())) {
        skipped++
        continue
      }

      // Resolve category
      let categoryId = defaultCategory.id
      if (row.category) {
        const catKey = row.category.toLowerCase()
        if (catMap.has(catKey)) {
          categoryId = catMap.get(catKey)!
        } else {
          const slug = row.category
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .substring(0, 80)
          try {
            const newCat = await prisma.category.create({
              data: { name: row.category, slug: slug || `cat-${Date.now()}`, description: row.category },
            })
            catMap.set(catKey, newCat.id)
            categoryId = newCat.id
          } catch {
            // Slug conflict — use default
          }
        }
      }

      const sku = `${SKU_PREFIX}-${String(skuCounter).padStart(6, "0")}`
      skuCounter++

      try {
        await prisma.product.create({
          data: {
            title,
            description: row.description || `${title} - Producto importado`,
            price: row.price,
            originalPrice: row.originalPrice || null,
            stock: row.stock || 0,
            sku,
            condition: row.condition || "new",
            isActive: row.isActive !== false,
            isFeatured: false,
            isBoosted: false,
            views: 0,
            sales: 0,
            freeShipping: row.freeShipping || false,
            shippingCost: 0,
            qualityScore: Math.floor(Math.random() * 30) + 50,
            hasVideo: false,
            sellerId,
            categoryId,
          },
        })
        existingTitles.add(title.toLowerCase())
        imported++
      } catch (err: any) {
        errors.push(`"${title.substring(0, 40)}": ${err.message}`)
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
      total: products.length,
    })
  } catch (error: any) {
    console.error("Import error:", error)
    return NextResponse.json({ error: error.message || "Error de importación" }, { status: 500 })
  }
}

interface ImportRow {
  title: string
  description: string
  price: number
  originalPrice?: number | null
  stock: number
  condition: string
  freeShipping: boolean
  isActive: boolean
  category: string
}
