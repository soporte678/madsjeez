import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeliAccessTokenForUser } from "@/lib/meli/prisma-session";
import { meliPadsPutCampaign } from "@/lib/meli/pads-api";
import type { AdsApplyPayload } from "@/lib/meli/ads-analyzer";

export const dynamic = "force-dynamic";

const ALLOWED_STATUS = new Set(["active", "paused"]);
const ALLOWED_STRATEGY = new Set(["profitability", "increase", "visibility"]);

function sanitizePayload(raw: unknown): AdsApplyPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" && o.name.trim().length > 0 ? o.name.trim() : null;
  const status = typeof o.status === "string" ? o.status.toLowerCase() : null;
  const strategy = typeof o.strategy === "string" ? o.strategy.toLowerCase() : null;
  const channel = typeof o.channel === "string" ? o.channel : "marketplace";
  const budget = typeof o.budget === "number" ? o.budget : Number(o.budget);
  const roas_target =
    typeof o.roas_target === "number" ? o.roas_target : Number(o.roas_target);

  if (!name || !status || !ALLOWED_STATUS.has(status)) return null;
  if (!strategy || !ALLOWED_STRATEGY.has(strategy)) return null;
  if (!Number.isFinite(budget) || budget < 1 || budget > 5_000_000) return null;
  if (!Number.isFinite(roas_target) || roas_target < 1 || roas_target > 120) return null;

  return {
    name,
    status,
    budget: Math.round(budget * 100) / 100,
    strategy,
    channel: channel === "marketplace" ? "marketplace" : "marketplace",
    roas_target: Math.round(roas_target * 100) / 100,
  };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const meli = await getMeliAccessTokenForUser(session.user.id);
    if (!meli) {
      return NextResponse.json({ error: "Conectá Mercado Libre primero" }, { status: 400 });
    }

    const body = (await req.json()) as {
      actions?: Array<{ siteId: string; campaignId: number; applyPayload: unknown }>;
    };

    const actions = Array.isArray(body.actions) ? body.actions : [];
    if (actions.length === 0) {
      return NextResponse.json({ error: "actions vacío" }, { status: 400 });
    }
    if (actions.length > 15) {
      return NextResponse.json({ error: "Máximo 15 campañas por llamada" }, { status: 400 });
    }

    const results: Array<{ campaignId: number; ok: boolean; status: number; detail?: unknown }> =
      [];

    for (const a of actions) {
      const siteId = typeof a.siteId === "string" ? a.siteId.trim() : "";
      const campaignId = Number(a.campaignId);
      const payload = sanitizePayload(a.applyPayload);
      if (!siteId || !Number.isFinite(campaignId) || campaignId <= 0 || !payload) {
        results.push({
          campaignId: Number(a.campaignId) || 0,
          ok: false,
          status: 400,
          detail: "payload inválido",
        });
        continue;
      }

      const res = await meliPadsPutCampaign(meli.accessToken, siteId, campaignId, payload as Record<string, unknown>);
      results.push({
        campaignId,
        ok: res.ok,
        status: res.status,
        detail: res.ok ? undefined : res.data,
      });
    }

    return NextResponse.json({ results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "apply_error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
