import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeliAccessTokenForUser } from "@/lib/meli/prisma-session";
import { meliPadsDateRange, meliPadsSearchAds } from "@/lib/meli/pads-api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const meli = await getMeliAccessTokenForUser(session.user.id);
    if (!meli) return NextResponse.json({ error: "Conectá Mercado Libre primero" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const siteId = String(searchParams.get("siteId") || "").trim();
    const advertiserId = Number(searchParams.get("advertiserId"));
    const campaignId = Number(searchParams.get("campaignId"));
    const days = Math.min(90, Math.max(1, Number(searchParams.get("days")) || 14));
    if (!siteId || !Number.isFinite(advertiserId) || advertiserId <= 0 || !Number.isFinite(campaignId) || campaignId <= 0) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const { date_from, date_to } = meliPadsDateRange(days);
    const adsRes = await meliPadsSearchAds(meli.accessToken, siteId, advertiserId, date_from, date_to, campaignId, 0, 100);
    if (!adsRes.ok) {
      return NextResponse.json({ error: `Ads search HTTP ${adsRes.status}`, detail: adsRes.data }, { status: 400 });
    }
    const all = adsRes.data?.results ?? [];
    const items = all.filter((x) => Number(x.campaign_id) === campaignId || !x.campaign_id);
    return NextResponse.json({ items, count: items.length });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "campaign_items_error" }, { status: 500 });
  }
}

