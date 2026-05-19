import { NextResponse } from "next/server";
import { getCategoryCatalog } from "@/lib/categoryCatalog";
import { getCategoryVisual } from "@/lib/category-icon-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await getCategoryCatalog();
    const items: {
      id: string;
      name: string;
      slug: string;
      kind: "category" | "subcategory";
      parentName?: string;
      iconName: string;
      accent: string;
      ring: string;
    }[] = [];

    for (const cat of catalog) {
      const visual = getCategoryVisual(cat.slug);
      items.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        kind: "category",
        iconName: visual.iconName,
        accent: visual.accent,
        ring: visual.ring,
      });
      for (const child of cat.children) {
        const childVisual = getCategoryVisual(child.slug);
        items.push({
          id: child.id,
          name: child.name,
          slug: child.slug,
          kind: "subcategory",
          parentName: cat.name,
          iconName: childVisual.iconName,
          accent: childVisual.accent,
          ring: childVisual.ring,
        });
      }
    }

    return NextResponse.json({
      items,
      total: items.length,
    });
  } catch (error) {
    console.error("carousel categories:", error);
    return NextResponse.json({ error: "Failed to load carousel categories" }, { status: 500 });
  }
}
