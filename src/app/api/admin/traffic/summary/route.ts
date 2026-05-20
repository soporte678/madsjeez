import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getGa4TrafficSummary } from "@/lib/ga4";

export const dynamic = "force-dynamic";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  const ga4 = await getGa4TrafficSummary().catch(() => null);
  if (ga4) {
    const { rows: eventRows } = await pool.query(
      `select medium, count(*)::int as count
       from web_visits
       where created_at >= now() - interval '30 days'
         and source = 'analytics'
       group by medium`
    );

    const internalEvents = Object.fromEntries(
      eventRows.map((r: { medium: string; count: number }) => [r.medium, r.count])
    );

    return NextResponse.json({
      ...ga4,
      internalEvents,
    });
  }

  const { rows } = await pool.query(
    `select medium, count(*)::int as count
     from web_visits
     where created_at >= now() - interval '30 days'
       and source <> 'analytics'
     group by medium`
  );
  const { rows: eventRows } = await pool.query(
    `select medium, count(*)::int as count
     from web_visits
     where created_at >= now() - interval '30 days'
       and source = 'analytics'
     group by medium`
  );
  const byMedium = Object.fromEntries(
    rows.map((r: { medium: string; count: number }) => [r.medium, r.count])
  );
  const internalEvents = Object.fromEntries(
    eventRows.map((r: { medium: string; count: number }) => [r.medium, r.count])
  );
  const total = Object.values(byMedium).reduce((a, b) => a + Number(b), 0);
  return NextResponse.json({
    source: "web_visits",
    total,
    activeUsers: 0,
    sessions: total,
    pageViews: total,
    eventCount:
      Object.values(internalEvents).reduce((a, b) => a + Number(b), 0) || total,
    organic: byMedium.organic || 0,
    paid:
      (byMedium.cpc || 0) +
      (byMedium.paid || 0) +
      (byMedium.ppc || 0) +
      (byMedium["paid-social"] || 0),
    social: byMedium.social || 0,
    referral: byMedium.referral || 0,
    direct: byMedium.none || 0,
    internalEvents,
  });
}
