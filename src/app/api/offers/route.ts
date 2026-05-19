import { NextResponse } from "next/server";
import { getMarketplaceOffers } from "@/lib/offers/marketplace-offers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    let event = searchParams.get("event");
    const minDiscount = parseInt(searchParams.get("minDiscount") || "5", 10);
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const freeShipping = searchParams.get("freeShipping") === "true";
    const flash = searchParams.get("flash") === "true";
    const sort = searchParams.get("sort") || "discount_desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    let categorySlug: string | null = null;
    const subcategory = searchParams.get("subcategory");
    let flashOnly = flash;
    let flashRelampagoOnly = searchParams.get("mode") === "flash" || category === "flash";

    if (flashRelampagoOnly) {
      flashOnly = false;
      if (subcategory) categorySlug = subcategory;
    } else if (category === "flash") {
      flashOnly = true;
    } else if (category === "clearance") {
      event = event || "liquidacion";
    } else if (category && category !== "all" && category !== "best") {
      categorySlug = category;
    }

    const result = await getMarketplaceOffers({
      search,
      category: categorySlug,
      event,
      minDiscount,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      freeShipping,
      flash: flashOnly,
      flashRelampagoOnly,
      sort: flashRelampagoOnly ? "ending_soon" : category === "best" ? "discount_desc" : sort,
      page,
      limit,
    });

    return NextResponse.json({
      offers: result.offers,
      stats: result.stats,
      categories: result.categories,
      seasonalEvents: result.activeSeasonalEvents,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
      search_segment: "offers",
    });
  } catch (error) {
    console.error("Error in offers API:", error);
    return NextResponse.json(
      { error: "Error al cargar ofertas", details: String(error) },
      { status: 500 }
    );
  }
}
