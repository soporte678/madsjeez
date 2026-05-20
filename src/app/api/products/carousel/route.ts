import { NextRequest, NextResponse } from "next/server";
import {
  getCarouselProductPool,
  getCarouselProducts,
  getCarouselProductsPage,
} from "@/lib/carousel-products";

function isMissingColumnError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2022"
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const limit = Number(searchParams.get("limit") || "12");
    const offset = Number(searchParams.get("offset") || "0");
    const categorySlug = searchParams.get("categorySlug");

    if (mode === "page") {
      const pageSize = Number(searchParams.get("pageSize") || "300");
      const pageOffset = Number(searchParams.get("pageOffset") || "0");
      const result = await getCarouselProductsPage(pageOffset, pageSize);
      return NextResponse.json(result);
    }

    if (mode === "home") {
      const poolCap = Math.min(Number(searchParams.get("poolCap") || "400"), 500);
      const result = await getCarouselProductPool({ poolCap, categorySlug: null });
      return NextResponse.json(result, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    if (mode === "pool") {
      const poolCap = Math.min(Number(searchParams.get("poolCap") || "400"), 600);
      const result = await getCarouselProductPool({
        poolCap,
        categorySlug,
      });
      return NextResponse.json(result, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    const result = await getCarouselProducts({
      limit,
      offset,
      categorySlug,
    });

    return NextResponse.json({
      products: result.products,
      total: result.total,
      poolSize: result.poolSize,
      categorySlug: result.categorySlug,
      filledFromOtherCategories: result.filledFromOtherCategories,
    });
  } catch (error) {
    console.error("Carousel products error:", error);
    if (isMissingColumnError(error)) {
      return NextResponse.json({ products: [], total: 0, poolSize: 0 });
    }
    return NextResponse.json({ products: [], total: 0, poolSize: 0 }, { status: 500 });
  }
}
