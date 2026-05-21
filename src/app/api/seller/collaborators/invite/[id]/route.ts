import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const invite = await prisma.sellerCollaboratorInvite.findFirst({
    where: { id, ownerUserId: session.user.id },
  });
  if (!invite) {
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
  }

  await prisma.sellerCollaboratorInvite.update({
    where: { id },
    data: { status: "REVOKED" },
  });

  return NextResponse.json({ ok: true });
}
