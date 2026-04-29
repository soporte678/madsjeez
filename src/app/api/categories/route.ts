import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { seedCategoriesIfEmpty } from "@/lib/seed-categories"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Auto-seed categories on first request if DB is empty
    await seedCategoriesIfEmpty()

    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: "asc" }
    })

    const formattedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      productCount: cat._count.products,
      children: cat.children.map(c => ({ id: c.id, name: c.name, slug: c.slug }))
    }))

    return NextResponse.json(formattedCategories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}
