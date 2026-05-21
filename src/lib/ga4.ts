import { GoogleAuth } from "google-auth-library";

type Ga4ChannelBreakdown = {
  total: number;
  organic: number;
  paid: number;
  social: number;
  referral: number;
  direct: number;
};

export type Ga4TrafficSummary = Ga4ChannelBreakdown & {
  source: "ga4";
  activeUsers: number;
  sessions: number;
  pageViews: number;
  eventCount: number;
};

type RunReportResponse = {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
};

const GA4_SCOPE = ["https://www.googleapis.com/auth/analytics.readonly"];

function readServiceAccountJson() {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseMetric(value?: string) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeChannel(channel: string) {
  const value = channel.toLowerCase();
  if (value.includes("organic")) return "organic";
  if (
    value.includes("paid") ||
    value.includes("cross-network") ||
    value.includes("display") ||
    value.includes("shopping")
  ) {
    return "paid";
  }
  if (
    value.includes("social") ||
    value.includes("video") ||
    value.includes("social network")
  ) {
    return "social";
  }
  if (value.includes("referral")) return "referral";
  if (value.includes("direct")) return "direct";
  return "other";
}

async function runGa4Report(body: Record<string, unknown>) {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const credentials = readServiceAccountJson();
  if (!propertyId || !credentials) return null;

  const auth = new GoogleAuth({
    credentials,
    scopes: GA4_SCOPE,
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const accessToken =
    typeof token === "string" ? token : token.token ? token.token : null;

  if (!accessToken) {
    throw new Error("No se pudo obtener access token para GA4");
  }

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GA4 runReport ${response.status}: ${text}`);
  }

  return (await response.json()) as RunReportResponse;
}

export async function getGa4TrafficSummary(): Promise<Ga4TrafficSummary | null> {
  const totalsReport = await runGa4Report({
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "eventCount" },
    ],
  });

  const channelsReport = await runGa4Report({
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }],
    limit: 20,
  });

  if (!totalsReport?.rows?.length) return null;

  const totalRow = totalsReport.rows[0];
  const activeUsers = parseMetric(totalRow.metricValues?.[0]?.value);
  const sessions = parseMetric(totalRow.metricValues?.[1]?.value);
  const pageViews = parseMetric(totalRow.metricValues?.[2]?.value);
  const eventCount = parseMetric(totalRow.metricValues?.[3]?.value);

  const breakdown: Ga4ChannelBreakdown = {
    total: sessions,
    organic: 0,
    paid: 0,
    social: 0,
    referral: 0,
    direct: 0,
  };

  for (const row of channelsReport?.rows || []) {
    const channel = row.dimensionValues?.[0]?.value || "";
    const value = parseMetric(row.metricValues?.[0]?.value);
    const normalized = normalizeChannel(channel);

    switch (normalized) {
      case "organic":
        breakdown.organic += value;
        break;
      case "paid":
        breakdown.paid += value;
        break;
      case "social":
        breakdown.social += value;
        break;
      case "referral":
        breakdown.referral += value;
        break;
      case "direct":
        breakdown.direct += value;
        break;
      default:
        break;
    }
  }

  return {
    source: "ga4",
    activeUsers,
    sessions,
    pageViews,
    eventCount,
    ...breakdown,
  };
}
