/**
 * GET /api/seller/store/slug-check?slug=...  → disponibilidad en tiempo real.
 * Valida formato + reservados + unicidad (vs otras tiendas y storeSlug legacy).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugifyStoreName } from "@/lib/store-slug";
import { validateStoreSlug } from "@/lib/stores/reserved-slugs";
import { isSlugTaken } from "@/lib/stores/store-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const raw = new URL(req.url).searchParams.get("slug") || "";
  const v = validateStoreSlug(slugifyStoreName(raw));
  if (!v.ok) return NextResponse.json({ available: false, slug: null, error: v.error });

  const taken = await isSlugTaken(v.slug, userId);
  return NextResponse.json({ available: !taken, slug: v.slug, error: taken ? "Ya está en uso." : null });
}
