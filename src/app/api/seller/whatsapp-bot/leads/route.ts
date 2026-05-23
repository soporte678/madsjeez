import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const leads = await prisma.whatsappLead.findMany({
    where: { sellerId: auth.ctx.sellerId },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });

  const byStatus = leads.reduce(
    (acc, l) => {
      acc[l.status] = (acc[l.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    leads: leads.map((l) => ({
      ...l,
      tags: l.tags ?? [],
    })),
    byStatus,
  });
}

export async function POST(req: Request) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const phone = String(body.phone ?? "").replace(/\D/g, "");
  if (phone.length < 8) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  const lead = await prisma.whatsappLead.upsert({
    where: { sellerId_phone: { sellerId: auth.ctx.sellerId, phone } },
    create: {
      sellerId: auth.ctx.sellerId,
      storeId: auth.ctx.sellerId,
      phone,
      name: typeof body.name === "string" ? body.name.slice(0, 120) : null,
      source: "manual",
      status: "new",
      tags: Array.isArray(body.tags) ? body.tags.map(String).slice(0, 12) : [],
    },
    update: {
      name: typeof body.name === "string" ? body.name.slice(0, 120) : undefined,
    },
  });

  return NextResponse.json({ lead }, { status: 201 });
}
