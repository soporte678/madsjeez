/**
 * GET /api/seller/store/stats — estadísticas reales de la tienda del vendedor.
 * Cuenta eventos por tipo (total y últimos 30 días) + top productos por clicks.
 * Datos reales de store_events; sin métricas inventadas.
 */

import { NextResponse } from "next/server";
import type { StoreEventType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateStore } from "@/lib/stores/store-service";

export const dynamic = "force-dynamic";

type Counts = Record<StoreEventType, number>;
const zero = (): Counts => ({ view: 0, product_click: 0, whatsapp_click: 0, share: 0 });

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const store = await getOrCreateStore(userId);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [allRows, recentRows, topRaw] = await Promise.all([
    prisma.storeEvent.groupBy({ by: ["type"], where: { storeId: store.id }, _count: { _all: true } }),
    prisma.storeEvent.groupBy({ by: ["type"], where: { storeId: store.id, createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.storeEvent.groupBy({
      by: ["productId"],
      where: { storeId: store.id, type: "product_click", productId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    }),
  ]);

  const totals = zero();
  for (const r of allRows) totals[r.type] = r._count._all;
  const last30 = zero();
  for (const r of recentRows) last30[r.type] = r._count._all;

  const ids = topRaw.map((t) => t.productId).filter((x): x is string => Boolean(x));
  const products = ids.length
    ? await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })
    : [];
  const titleById = new Map(products.map((p) => [p.id, p.title]));
  const topProducts = topRaw
    .filter((t) => t.productId)
    .map((t) => ({ id: t.productId as string, title: titleById.get(t.productId as string) || "Producto", clicks: t._count._all }));

  return NextResponse.json({ totals, last30, topProducts });
}
