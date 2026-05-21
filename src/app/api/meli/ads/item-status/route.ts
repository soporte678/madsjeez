import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveMarketingAccess } from "@/lib/marketing/access";
import { getMeliAccessTokenForUser } from "@/lib/meli/prisma-session";
import { meliPadsPutAdStatus } from "@/lib/meli/pads-api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const access = await resolveMarketingAccess(session.user.id, session.user.email);
    if (access.permission !== "FULL") {
      return NextResponse.json({ error: "Acceso solo lectura: no podés modificar productos" }, { status: 403 });
    }

    const body = (await req.json()) as {
      siteId?: string;
      advertiserId?: number;
      campaignId?: number;
      itemId?: string;
      status?: "active" | "paused";
    };

    const siteId = String(body.siteId || "").trim();
    const advertiserId = Number(body.advertiserId);
    const campaignId = Number(body.campaignId);
    const itemId = String(body.itemId || "").trim();
    const status = body.status === "paused" ? "paused" : "active";

    if (!siteId || !Number.isFinite(advertiserId) || advertiserId <= 0 || !itemId) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const meli = await getMeliAccessTokenForUser(access.ownerUserId);
    if (!meli) return NextResponse.json({ error: "Conectá Mercado Libre primero" }, { status: 400 });

    const res = await meliPadsPutAdStatus(meli.accessToken, siteId, advertiserId, itemId, {
      status,
      ...(Number.isFinite(campaignId) && campaignId > 0 ? { campaign_id: campaignId } : {}),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `ML Ads item update HTTP ${res.status}`, detail: res.data },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "item_status_error" },
      { status: 500 }
    );
  }
}
