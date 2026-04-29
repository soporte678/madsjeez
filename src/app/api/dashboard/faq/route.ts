import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: Buscar FAQs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const category = searchParams.get("category")

    const where: any = { isActive: true }

    if (query) {
      where.OR = [
        { question: { contains: query, mode: "insensitive" } },
        { answer: { contains: query, mode: "insensitive" } },
      ]
    }

    if (category && category !== "all") {
      where.category = category
    }

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: { order: "asc" },
    })

    const categories = await prisma.fAQ.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
    })

    return NextResponse.json({
      faqs,
      categories: categories.map((c) => c.category),
    })
  } catch (error) {
    console.error("Error fetching FAQs:", error)
    return NextResponse.json({ error: "Error al obtener FAQs" }, { status: 500 })
  }
}
