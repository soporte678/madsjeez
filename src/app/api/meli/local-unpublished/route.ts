import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Productos en Prisma del vendedor sin vínculo MLA (candidatos a publicar en ML desde el panel). */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "40", 10), 1), 100);

    const rows = await prisma.product.findMany({
      where: {
        sellerId: session.user.id,
        meliItemId: null,
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        sku: true,
        stock: true,
        price: true,
        isActive: true,
        images: { select: { url: true }, take: 1, orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({
      ok: true,
      items: rows.map((r) => ({
        id: r.id,
        title: r.title,
        sku: r.sku,
        stock: r.stock,
        price: r.price,
        isActive: r.isActive,
        thumbnailUrl: r.images[0]?.url ?? null,
      })),
    });
  } catch (e) {
    console.error("meli/local-unpublished:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al leer catálogo local" },
      { status: 500 }
    );
  }
}
