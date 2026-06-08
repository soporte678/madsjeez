/**
 * POST /api/import/commit
 *
 * Crea los productos normalizados en el catálogo del seller. Incluye imágenes
 * (se guardan las URLs externas tal cual — los CDN de Tienda Nube / Shopify /
 * etc. son públicos y sirven directo en <img>).
 *
 * Body JSON: { rows: NormalizedRow[], platform: string }
 *
 * Sin restricciones de cantidad: importa todo lo que mande el seller.
 * Saltea duplicados por título (case-insensitive) dentro de su catálogo.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NormalizedRow } from "@/lib/import/platforms";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SKU_PREFIX = "MJ-IMP";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.isSeller) {
    return NextResponse.json({ error: "Solo vendedores" }, { status: 403 });
  }
  const sellerId = session.user.id;

  let rows: NormalizedRow[];
  try {
    const body = await req.json();
    rows = body.rows;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No hay productos para importar" }, { status: 400 });
  }

  // Categoría default
  let defaultCategory = await prisma.category.findFirst({ where: { slug: "general" } });
  if (!defaultCategory) {
    defaultCategory = await prisma.category.create({
      data: { name: "General", slug: "general", description: "Categoría general" },
    });
  }

  // Mapa de categorías existentes
  const allCategories = await prisma.category.findMany({ select: { id: true, name: true } });
  const catMap = new Map<string, string>();
  allCategories.forEach((c) => catMap.set(c.name.toLowerCase().trim(), c.id));

  // Duplicados existentes
  const existing = await prisma.product.findMany({
    where: { sellerId },
    select: { title: true, sku: true },
  });
  const existingTitles = new Set(existing.map((p) => p.title.toLowerCase().trim()));

  let skuCounter = 1;
  existing.forEach((p) => {
    const m = p.sku?.match(/MJ-IMP-(\d+)/);
    if (m) skuCounter = Math.max(skuCounter, parseInt(m[1], 10) + 1);
  });

  let imported = 0;
  let skipped = 0;
  let imagesAdded = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const title = (row.title || "").trim();
    if (!title || Number(row.price) <= 0) {
      skipped++;
      continue;
    }
    if (existingTitles.has(title.toLowerCase())) {
      skipped++;
      continue;
    }

    // Resolver categoría (crea si no existe)
    let categoryId = defaultCategory.id;
    if (row.category) {
      const key = row.category.toLowerCase().trim();
      if (catMap.has(key)) {
        categoryId = catMap.get(key)!;
      } else {
        const slug =
          row.category
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .substring(0, 70) || `cat-${skuCounter}`;
        try {
          const newCat = await prisma.category.create({
            data: { name: row.category.substring(0, 80), slug, description: row.category.substring(0, 120) },
          });
          catMap.set(key, newCat.id);
          categoryId = newCat.id;
        } catch {
          /* slug conflict → default */
        }
      }
    }

    const sku = `${SKU_PREFIX}-${String(skuCounter).padStart(6, "0")}`;
    skuCounter++;

    // Imágenes válidas (máx 12 por producto)
    const imageUrls = (row.images || [])
      .filter((u) => /^https?:\/\//i.test(u))
      .slice(0, 12);

    try {
      await prisma.product.create({
        data: {
          title: title.substring(0, 200),
          description: (row.description || `${title} — Producto importado`).substring(0, 5000),
          price: row.price,
          originalPrice: row.originalPrice && row.originalPrice > row.price ? row.originalPrice : null,
          comparePrice: row.originalPrice && row.originalPrice > row.price ? row.originalPrice : null,
          stock: Math.max(0, Math.round(row.stock || 0)),
          sku,
          condition: row.condition === "used" ? "used" : "new",
          isActive: row.isActive !== false,
          isFeatured: false,
          isBoosted: false,
          views: 0,
          sales: 0,
          freeShipping: !!row.freeShipping,
          shippingCost: 0,
          qualityScore: 60,
          hasVideo: false,
          sellerId,
          categoryId,
          images: imageUrls.length
            ? {
                create: imageUrls.map((url, i) => ({
                  url: url.trim(),
                  alt: title.substring(0, 120),
                  order: i,
                })),
              }
            : undefined,
        },
      });
      existingTitles.add(title.toLowerCase());
      imported++;
      imagesAdded += imageUrls.length;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error";
      errors.push(`"${title.substring(0, 40)}": ${msg}`);
    }
  }

  return NextResponse.json({
    ok: true,
    imported,
    skipped,
    imagesAdded,
    errors: errors.length,
    errorDetails: errors.slice(0, 10),
    total: rows.length,
  });
}
