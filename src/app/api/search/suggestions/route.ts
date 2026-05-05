import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Función para calcular distancia de Levenshtein (búsqueda fuzzy)
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

// Función para calcular score de similitud (0-1)
function similarityScore(a: string, b: string): number {
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ suggestions: [] });
    }

    const normalizedQuery = query.toLowerCase().trim();
    const suggestions: Array<{
      id: string;
      title: string;
      type: "product" | "category" | "brand";
      image?: string;
      url: string;
      score: number;
    }> = [];

    // 1. BUSCAR PUBLICACIONES ACTIVAS (máximo 10 resultados)
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: normalizedQuery, mode: "insensitive" } },
          { description: { contains: normalizedQuery, mode: "insensitive" } },
          { sku: { contains: normalizedQuery, mode: "insensitive" } },
        ],
        isActive: true,
        stock: { gt: 0 },
      },
      take: 10,
      select: {
        id: true,
        title: true,
        images: {
          orderBy: { order: "asc" },
          take: 1,
          select: { url: true },
        },
      },
    });

    // Filtrar y scorear productos
    products.forEach((product) => {
      const productTitle = product.title.toLowerCase();
      const nameScore = similarityScore(normalizedQuery, productTitle);
      if (nameScore > 0.3 || productTitle.includes(normalizedQuery)) {
        suggestions.push({
          id: `p-${product.id}`,
          title: product.title,
          type: "product",
          image: product.images?.[0]?.url || undefined,
          url: `/product/${product.id}`,
          score: nameScore + (productTitle.startsWith(normalizedQuery) ? 0.3 : 0),
        });
      }
    });

    // 2. BUSCAR CATEGORÍAS
    const categories = await prisma.category.findMany({
      where: {
        name: { contains: normalizedQuery, mode: "insensitive" },
      },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    categories.forEach((category) => {
      const score = similarityScore(normalizedQuery, category.name.toLowerCase());
      if (score > 0.4 || category.name.toLowerCase().includes(normalizedQuery)) {
        suggestions.push({
          id: `c-${category.id}`,
          title: category.name,
          type: "category",
          url: `/category/${category.slug}`,
          score: score + 0.5, // Priorizar categorías
        });
      }
    });

    // 3. BUSCAR COINCIDENCIAS POR SKU desde publicaciones activas
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
          similarityScore(normalizedQuery, b.sku.toLowerCase()) > 0.5)
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

    // 4. AUTO-COMPLETAR SUGERENCIAS POPULARES
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
      if (
        search.toLowerCase().includes(normalizedQuery) ||
        similarityScore(normalizedQuery, search.toLowerCase()) > 0.5
      ) {
        suggestions.push({
          id: `pop-${search}`,
          title: search,
          type: "product",
          url: `/search?q=${encodeURIComponent(search)}`,
          score: 0.6,
        });
      }
    });

    // 5. SUGERENCIAS DE BÚSQUEDA RELACIONADAS
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

    // Ordenar por score y eliminar duplicados
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

// Función para generar términos relacionados
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
