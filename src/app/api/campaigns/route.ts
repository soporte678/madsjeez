export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { CampaignType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MAX_FLASH_SALE_MS, MIN_FLASH_SALE_MS } from "@/lib/offers/flash-sales";

// GET /api/campaigns - Listar campañas del vendedor logueado
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: any = {
      sellerId: (session.user as any).id,
    };
    if (status) where.status = status;
    if (type) where.type = type;

    const campaigns = await prisma.campaign.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: "Error al obtener campañas" }, { status: 500 });
  }
}

// POST /api/campaigns - Crear nueva campaña
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      type,
      status = "ACTIVE",
      startDate,
      endDate,
      discountType,
      discountValue,
      minQuantity,
      maxBudget,
      productIds,
      internalAd,
    } = body;

    if (!name || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Nombre, tipo, fecha de inicio y fecha de fin son requeridos" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end.getTime() - start.getTime();

    if (type === CampaignType.FLASH_SALE) {
      if (!productIds?.length) {
        return NextResponse.json(
          { error: "Seleccioná al menos un producto para la oferta relámpago" },
          { status: 400 }
        );
      }
      if (durationMs < MIN_FLASH_SALE_MS || durationMs > MAX_FLASH_SALE_MS) {
        return NextResponse.json(
          {
            error:
              "La oferta relámpago debe durar entre 1 y 48 horas. Definí inicio y fin en el mismo día u horario.",
          },
          { status: 400 }
        );
      }
      if (end <= start) {
        return NextResponse.json(
          { error: "La fecha de fin debe ser posterior al inicio" },
          { status: 400 }
        );
      }
    }

    const campaign = await prisma.campaign.create({
      data: {
        sellerId: (session.user as any).id,
        name,
        description,
        type,
        status,
        startDate: start,
        endDate: end,
        discountType,
        discountValue: discountValue ? parseFloat(discountValue) : 0,
        minQuantity: minQuantity ? parseInt(minQuantity) : null,
        maxBudget: maxBudget ? parseFloat(maxBudget) : null,
        products: productIds?.length
          ? {
              create: productIds.map((pid: string) => ({
                productId: pid,
              })),
            }
          : undefined,
        internalAd: internalAd
          ? {
              create: {
                placement: internalAd.placement,
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
            }
          : undefined,
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

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: "Error al crear campaña" }, { status: 500 });
  }
}
