export const dynamic = "force-dynamic";

import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Auth gate: block unauthenticated automation silently
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: true });
    }

    const body = (await req.json()) as {
      internalAdCampaignId?: string;
      eventType?: "IMPRESSION" | "CLICK";
      slotKey?: string;
      pagePath?: string;
    };

    if (!body.internalAdCampaignId || !body.eventType) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const ua = req.headers.get("user-agent") || "";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    // Rate limit: max 60 ad events per minute per IP
    const rl = rateLimit(`ad-event:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ ok: true }); // silent drop
    }
    const visitorHash = createHash("sha256").update(`${ip}:${ua}`).digest("hex").slice(0, 24);

    await prisma.internalAdEvent.create({
      data: {
        internalAdCampaignId: body.internalAdCampaignId,
        eventType: body.eventType,
        slotKey: body.slotKey || null,
        pagePath: body.pagePath || null,
        visitorHash,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Internal ad event error:", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
