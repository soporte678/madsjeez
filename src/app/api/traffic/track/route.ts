import { randomUUID, createHash } from "crypto";
import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function parseTraffic(url: URL, referrer: string | null) {
  const utmSource = url.searchParams.get("utm_source")?.toLowerCase() || "";
  const utmMedium = url.searchParams.get("utm_medium")?.toLowerCase() || "";
  const utmCampaign = url.searchParams.get("utm_campaign") || null;

  if (utmSource || utmMedium) return { source: utmSource || "campaign", medium: utmMedium || "campaign", campaign: utmCampaign };
  if (!referrer) return { source: "direct", medium: "none", campaign: null };
  const host = new URL(referrer).hostname.toLowerCase();
  if (host.includes("google") || host.includes("bing")) return { source: host, medium: "organic", campaign: null };
  if (host.includes("facebook") || host.includes("instagram") || host.includes("tiktok")) return { source: host, medium: "social", campaign: null };
  return { source: host, medium: "referral", campaign: null };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      path?: string;
      referrer?: string | null;
      eventName?: string;
    };
    const url = new URL(req.url);
    const parsed = parseTraffic(url, body.referrer || null);
    const ua = req.headers.get("user-agent");
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "na";
    const visitorHash = createHash("sha256").update(`${ip}:${ua || ""}`).digest("hex").slice(0, 24);
    const isAnalyticsEvent =
      typeof body.eventName === "string" && body.eventName.trim().length > 0;

    const source = isAnalyticsEvent ? "analytics" : parsed.source;
    const medium = isAnalyticsEvent ? body.eventName!.trim() : parsed.medium;
    const campaign = isAnalyticsEvent ? null : parsed.campaign;
    const path = isAnalyticsEvent
      ? `/__analytics__/${body.eventName!.trim()}`
      : body.path || "/";

    await pool.query(
      `insert into web_visits (id, path, source, medium, campaign, referrer, user_agent, visitor_hash)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        randomUUID(),
        path,
        source,
        medium,
        campaign,
        body.referrer || null,
        ua,
        visitorHash,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as { code: string }).code)
        : "";
    if (code === "42P01") {
      console.warn("[traffic/track] web_visits no existe aún; migración pendiente");
    }
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
