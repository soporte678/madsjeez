import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma"
import { normalizeSearchQuery } from "@/lib/fulltext-search";

/**
 * GET /api/dashboard/faq
 *
 * Buscar FAQs con pg_trgm (reemplaza ILIKE).
 * Mantiene el formato de respuesta: { faqs, categories }
 *
 * Requiere: CREATE EXTENSION IF NOT EXISTS pg_trgm;
 * Requiere índices:
 *   CREATE INDEX CONCURRENTLY idx_faqs_question_trgm ON faqs USING gin (question gin_trgm_ops);
 *   CREATE INDEX CONCURRENTLY idx_faqs_answer_trgm   ON faqs USING gin (answer gin_trgm_ops);
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const category = searchParams.get("category")

    let faqs: Array<{
      id: string;
      question: string;
      answer: string;
      category: string;
      order: number;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    if (query && query.trim().length >= 2) {
      // ── Búsqueda con pg_trgm ──
      const normalizedQuery = normalizeSearchQuery(query);
      const categoryFilter =
        category && category !== "all"
          ? Prisma.sql`AND f.category = ${category}`
          : Prisma.empty;

      faqs = await prisma.$queryRaw<Array<{
        id: string;
        question: string;
        answer: string;
        category: string;
        order: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
      }>>`
        SELECT
          f.id,
          f.question,
          f.answer,
          f.category,
          f.order,
          f.is_active AS "isActive",
          f.created_at AS "createdAt",
          f.updated_at AS "updatedAt"
        FROM faqs f
        WHERE (
          f.question % ${normalizedQuery}
          OR f.answer % ${normalizedQuery}
        )
        AND f.is_active = true
        ${categoryFilter}
        ORDER BY
          GREATEST(
            similarity(f.question, ${normalizedQuery}),
            similarity(f.answer, ${normalizedQuery})
          ) DESC,
          f.order ASC
      `;

      // Si pg_trgm no encuentra nada, fallback a búsqueda por categoría solamente
      if (faqs.length === 0 && category && category !== "all") {
        faqs = await prisma.fAQ.findMany({
          where: {
            isActive: true,
            category,
          },
          orderBy: { order: "asc" },
        });
      }
    } else {
      // ── Sin query de búsqueda: listar todas las FAQs activas ──
      const whereClause: any = { isActive: true };
      if (category && category !== "all") {
        whereClause.category = category;
      }
      faqs = await prisma.fAQ.findMany({
        where: whereClause,
        orderBy: { order: "asc" },
      });
    }

    // Obtener categorías distintas (siempre se devuelven)
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
