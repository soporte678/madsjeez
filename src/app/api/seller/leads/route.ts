import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Anti-spam: máximo 5 envíos por IP cada 10 minutos.
  const rl = checkRateLimit(`seller-leads:${clientIpFromRequest(req)}`, { max: 5, windowMs: 600_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiados envíos. Probá de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    inviteCode?: string;
    email?: string;
    fullName?: string;
    phone?: string;
    businessName?: string;
    businessType?: string;
    monthlyCatalog?: number;
    message?: string;
  };

  const email = body.email?.trim().toLowerCase() || "";
  const fullName = body.fullName?.trim() || "";
  if (!email || !fullName) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });

  const existing = await prisma.sellerLead.findFirst({ where: { email } });
  if (existing) return NextResponse.json({ lead: existing, deduped: true });

  const inviteCode = body.inviteCode?.trim().toUpperCase() || null;
  const lead = await prisma.sellerLead.create({
    data: {
      inviteCode,
      email,
      fullName,
      phone: body.phone?.trim() || null,
      businessName: body.businessName?.trim() || null,
      businessType: body.businessType?.trim() || null,
      monthlyCatalog: typeof body.monthlyCatalog === "number" ? body.monthlyCatalog : null,
      message: body.message?.trim() || null,
    },
  });

  if (inviteCode) {
    await prisma.sellerInvite.updateMany({
      where: { code: inviteCode },
      data: { signups: { increment: 1 } },
    });
  }

  return NextResponse.json({ lead }, { status: 201 });
}
