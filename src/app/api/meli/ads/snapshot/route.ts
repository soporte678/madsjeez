import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeliAccessTokenForUser } from "@/lib/meli/prisma-session";
import { meliGetSellerPromotions } from "@/lib/meli/api";
import {
  meliPadsListAdvertisers,
  meliPadsSearchCampaignsBasic,
  meliPadsSearchCampaignsWithMetrics,
  type MeliPadsCampaignRow,
} from "@/lib/meli/pads-api";
import { analyzePadsCampaigns } from "@/lib/meli/ads-analyzer";

export const dynamic = "force-dynamic";

type CampaignEnriched = MeliPadsCampaignRow & { site_id: string; advertiser_id: number };

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const meli = await getMeliAccessTokenForUser(session.user.id);
    if (!meli) {
      return NextResponse.json({ error: "Conectá Mercado Libre primero" }, { status: 400 });
    }

    const url = new URL(req.url);
    const analyze = url.searchParams.get("analyze") === "1";
    const days = Math.min(90, Math.max(7, Number(url.searchParams.get("days")) || 14));

    const errors: string[] = [];
    const advRes = await meliPadsListAdvertisers(meli.accessToken);
    const advertisers = advRes.data?.advertisers ?? [];
    if (!advRes.ok) {
      errors.push(`PADS advertisers HTTP ${advRes.status}`);
    }

    const campaigns: CampaignEnriched[] = [];
    const metricsSummaryByAdvertiser: Record<string, unknown> = {};

    for (const adv of advertisers) {
      let camp = await meliPadsSearchCampaignsWithMetrics(
        meli.accessToken,
        adv.site_id,
        adv.advertiser_id,
        days,
        0,
        50
      );
      if (!camp.ok || !(camp.data.results?.length)) {
        if (!camp.ok) {
          errors.push(`Campañas con métricas (${adv.advertiser_id}): HTTP ${camp.status}`);
        }
        camp = await meliPadsSearchCampaignsBasic(
          meli.accessToken,
          adv.site_id,
          adv.advertiser_id,
          0,
          50
        );
        if (!camp.ok) {
          errors.push(`Campañas básicas (${adv.advertiser_id}): HTTP ${camp.status}`);
          continue;
        }
      }

      if (camp.data.metrics_summary != null) {
        metricsSummaryByAdvertiser[String(adv.advertiser_id)] = camp.data.metrics_summary;
      }

      for (const row of camp.data.results ?? []) {
        const r = row as MeliPadsCampaignRow;
        campaigns.push({
          ...r,
          site_id: adv.site_id,
          advertiser_id: adv.advertiser_id,
        });
      }
    }

    let promotions: unknown = null;
    const promoRes = await meliGetSellerPromotions(meli.accessToken, meli.meliUserId);
    if (promoRes.ok) promotions = promoRes.data;

    let recommendations: ReturnType<typeof analyzePadsCampaigns> = [];
    if (analyze && campaigns.length > 0) {
      recommendations = analyzePadsCampaigns({
        advertisers,
        campaigns,
      });
    }

    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      metricsDays: days,
      advertisers,
      campaigns,
      metricsSummaryByAdvertiser,
      promotions,
      recommendations,
      errors,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "snapshot_error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
