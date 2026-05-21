import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rows = await prisma.marketingCollaboratorAccess.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      collaboratorEmail: true,
      accessLevel: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ collaborators: rows });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    accessLevel?: "FULL" | "READ_ONLY";
  };

  const email = (body.email || "").trim().toLowerCase();
  const accessLevel = body.accessLevel === "FULL" ? "FULL" : "READ_ONLY";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  if (email === (session.user.email || "").trim().toLowerCase()) {
    return NextResponse.json({ error: "No podés invitarte a vos mismo" }, { status: 400 });
  }

  const row = await prisma.marketingCollaboratorAccess.upsert({
    where: {
      ownerId_collaboratorEmail: {
        ownerId: session.user.id,
        collaboratorEmail: email,
      },
    },
    create: {
      ownerId: session.user.id,
      collaboratorEmail: email,
      accessLevel,
      isActive: true,
    },
    update: {
      accessLevel,
      isActive: true,
    },
  });

  return NextResponse.json({ collaborator: row });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    accessLevel?: "FULL" | "READ_ONLY";
    isActive?: boolean;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }

  const row = await prisma.marketingCollaboratorAccess.findFirst({
    where: { id: body.id, ownerId: session.user.id },
    select: { id: true },
  });
  if (!row) {
    return NextResponse.json({ error: "Colaborador no encontrado" }, { status: 404 });
  }

  const updated = await prisma.marketingCollaboratorAccess.update({
    where: { id: body.id },
    data: {
      accessLevel: body.accessLevel === "FULL" ? "FULL" : "READ_ONLY",
      ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
    },
  });

  return NextResponse.json({ collaborator: updated });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }

  await prisma.marketingCollaboratorAccess.deleteMany({
    where: {
      id: body.id,
      ownerId: session.user.id,
    },
  });

  return NextResponse.json({ ok: true });
}
