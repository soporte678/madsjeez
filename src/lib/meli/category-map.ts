import { prisma } from "@/lib/prisma";
import { meliApi } from "./api";
import type { MeliCategoryNode } from "./types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function fetchMeliCategory(
  accessToken: string,
  meliCategoryId: string
): Promise<MeliCategoryNode | null> {
  const res = await meliApi<MeliCategoryNode>(accessToken, `/categories/${meliCategoryId}`);
  if (!res.ok || !res.data?.id) return null;
  return res.data;
}

export async function ensureFallbackCategory(): Promise<string> {
  let cat = await prisma.category.findFirst({ where: { slug: "general" } });
  if (!cat) {
    cat = await prisma.category.create({
      data: { name: "General", slug: "general", description: "Importación Mercado Libre" },
    });
  }
  return cat.id;
}

/** Árbol de categorías ML → registros locales con meli_category_id. */
export async function resolveCategoryForMeliId(
  meliCategoryId: string,
  accessToken: string
): Promise<string> {
  const existing = await prisma.category.findFirst({
    where: { meliCategoryId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const meliCat = await fetchMeliCategory(accessToken, meliCategoryId);
  if (!meliCat) return ensureFallbackCategory();

  const path =
    meliCat.path_from_root?.length && meliCat.path_from_root.length > 0
      ? meliCat.path_from_root
      : [{ id: meliCat.id, name: meliCat.name }];

  let parentId: string | null = null;
  for (const node of path) {
    const hit = await prisma.category.findFirst({
      where: { meliCategoryId: node.id },
      select: { id: true },
    });
    if (hit) {
      parentId = hit.id;
      continue;
    }

    const slugBase = slugify(node.name);
    const slug = parentId ? `${slugBase}-${node.id.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toLowerCase()}` : slugBase;

    const created = await prisma.category.upsert({
      where: { slug },
      update: { name: node.name, meliCategoryId: node.id, parentId },
      create: {
        name: node.name,
        slug,
        meliCategoryId: node.id,
        parentId,
        description: `Mercado Libre · ${node.id}`,
      },
    });
    parentId = created.id;
  }

  return parentId || ensureFallbackCategory();
}
