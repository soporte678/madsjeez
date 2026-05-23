import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeliAccessTokenForUser } from "@/lib/meli/prisma-session";
import { fetchMeliItemIdsPage } from "@/lib/meli/import-scroll";
import type { MeliListingKind } from "@/lib/meli/listing-kind";

export const dynamic = "force-dynamic";

function parseListingKind(raw: unknown): MeliListingKind {
  if (raw === "standard" || raw === "catalog" || raw === "all") return raw;
  return "standard";
}

/** GET — una página del scan ML (scroll). Query: accountId, listingKind, scrollId (opcional). */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const aid = url.searchParams.get("accountId") || undefined;
    const listingKind = parseListingKind(url.searchParams.get("listingKind") || "standard");
    const scrollId = url.searchParams.get("scrollId") || undefined;

    const tok = await getMeliAccessTokenForUser(session.user.id, aid);
    if (!tok) {
      return NextResponse.json({ error: "Conectá una cuenta de Mercado Libre primero." }, { status: 400 });
    }

    const page = await fetchMeliItemIdsPage(tok.accessToken, tok.meliUserId, listingKind, scrollId);

    if (!page.ids.length && page.status !== 200) {
      return NextResponse.json(
        { error: `Mercado Libre respondió HTTP ${page.status}`, status: page.status },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      accountId: tok.accountId,
      listingKind,
      ids: page.ids,
      scrollId: page.nextScrollId,
      done: page.done,
      pagingTotal: page.pagingTotal,
      countThisPage: page.ids.length,
    });
  } catch (e) {
    console.error("meli/import/scan:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error en escaneo ML" },
      { status: 500 }
    );
  }
}
