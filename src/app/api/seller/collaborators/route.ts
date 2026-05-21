import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Listado de invitaciones pendientes y colaboradores activos del vendedor actual. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ownerUserId = session.user.id;

  const [invites, members] = await Promise.all([
    prisma.sellerCollaboratorInvite.findMany({
      where: {
        ownerUserId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        permissions: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    prisma.sellerCollaborator.findMany({
      where: { ownerUserId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        permissions: true,
        createdAt: true,
        member: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return NextResponse.json({
    invites,
    members,
  });
}
