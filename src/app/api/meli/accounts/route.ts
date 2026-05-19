import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  disconnectMeliAccount,
  listMeliAccountsForUser,
  setPrimaryMeliAccount,
} from "@/lib/meli/accounts";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const accounts = await listMeliAccountsForUser(session.user.id);
  return NextResponse.json({ ok: true, accounts });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const accountId = typeof body.accountId === "string" ? body.accountId : "";
  const action = typeof body.action === "string" ? body.action : "";

  if (!accountId) {
    return NextResponse.json({ error: "accountId requerido" }, { status: 400 });
  }

  try {
    if (action === "set_primary") {
      await setPrimaryMeliAccount(session.user.id, accountId);
      return NextResponse.json({ ok: true });
    }
    if (action === "set_label" && typeof body.label === "string") {
      await prisma.sellerMeliOAuth.updateMany({
        where: { id: accountId, userId: session.user.id },
        data: { label: body.label.slice(0, 120) },
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al actualizar" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const accountId = url.searchParams.get("accountId") || "";
  if (!accountId) {
    return NextResponse.json({ error: "accountId requerido" }, { status: 400 });
  }

  try {
    await disconnectMeliAccount(session.user.id, accountId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo desconectar" },
      { status: 400 }
    );
  }
}
