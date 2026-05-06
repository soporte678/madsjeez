import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeliAccessTokenForUser } from "@/lib/meli/prisma-session";
import { importMeliItemsForUser, previewMeliItemsForUser } from "@/lib/meli/import-service";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const maxPages = Math.min(Math.max(Number(url.searchParams.get("maxPages") || 10), 1), 30);
    const sampleSize = Math.min(Math.max(Number(url.searchParams.get("sampleSize") || 25), 5), 100);

    const tok = await getMeliAccessTokenForUser(session.user.id);
    if (!tok) {
      return NextResponse.json({ error: "Conectá tu cuenta de Mercado Libre primero." }, { status: 400 });
    }

    const preview = await previewMeliItemsForUser(tok.accessToken, tok.meliUserId, { maxPages, sampleSize });
    return NextResponse.json({ ok: true, preview });
  } catch (e) {
    console.error("meli/import preview:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error en vista previa de importación" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const maxPages =
      typeof body.maxPages === "number" ? body.maxPages : Math.min(parseInt(String(body.maxPages || "10"), 10) || 10, 30);
    const requireConfirm = Boolean(body.requireConfirm);
    const confirmed = Boolean(body.confirmed);

    const tok = await getMeliAccessTokenForUser(session.user.id);
    if (!tok) {
      return NextResponse.json(
        { error: "Conectá tu cuenta de Mercado Libre primero." },
        { status: 400 }
      );
    }

    if (requireConfirm && !confirmed) {
      const preview = await previewMeliItemsForUser(tok.accessToken, tok.meliUserId, {
        maxPages,
        sampleSize: 30,
      });
      return NextResponse.json({
        ok: false,
        needsConfirmation: true,
        preview,
        message: "Revisá la vista previa y confirmá para importar.",
      });
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
