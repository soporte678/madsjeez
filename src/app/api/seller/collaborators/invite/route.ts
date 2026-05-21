import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePermissionsMap } from "@/lib/collaborators/sections";

export const dynamic = "force-dynamic";

const INVITE_TTL_DAYS = 14;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const emailRaw = typeof body === "object" && body !== null ? (body as { email?: unknown }).email : undefined;
  const permsRaw =
    typeof body === "object" && body !== null ? (body as { permissions?: unknown }).permissions : undefined;

  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const permissions = sanitizePermissionsMap(permsRaw);
  if (Object.keys(permissions).length === 0) {
    return NextResponse.json(
      { error: "Seleccioná al menos una sección con permiso de lectura o lectura y escritura" },
      { status: 400 }
    );
  }

  const ownerUserId = session.user.id;

  const owner = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: { email: true },
  });
  if (owner?.email?.toLowerCase() === email) {
    return NextResponse.json({ error: "No podés invitarte a vos mismo" }, { status: 400 });
  }

  const existingMember = await prisma.sellerCollaborator.findFirst({
    where: {
      ownerUserId,
      member: { email },
    },
  });
  if (existingMember) {
    return NextResponse.json({ error: "Ese usuario ya es colaborador de tu cuenta" }, { status: 409 });
  }

  const pendingSameEmail = await prisma.sellerCollaboratorInvite.findFirst({
    where: {
      ownerUserId,
      email,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });
  if (pendingSameEmail) {
    return NextResponse.json({ error: "Ya hay una invitación pendiente para ese email" }, { status: 409 });
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

  const invite = await prisma.sellerCollaboratorInvite.create({
    data: {
      ownerUserId,
      email,
      permissions,
      token,
      expiresAt,
      status: "PENDING",
    },
    select: {
      id: true,
      email: true,
      permissions: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    invite,
    message:
      "Invitación creada. El colaborador podrá aceptarla cuando inicie sesión con ese email (aceptación desde cuenta próximamente en el panel).",
  });
}
