import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeliAccessTokenForUser } from "@/lib/meli/prisma-session";
import { previewMeliItemRowsBatch } from "@/lib/meli/import-service";
import type { MeliListingKind } from "@/lib/meli/listing-kind";

export const dynamic = "force-dynamic";

const MAX_IDS_PER_REQUEST = 40;

function parseListingKind(raw: unknown): MeliListingKind {
  if (raw === "standard" || raw === "catalog" || raw === "all") return raw;
  return "standard";
}

/** POST — detalle de publicaciones ML para mostrar filas en escaneo en vivo. */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const listingKind = parseListingKind(body.listingKind ?? "standard");
    const aid = typeof body.accountId === "string" ? body.accountId : undefined;
    const rawIds = Array.isArray(body.itemIds) ? body.itemIds : [];
    const itemIds = rawIds.map((x) => String(x).trim()).filter(Boolean).slice(0, MAX_IDS_PER_REQUEST);

    if (!itemIds.length) {
      return NextResponse.json({ error: "itemIds vacío" }, { status: 400 });
    }

    const tok = await getMeliAccessTokenForUser(session.user.id, aid);
    if (!tok) {
      return NextResponse.json({ error: "Conectá una cuenta de Mercado Libre primero." }, { status: 400 });
    }

    const result = await previewMeliItemRowsBatch(session.user.id, tok.accessToken, itemIds, {
      listingKind,
    });

    return NextResponse.json({
      ok: true,
      rows: result.rows,
      warnings: result.warnings.slice(0, 20),
      skippedByKind: result.skippedByKind,
      processed: itemIds.length,
    });
  } catch (e) {
    console.error("meli/import/preview-rows:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al leer detalle de publicaciones" },
      { status: 500 }
    );
  }
}
