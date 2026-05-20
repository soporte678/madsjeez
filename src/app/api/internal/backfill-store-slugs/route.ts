import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { suggestStoreSlug, isValidStoreSlug } from "@/lib/store-slug";

/**
 * Backfill de tiendas públicas (una vez post-deploy).
 * Header: Authorization: Bearer {ADMIN_SETUP_SECRET} o {CRON_SECRET}
 */
export async function POST(request: NextRequest) {
  const secret =
    process.env.ADMIN_SETUP_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "No configurado" }, { status: 503 });
  }

  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (auth !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      products: { some: { isActive: true, images: { some: {} } } },
    },
    select: { id: true, sellerName: true, name: true, storeSlug: true, isSeller: true },
  });

  let promoted = 0;
  let slugsCreated = 0;

  for (const u of users) {
    if (!u.isSeller) {
      await prisma.user.update({
        where: { id: u.id },
        data: { isSeller: true, sellerSince: new Date() },
      });
      promoted++;
    }
    if (u.storeSlug) continue;

    const base = suggestStoreSlug(u.sellerName || u.name || "tienda", u.id.slice(-6));
    let slug = base;
    for (let n = 0; n < 30; n++) {
      const trySlug = n === 0 ? slug : `${slug}-${n}`.slice(0, 48);
      if (!isValidStoreSlug(trySlug)) continue;
      const taken = await prisma.user.findFirst({ where: { storeSlug: trySlug } });
      if (!taken) {
        await prisma.user.update({ where: { id: u.id }, data: { storeSlug: trySlug } });
        slugsCreated++;
        break;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    usersWithProducts: users.length,
    promotedToSeller: promoted,
    slugsCreated,
  });
}
