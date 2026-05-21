import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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
