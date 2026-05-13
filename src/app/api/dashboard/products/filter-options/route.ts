import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * GET /api/dashboard/products/filter-options
 * Categorías distintas usadas en las publicaciones del vendedor (Prisma + Supabase).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const map = new Map<string, { id: string; name: string; count: number }>();

    const prismaGroups = await prisma.product.groupBy({
      by: ["categoryId"],
      where: { sellerId: userId },
      _count: { _all: true },
    });

    const prismaCatIds = prismaGroups
      .map((g: { categoryId: string | null }) => g.categoryId)
      .filter((id: string | null): id is string => id != null && id !== "");
    if (prismaCatIds.length) {
      const cats = await prisma.category.findMany({
        where: { id: { in: prismaCatIds } },
        select: { id: true, name: true },
      });
      const nameById = new Map(cats.map((c: { id: string; name: string }) => [c.id, c.name]));
      for (const g of prismaGroups as { categoryId: string | null; _count: { _all: number } }[]) {
        if (!g.categoryId) continue;
        const cid = String(g.categoryId);
        const name = String(nameById.get(cid) ?? "Sin nombre");
        const prev = map.get(cid);
        map.set(cid, {
          id: cid,
          name,
          count: (prev?.count ?? 0) + (g._count?._all ?? 0),
        });
      }
    }

    const supabase = getSupabaseService();
    if (supabase) {
      const { data: supabaseUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle();

      if (supabaseUser?.id) {
        const { data: rows, error } = await supabase
          .from("products")
          .select("category_id, categories:category_id(id,name)")
          .eq("seller_id", supabaseUser.id)
          .not("category_id", "is", null);

        if (!error && rows?.length) {
          for (const row of rows as {
            category_id: string;
            categories?: { id?: string; name?: string } | null;
          }[]) {
            const cid = row.category_id;
            const name = row.categories?.name ?? "Sin nombre";
            const prev = map.get(cid);
            map.set(cid, {
              id: cid,
              name,
              count: (prev?.count ?? 0) + 1,
            });
          }
        }
      }
    }

    const categories = [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" })
    );

    return NextResponse.json({ categories });
  } catch (e) {
    console.error("filter-options:", e);
    return NextResponse.json({ error: "Error al cargar opciones de filtro" }, { status: 500 });
  }
}
