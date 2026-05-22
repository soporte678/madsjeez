import { NextRequest, NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { getWhatsappMetrics, type MetricsPeriod } from "@/lib/whatsapp-bot/metrics-service";

export async function GET(req: NextRequest) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const period = (req.nextUrl.searchParams.get("period") ?? "7d") as MetricsPeriod;
  const valid: MetricsPeriod[] = ["today", "7d", "30d"];
  const p = valid.includes(period) ? period : "7d";

  const metrics = await getWhatsappMetrics(auth.ctx.sellerId, p);
  return NextResponse.json({ metrics });
}
