import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeliAccessTokenForUser } from "@/lib/meli/prisma-session";
import { prisma } from "@/lib/prisma";
import { meliPutItem } from "@/lib/meli/api";

/**
 * Envía precio y stock del catálogo local a publicaciones existentes en Mercado Libre.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawIds: unknown[] = Array.isArray(body.meliItemIds) ? body.meliItemIds : [];
    const meliItemIds: string[] = [
      ...new Set(
        rawIds.map((x) => String(x).trim()).filter((s: string): s is string => s.length > 0)
      ),
    ];

    if (!meliItemIds.length) {
      return NextResponse.json({ error: "Seleccioná al menos una publicación vinculada (con ID MLA)." }, { status: 400 });
    }

    const tok = await getMeliAccessTokenForUser(session.user.id);
    if (!tok) {
      return NextResponse.json({ error: "Conectá tu cuenta de Mercado Libre primero." }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: {
        sellerId: session.user.id,
        meliItemId: { in: meliItemIds },
      },
      select: { meliItemId: true, price: true, stock: true },
    });

    const byMeli = new Map(products.map((p) => [p.meliItemId as string, p]));
    const results: Array<{ meliItemId: string; ok: boolean; error?: string }> = [];

    for (const mid of meliItemIds) {
      const p = byMeli.get(mid);
      if (!p) {
        results.push({
          meliItemId: mid,
          ok: false,
          error: "No encontramos ese ítem en tu catálogo local o no pertenece a tu cuenta.",
        });
        continue;
      }

      const put = await meliPutItem(tok.accessToken, mid, {
        price: p.price,
        available_quantity: p.stock,
      });

      if (!put.ok) {
        const errBody = put.data as { message?: string; error?: string; cause?: unknown };
        const msg =
          errBody?.message ||
          errBody?.error ||
          `Mercado Libre rechazó la actualización (HTTP ${put.status}).`;
        results.push({ meliItemId: mid, ok: false, error: msg });
      } else {
        results.push({ meliItemId: mid, ok: true });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    console.error("meli/push-items:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al enviar datos a Mercado Libre" },
      { status: 500 }
    );
  }
}
