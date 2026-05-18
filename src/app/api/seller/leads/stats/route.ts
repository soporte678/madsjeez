import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [invites, leads] = await Promise.all([
    prisma.sellerInvite.findMany({ where: { ownerUserId: session.user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.sellerLead.findMany({
      where: { invite: { ownerUserId: session.user.id } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return NextResponse.json({
    totals: {
      invites: invites.length,
      leads: leads.length,
      activated: leads.filter((x) => x.status === "ACTIVATED" || x.status === "SELLING").length,
      selling: leads.filter((x) => x.status === "SELLING").length,
    },
    invites,
    leads,
  });
}
