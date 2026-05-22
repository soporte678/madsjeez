import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeliAccessTokenForUser } from "@/lib/meli/prisma-session";
import {
  importMeliItemsForUser,
  listMeliItemIdsForUser,
  previewMeliItemsForUser,
} from "@/lib/meli/import-service";
import { resolveMeliScrollMaxPages } from "@/lib/meli/import-scroll";
import type { MeliListingKind } from "@/lib/meli/listing-kind";
import { prisma } from "@/lib/prisma";

function parseListingKind(raw: unknown): MeliListingKind {
  if (raw === "standard" || raw === "catalog" || raw === "all") return raw;
  return "all";
}

function accountIdFrom(body: Record<string, unknown>, url: URL): string | undefined {
  const b = typeof body.accountId === "string" ? body.accountId : undefined;
  const q = url.searchParams.get("accountId") || undefined;
  return b || q || undefined;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "preview";
    const importAllScan = url.searchParams.get("importAll") === "1" || url.searchParams.get("maxPages") === "0";
    const maxPages = resolveMeliScrollMaxPages(url.searchParams.get("maxPages"), { importAll: importAllScan });
    const sampleSize = Math.min(Math.max(Number(url.searchParams.get("sampleSize") || 80), 5), 500);
    const aid = url.searchParams.get("accountId") || undefined;
    const listingKind = parseListingKind(url.searchParams.get("listingKind") || "standard");

    const tok = await getMeliAccessTokenForUser(session.user.id, aid);
    if (!tok) {
      return NextResponse.json({ error: "Conectá una cuenta de Mercado Libre primero." }, { status: 400 });
    }

    const oauth = await prisma.sellerMeliOAuth.findUnique({
      where: { id: tok.accountId },
      select: { lastCatalogImportAt: true, meliUserId: true, nickname: true, label: true },
    });

    if (mode === "ids") {
      const listed = await listMeliItemIdsForUser(tok.accessToken, tok.meliUserId, {
        maxPages,
        listingKind,
        importAll: importAllScan,
      });
      return NextResponse.json({
        ok: true,
        accountId: tok.accountId,
        meliUserId: tok.meliUserId,
        listingKind,
        itemIds: listed.ids,
        total: listed.ids.length,
        pagesScanned: listed.pages,
        pagingTotal: listed.pagingTotal,
        warnings: listed.warnings,
      });
    }

    const preview = await previewMeliItemsForUser(session.user.id, tok.accessToken, tok.meliUserId, {
      maxPages,
      sampleSize,
      listingKind,
      importAll: importAllScan,
    });

    return NextResponse.json({
      ok: true,
      accountId: tok.accountId,
      meliUserId: tok.meliUserId,
      accountLabel: oauth?.label || oauth?.nickname || oauth?.meliUserId,
      listingKind,
      preview,
      lastSuccessfulImportAt: oauth?.lastCatalogImportAt?.toISOString() ?? null,
    });
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

    const url = new URL(req.url);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const importAll = Boolean(body.importAll);
    const maxPages = resolveMeliScrollMaxPages(body.maxPages, { importAll });
    const requireConfirm = Boolean(body.requireConfirm);
    const confirmed = Boolean(body.confirmed);
    const persistImages = body.persistImages !== false;
    const aid = accountIdFrom(body, url);
    const listingKind = parseListingKind(body.listingKind ?? "standard");
    const itemIds = importAll
      ? undefined
      : Array.isArray(body.itemIds)
        ? body.itemIds.map((x: unknown) => String(x)).filter(Boolean)
        : undefined;

    const tok = await getMeliAccessTokenForUser(session.user.id, aid);
    if (!tok) {
      return NextResponse.json(
        { error: "Conectá una cuenta de Mercado Libre primero." },
        { status: 400 }
      );
    }

    if (requireConfirm && !confirmed) {
      const preview = await previewMeliItemsForUser(session.user.id, tok.accessToken, tok.meliUserId, {
        maxPages,
        sampleSize: 50,
        listingKind,
      });
      return NextResponse.json({
        ok: false,
        needsConfirmation: true,
        listingKind,
        preview,
        message: "Revisá la vista previa y confirmá para importar.",
      });
    }

    const result = await importMeliItemsForUser(
      session.user.id,
      tok.accountId,
      tok.accessToken,
      tok.meliUserId,
      {
        maxPages,
        persistImages,
        listingKind,
        importAll: importAll && !itemIds?.length,
        ...(itemIds?.length ? { itemIds } : {}),
      }
    );

    const anyOk = result.itemResults.some((r) => r.ok);
    if (anyOk) {
      await prisma.sellerMeliOAuth.update({
        where: { id: tok.accountId },
        data: { lastCatalogImportAt: new Date() },
      });
    }

    return NextResponse.json({
      ok: true,
      accountId: tok.accountId,
      listingKind,
      importAll,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      totalListed: result.totalListed ?? null,
      pagesScanned: result.pagesScanned ?? null,
      errors: result.errors.slice(0, 50),
      errorCount: result.errors.length,
      itemResults: result.itemResults.slice(0, 200),
      itemResultsTruncated: result.itemResults.length > 200,
    });
  } catch (e) {
    console.error("meli/import:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al importar" },
      { status: 500 }
    );
  }
}
