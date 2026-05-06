import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeliAccessTokenForUser } from "@/lib/meli/prisma-session";
import { importMeliItemsForUser } from "@/lib/meli/import-service";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const maxPages =
      typeof body.maxPages === "number" ? body.maxPages : Math.min(parseInt(String(body.maxPages || "10"), 10) || 10, 30);

    const tok = await getMeliAccessTokenForUser(session.user.id);
    if (!tok) {
      return NextResponse.json(
        { error: "Conectá tu cuenta de Mercado Libre primero." },
        { status: 400 }
      );
    }

    const result = await importMeliItemsForUser(
      session.user.id,
      tok.accessToken,
      tok.meliUserId,
      { maxPages }
    );

    return NextResponse.json({
      ok: true,
      imported: result.imported,
      updated: result.updated,
      errors: result.errors.slice(0, 50),
      errorCount: result.errors.length,
    });
  } catch (e) {
    console.error("meli/import:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al importar" },
      { status: 500 }
    );
  }
}
