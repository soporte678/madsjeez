export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/campaigns/:id - Detalle de campaña
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: params.id,
        sellerId: (session.user as any).id,
      },
      include: {
        internalAd: {
          include: {
            events: true,
          },
        },
        products: {
          include: {
            product: {
              include: {
                images: { orderBy: { order: "asc" }, take: 1 },
                seller: { select: { id: true, name: true, sellerName: true } },
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json({ error: "Error al obtener campaña" }, { status: 500 });
  }
}

// PATCH /api/campaigns/:id - Actualizar campaña (status, presupuesto, etc.)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    // spentBudget is intentionally excluded — it's an internal billing field
    // and must only be updated by the payment/billing system, not by sellers.
    const { status, maxBudget, endDate, name, internalAd } = body;

    const existing = await prisma.campaign.findFirst({
      where: {
        id: params.id,
        sellerId: (session.user as any).id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(maxBudget !== undefined && { maxBudget: parseFloat(maxBudget) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(name && { name }),
        ...(internalAd
          ? {
              internalAd: existing
                ? {
                    upsert: {
                      update: {
                        ...(internalAd.placement && { placement: internalAd.placement }),
                        ...(internalAd.pricingModel && { pricingModel: internalAd.pricingModel }),
                        ...(internalAd.shareOfVoice !== undefined && {
                          shareOfVoice: internalAd.shareOfVoice === null ? null : parseInt(String(internalAd.shareOfVoice)),
                        }),
                        ...(internalAd.bannerTitle !== undefined && { bannerTitle: internalAd.bannerTitle || null }),
                        ...(internalAd.bannerSubtitle !== undefined && { bannerSubtitle: internalAd.bannerSubtitle || null }),
                        ...(internalAd.bannerImageUrl !== undefined && { bannerImageUrl: internalAd.bannerImageUrl || null }),
                        ...(internalAd.destinationUrl !== undefined && { destinationUrl: internalAd.destinationUrl || null }),
                        ...(internalAd.rotationIntervalSeconds !== undefined && {
                          rotationIntervalSeconds: parseInt(String(internalAd.rotationIntervalSeconds)),
                        }),
                        ...(internalAd.isActive !== undefined && { isActive: Boolean(internalAd.isActive) }),
                      },
                      create: {
                        placement: internalAd.placement || "HOME_LEADERBOARD",
                        pricingModel: internalAd.pricingModel || "SOV",
                        shareOfVoice: internalAd.shareOfVoice ? parseInt(String(internalAd.shareOfVoice)) : null,
                        bannerTitle: internalAd.bannerTitle || null,
                        bannerSubtitle: internalAd.bannerSubtitle || null,
                        bannerImageUrl: internalAd.bannerImageUrl || null,
                        destinationUrl: internalAd.destinationUrl || null,
                        rotationIntervalSeconds: internalAd.rotationIntervalSeconds
                          ? parseInt(String(internalAd.rotationIntervalSeconds))
                          : 60,
                        isActive: internalAd.isActive ?? true,
                      },
                    },
                  }
                : undefined,
            }
          : {}),
      },
      include: {
        internalAd: {
          include: {
            events: true,
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
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json({ error: "Error al actualizar campaña" }, { status: 500 });
  }
}

// DELETE /api/campaigns/:id - Eliminar campaña
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const existing = await prisma.campaign.findFirst({
      where: {
        id: params.id,
        sellerId: (session.user as any).id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    await prisma.campaign.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json({ error: "Error al eliminar campaña" }, { status: 500 });
  }
}
