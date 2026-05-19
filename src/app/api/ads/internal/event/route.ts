export const dynamic = "force-dynamic";

import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
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
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "na";
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
