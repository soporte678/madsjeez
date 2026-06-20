export const dynamic = "force-dynamic";

import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function hashToInt(input: string) {
  const hex = createHash("sha256").update(input).digest("hex").slice(0, 12);
  return parseInt(hex, 16);
}

function pickWeighted<T extends { weight: number }>(items: T[], seed: string) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return items[0] ?? null;
  const target = hashToInt(seed) % total;
  let acc = 0;
  for (const item of items) {
    acc += item.weight;
    if (target < acc) return item;
  }
  return items[0] ?? null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get("placement") || "HOME_LEADERBOARD";
    const slotKey = searchParams.get("slotKey") || "default";
    const pagePath = searchParams.get("pagePath") || "/";
    const now = new Date();
    const minuteBucket = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;

    const campaigns = await prisma.internalAdCampaign.findMany({
      where: {
        placement: placement as any,
        isActive: true,
        campaign: {
          status: "ACTIVE",
          startDate: { lte: now },
          endDate: { gte: now },
        },
      },
      include: {
        campaign: {
          include: {
            seller: {
              select: {
                sellerName: true,
                name: true,
              },
            },
            products: {
              include: {
                product: {
                  include: {
                    images: { orderBy: { order: "asc" }, take: 1 },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const candidates = campaigns
      .map((entry) => {
        const productEntry =
          entry.campaign.products.find(
            (item) =>
              item.product &&
              item.product.isActive &&
              item.product.stock > 0 &&
              item.product.images?.[0]?.url
          ) ??
          entry.campaign.products.find((item) => item.product && item.product.isActive && item.product.stock > 0) ??
          entry.campaign.products[0];
        const product = productEntry?.product;
        if (!product || !product.isActive || product.stock <= 0) return null;
        const baseWeight = Math.max(1, Math.round(Number(entry.campaign.maxBudget || 0) / 10000));
        const sovWeight = entry.shareOfVoice ? Math.max(1, entry.shareOfVoice) : 1;
        return {
          id: entry.id,
          campaignId: entry.campaignId,
          weight: baseWeight * sovWeight,
          pricingModel: entry.pricingModel,
          rotationIntervalSeconds: entry.rotationIntervalSeconds,
          title: entry.bannerTitle || entry.campaign.name,
          subtitle: entry.bannerSubtitle || product.title,
          imageUrl: entry.bannerImageUrl || product.images?.[0]?.url || null,
          href: entry.destinationUrl || `/product/${product.id}`,
          sellerName: entry.campaign.seller.sellerName || entry.campaign.seller.name || "Vendedor",
          budget: Number(entry.campaign.maxBudget || 0),
          productTitle: product.title,
          pagePath,
          slotKey,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      campaignId: string;
      weight: number;
      pricingModel: string;
      rotationIntervalSeconds: number;
      title: string;
      subtitle: string;
      imageUrl: string | null;
      href: string;
      sellerName: string;
      budget: number;
      productTitle: string;
      pagePath: string;
      slotKey: string;
    }>;

    if (!candidates.length) {
      return NextResponse.json({ ad: null });
    }

    const selected = pickWeighted(candidates, `${placement}:${slotKey}:${minuteBucket}`);

    // Strip sensitive competitive data from the public response
    const session = await getServerSession(authOptions);
    const safeAd = selected
      ? {
          id: selected.id,
          campaignId: selected.campaignId,
          pricingModel: selected.pricingModel,
          rotationIntervalSeconds: selected.rotationIntervalSeconds,
          title: selected.title,
          subtitle: selected.subtitle,
          imageUrl: selected.imageUrl,
          href: selected.href,
          sellerName: selected.sellerName,
          productTitle: selected.productTitle,
          pagePath: selected.pagePath,
          slotKey: selected.slotKey,
          // budget / weight / shareOfVoice only for the seller's own analytics session
          ...(session ? { budget: selected.budget, weight: selected.weight } : {}),
        }
      : null;

    return NextResponse.json({
      ad: safeAd,
      rotationIntervalSeconds: selected?.rotationIntervalSeconds || 60,
    });
  } catch (error) {
    console.error("Internal ads error:", error);
    return NextResponse.json({ ad: null }, { status: 200 });
  }
}
