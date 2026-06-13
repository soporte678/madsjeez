/**
 * /api/seller/store/domains — dominios propios de la tienda del vendedor.
 *   GET  → lista de dominios + instrucciones DNS por dominio.
 *   POST → agrega un dominio personalizado (gateado a plan Premium/PLATINUM).
 * SSL no se activa todavía (Fase 5 de infra): los verificados quedan en ssl_pending.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateStore } from "@/lib/stores/store-service";
import { getEffectiveTier } from "@/lib/subscription/effective-tier";
import {
  validateCustomDomain, generateVerificationToken, domainTaken, dnsInstructions,
} from "@/lib/stores/domain-service";

export const dynamic = "force-dynamic";

async function premium(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionTier: true, subscriptionExpiry: true } });
  try {
    return getEffectiveTier({ subscriptionTier: u?.subscriptionTier ?? "FREE", subscriptionExpiry: u?.subscriptionExpiry ?? null, trialEndsAt: null }).tier === "PLATINUM";
  } catch {
    return (u?.subscriptionTier ?? "FREE") === "PLATINUM";
  }
}

function serialize(d: { id: string; domain: string; type: string; verificationToken: string; dnsStatus: string; sslStatus: string; isPrimary: boolean; verifiedAt: Date | null }) {
  return {
    id: d.id, domain: d.domain, type: d.type, dnsStatus: d.dnsStatus, sslStatus: d.sslStatus,
    isPrimary: d.isPrimary, verifiedAt: d.verifiedAt,
    instructions: dnsInstructions(d.domain, d.verificationToken),
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const store = await getOrCreateStore(userId);
  const domains = await prisma.storeDomain.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ domains: domains.map(serialize), premium: await premium(userId) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!(await premium(userId))) {
    return NextResponse.json({ error: "El dominio propio está disponible en el plan Premium." }, { status: 402 });
  }

  let body: { domain?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const v = validateCustomDomain(body.domain || "");
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const store = await getOrCreateStore(userId);
  if (await domainTaken(v.domain, store.id)) {
    return NextResponse.json({ error: "Ese dominio ya está en uso por otra tienda." }, { status: 409 });
  }

  const created = await prisma.storeDomain.create({
    data: {
      storeId: store.id,
      domain: v.domain,
      type: "custom",
      verificationToken: generateVerificationToken(),
      dnsStatus: "dns_pending",
      sslStatus: "pending",
    },
  });
  return NextResponse.json({ domain: serialize(created) }, { status: 201 });
}
