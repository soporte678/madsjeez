import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  findPublicationDuplicateGroups,
  flattenIdsToRemove,
} from "@/lib/products/publication-dedupe";

export const dynamic = "force-dynamic";

/** POST — detecta y opcionalmente elimina duplicados (≥2 de: título, SKU, precio). */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { dryRun?: boolean };
    const dryRun = body.dryRun !== false;

    const products = await prisma.product.findMany({
      where: { sellerId: session.user.id },
      select: {
        id: true,
        title: true,
        sku: true,
        price: true,
        sales: true,
        views: true,
        meliItemId: true,
        createdAt: true,
        _count: { select: { orderItems: true } },
      },
    });

    const groups = findPublicationDuplicateGroups(
      products.map((p) => ({
        id: p.id,
        title: p.title,
        sku: p.sku,
        price: p.price,
        sales: p.sales,
        views: p.views,
        meliItemId: p.meliItemId,
        createdAt: p.createdAt,
      }))
    );

    const candidateIds = flattenIdsToRemove(groups);
    const blockedByOrders = new Set(
      products.filter((p) => p._count.orderItems > 0 && candidateIds.includes(p.id)).map((p) => p.id)
    );
    const removeIds = candidateIds.filter((id) => !blockedByOrders.has(id));

    if (!dryRun && removeIds.length > 0) {
      await prisma.product.deleteMany({
        where: { id: { in: removeIds }, sellerId: session.user.id },
      });
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      groups: groups.length,
      toRemove: removeIds.length,
      skippedWithOrders: blockedByOrders.size,
      details: groups.map((g) => ({
        keepId: g.keepId,
        removeIds: g.removeIds.filter((id) => removeIds.includes(id) || dryRun),
        matchFields: g.matchFields,
      })),
    });
  } catch (e) {
    console.error("dedupe-duplicates:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al eliminar duplicados" },
      { status: 500 }
    );
  }
}
