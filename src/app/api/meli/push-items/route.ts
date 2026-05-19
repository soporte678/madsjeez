import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pushProductsToMeli } from "@/lib/meli/push-service";

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
      return NextResponse.json(
        { error: "Seleccioná al menos una publicación vinculada (con ID MLA)." },
        { status: 400 }
      );
    }

    const accountId = typeof body.accountId === "string" ? body.accountId : undefined;
    const results = await pushProductsToMeli(session.user.id, meliItemIds, { accountId });

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    console.error("meli/push-items:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al enviar datos a Mercado Libre" },
      { status: 500 }
    );
  }
}
