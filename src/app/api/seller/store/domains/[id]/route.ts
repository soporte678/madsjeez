/**
 * /api/seller/store/domains/[id]
 *   PATCH { action: "verify" } → comprueba el TXT por DNS y actualiza estado.
 *   PATCH { action: "primary" } → marca el dominio como principal de la tienda.
 *   DELETE → desconecta (elimina) el dominio.
 * Ownership: el dominio debe pertenecer a la tienda del vendedor logueado.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateStore } from "@/lib/stores/store-service";
import { checkDomainTxt } from "@/lib/stores/domain-service";

export const dynamic = "force-dynamic";

async function owned(userId: string, id: string) {
  const store = await getOrCreateStore(userId);
  const d = await prisma.storeDomain.findFirst({ where: { id, storeId: store.id } });
  return d ? { store, d } : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const o = await owned(userId, id);
  if (!o) return NextResponse.json({ error: "Dominio no encontrado" }, { status: 404 });

  let body: { action?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  if (body.action === "verify") {
    const ok = await checkDomainTxt(o.d.domain, o.d.verificationToken);
    const updated = await prisma.storeDomain.update({
      where: { id },
      data: ok
        ? { dnsStatus: "verified", sslStatus: "ssl_pending", verifiedAt: new Date(), lastCheckedAt: new Date() }
        : { dnsStatus: "dns_pending", lastCheckedAt: new Date() },
    });
    return NextResponse.json({
      ok,
      dnsStatus: updated.dnsStatus,
      sslStatus: updated.sslStatus,
      message: ok
        ? "Dominio verificado. La activación con HTTPS se completará en una próxima etapa."
        : "Todavía no encontramos el registro TXT. La propagación DNS puede tardar; probá de nuevo en unos minutos.",
    });
  }

  if (body.action === "primary") {
    await prisma.storeDomain.updateMany({ where: { storeId: o.store.id }, data: { isPrimary: false } });
    await prisma.storeDomain.update({ where: { id }, data: { isPrimary: true } });
    await prisma.store.update({ where: { id: o.store.id }, data: { customDomain: o.d.domain, primaryDomainType: "custom" } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const o = await owned(userId, id);
  if (!o) return NextResponse.json({ error: "Dominio no encontrado" }, { status: 404 });

  await prisma.storeDomain.delete({ where: { id } });
  if (o.d.isPrimary) {
    await prisma.store.update({ where: { id: o.store.id }, data: { customDomain: null, primaryDomainType: "internal" } });
  }
  return NextResponse.json({ ok: true });
}
