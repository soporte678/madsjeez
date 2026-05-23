import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseMlaIds } from "@/lib/meli/export-catalog";
import { publishCatalogToMeliAccount } from "@/lib/meli/publish-to-account";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const sourceAccountId =
      typeof body.sourceAccountId === "string" ? body.sourceAccountId.trim() : "";
    const targetAccountId =
      typeof body.targetAccountId === "string" ? body.targetAccountId.trim() : "";

    if (!sourceAccountId || !targetAccountId) {
      return NextResponse.json(
        { error: "Indicá cuenta origen y cuenta destino." },
        { status: 400 }
      );
    }

    const confirmed = body.confirmed === true;
    if (!confirmed) {
      return NextResponse.json(
        { error: "Confirmá la operación (confirmed: true)." },
        { status: 400 }
      );
    }

    const rawMla: unknown[] = Array.isArray(body.meliItemIds) ? body.meliItemIds : [];
    const meliItemIds = parseMlaIds(rawMla.map((x) => String(x)));
    const rawProductIds: unknown[] = Array.isArray(body.productIds) ? body.productIds : [];
    const productIds = [...new Set(rawProductIds.map((x) => String(x).trim()).filter(Boolean))];
    const publishAll = body.publishAll === true;
    const maxItems =
      typeof body.maxItems === "number" ? body.maxItems : publishAll ? 500 : 200;

    const result = await publishCatalogToMeliAccount(session.user.id, {
      sourceAccountId,
      targetAccountId,
      meliItemIds: publishAll ? undefined : meliItemIds.length ? meliItemIds : undefined,
      productIds: productIds.length ? productIds : undefined,
      maxItems,
    });

    const okCount = result.results.filter((r) => r.ok && r.newMla && !r.error?.includes("Ya vinculada")).length;
    const skipCount = result.results.filter((r) => r.ok && r.error?.includes("Ya vinculada")).length;
    const failCount = result.results.filter((r) => !r.ok).length;

    return NextResponse.json({
      ok: failCount === 0,
      published: okCount,
      skipped: skipCount,
      failed: failCount,
      results: result.results,
      errors: result.errors.slice(0, 50),
    });
  } catch (e) {
    console.error("meli/publish-to-account:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al publicar en otra cuenta ML" },
      { status: 500 }
    );
  }
}
