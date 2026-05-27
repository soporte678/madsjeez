import { NextRequest, NextResponse } from "next/server";
import {
  searchProductsMultiField,
  searchCategories,
  normalizeSearchQuery,
  calculateRelevanceScore,
} from "@/lib/fulltext-search";

/**
 * GET /api/search/suggestions
 *
 * Búsqueda de sugerencias (autocomplete) usando pg_trgm en vez de ILIKE.
 * Busca productos, categorías, SKUs, sugerencias populares y términos relacionados.
 *
 * Requiere índices GIN/GIST de pg_trgm para rendimiento óptimo.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ suggestions: [] });
    }

    const normalizedQuery = normalizeSearchQuery(query);
    const suggestions: Array<{
      id: string;
      title: string;
      type: "product" | "category" | "brand";
      image?: string;
      url: string;
      score: number;
    }> = [];

    // ───────────────────────────────────────────────────────────
    // 1. BUSCAR PRODUCTOS ACTIVOS con pg_trgm (máximo 10)
    // ───────────────────────────────────────────────────────────
    const productResults = await searchProductsMultiField(normalizedQuery, {
      limit: 10,
      onlyActive: true,
      onlyInStock: true,
    });

    productResults.forEach((product) => {
      const productTitle = product.title.toLowerCase();
      const relevance = calculateRelevanceScore(normalizedQuery, productTitle, {
        bonusExact: 1.0,
        bonusPrefix: 0.7,
        bonusContains: 0.4,
      });
      // Bonus adicional si el título comienza con el query (prefix match)
      const prefixBonus = productTitle.startsWith(normalizedQuery) ? 0.3 : 0;

      suggestions.push({
        id: `p-${product.id}`,
        title: product.title,
        type: "product",
        image: product.images?.[0]?.url || undefined,
        url: `/product/${product.id}`,
        score: relevance + prefixBonus,
      });
    });

    // ───────────────────────────────────────────────────────────
    // 2. BUSCAR CATEGORÍAS con pg_trgm (máximo 8)
    // ───────────────────────────────────────────────────────────
    const categoryResults = await searchCategories(normalizedQuery, {
      limit: 8,
    });

    categoryResults.forEach((category) => {
      const relevance = calculateRelevanceScore(
        normalizedQuery,
        category.name.toLowerCase(),
        {
          bonusExact: 1.0,
          bonusPrefix: 0.7,
          bonusContains: 0.4,
        }
      );

      suggestions.push({
        id: `c-${category.id}`,
        title: category.name,
        type: "category",
        url: `/category/${category.slug}`,
        score: relevance + 0.5, // Priorizar categorías
      });
    });

    // ───────────────────────────────────────────────────────────
    // 3. BUSCAR COINCIDENCIAS POR SKU
    //    (Consulta directa Prisma — SKU suele ser exacto, no fuzzy)
    // ───────────────────────────────────────────────────────────
    const { prisma } = await import("@/lib/prisma");
    const skuGroups = await prisma.product.groupBy({
      by: ["sku"],
      where: {
        sku: { not: null },
        isActive: true,
        stock: { gt: 0 },
      },
      _count: {
        sku: true,
      },
    });

    const matchingSkus = skuGroups.filter(
      (b) =>
        b.sku &&
        (b.sku.toLowerCase().includes(normalizedQuery) ||
          b.sku.toLowerCase() === normalizedQuery)
    );

    matchingSkus.slice(0, 3).forEach((brand) => {
      suggestions.push({
        id: `b-${brand.sku}`,
        title: brand.sku!,
        type: "brand",
        url: `/search?q=${encodeURIComponent(brand.sku!)}`,
        score: 0.8,
      });
    });

    // ───────────────────────────────────────────────────────────
    // 4. SUGERENCIAS POPULARES (hardcoded)
    // ───────────────────────────────────────────────────────────
    const popularSearches = [
      "iPhone 15 Pro Max",
      "Samsung Galaxy S24",
      "Zapatillas Nike Air Force",
      "Notebook Gamer RTX",
      "Aire Acondicionado Split",
      "Smart TV 4K",
      "Cafetera Nespresso",
      "Auriculares Bluetooth",
    ];

    popularSearches.forEach((search) => {
      if (search.toLowerCase().includes(normalizedQuery)) {
        suggestions.push({
          id: `pop-${search}`,
          title: search,
          type: "product",
          url: `/search?q=${encodeURIComponent(search)}`,
          score: 0.6,
        });
      }
    });

    // ───────────────────────────────────────────────────────────
    // 5. TÉRMINOS RELACIONADOS
    // ───────────────────────────────────────────────────────────
    const relatedTerms = generateRelatedTerms(normalizedQuery);
    relatedTerms.forEach((term) => {
      suggestions.push({
        id: `rel-${term}`,
        title: term,
        type: "product",
        url: `/search?q=${encodeURIComponent(term)}`,
        score: 0.4,
      });
    });

    // ───────────────────────────────────────────────────────────
    // Ordenar por score, eliminar duplicados y formatear respuesta
    // ───────────────────────────────────────────────────────────
    const uniqueSuggestions = Array.from(
      new Map(suggestions.map((s) => [s.title.toLowerCase(), s])).values()
    )
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Máximo 10 sugerencias
      .map(({ id, title, type, image, url }) => ({
        id,
        title,
        type,
        image,
        url,
      }));

    return NextResponse.json({
      suggestions: uniqueSuggestions,
      query: normalizedQuery,
      total: uniqueSuggestions.length,
    });
  } catch (error) {
    console.error("Error in search suggestions:", error);
    return NextResponse.json(
      { error: "Error fetching suggestions" },
      { status: 500 }
    );
  }
}

// ──────────────────────────────────────────────────────────────
// Función para generar términos relacionados
// ──────────────────────────────────────────────────────────────
function generateRelatedTerms(query: string): string[] {
  const related: string[] = [];

  // Añadir variaciones comunes
  if (!query.includes("oferta")) related.push(`${query} oferta`);
  if (!query.includes("precio")) related.push(`${query} mejor precio`);
  if (!query.includes("nuevo")) related.push(`${query} nuevo`);
  if (!query.includes("usado")) related.push(`${query} usado`);

  // Singular/plural básico
  if (query.endsWith("s")) {
    related.push(query.slice(0, -1));
  } else {
    related.push(`${query}s`);
  }

  return related.slice(0, 3);
}
