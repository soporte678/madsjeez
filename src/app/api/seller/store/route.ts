/**
 * /api/seller/store — config de la tienda del vendedor logueado.
 *   GET   → get-or-create la tienda + URLs + tier efectivo.
 *   PATCH → actualiza campos (validados, saneados, con plan-gating).
 * Ownership implícito: la tienda está keyed por ownerUserId = session.user.id.
 * Requiere migración Fase 1 aplicada (tabla stores).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo/site";
import { ROOT_DOMAIN } from "@/lib/stores/resolve";
import { getOrCreateStore, buildStorePatch } from "@/lib/stores/store-service";
import { getEffectiveTier } from "@/lib/subscription/effective-tier";

export const dynamic = "force-dynamic";

async function effectiveTier(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, subscriptionExpiry: true },
  });
  try {
    return getEffectiveTier({
      subscriptionTier: u?.subscriptionTier ?? "FREE",
      subscriptionExpiry: u?.subscriptionExpiry ?? null,
      trialEndsAt: null,
    }).tier;
  } catch {
    return u?.subscriptionTier ?? "FREE";
  }
}

function urls(slug: string, subdomain: string | null) {
  return {
    internalUrl: `${SITE_URL}/tienda/${slug}`,
    subdomainUrl: subdomain ? `https://${subdomain}.${ROOT_DOMAIN}` : null,
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [store, tier] = await Promise.all([getOrCreateStore(userId), effectiveTier(userId)]);
  const productCount = await prisma.product.count({
    where: { sellerId: userId, isActive: true, stock: { gt: 0 }, images: { some: {} } },
  });

  return NextResponse.json({ store, tier, productCount, ...urls(store.slug, store.subdomain) });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Asegura que la tienda exista (y que sea la del usuario).
  await getOrCreateStore(userId);
  const tier = await effectiveTier(userId);

  // No permitir publicar sin al menos un producto activo con imagen.
  if (body.isActive === true) {
    const count = await prisma.product.count({
      where: { sellerId: userId, isActive: true, stock: { gt: 0 }, images: { some: {} } },
    });
    if (count === 0) {
      return NextResponse.json(
        { error: "Publicá al menos un producto activo con imagen para activar tu tienda." },
        { status: 409 }
      );
    }
  }

  const patch = await buildStorePatch(userId, body, tier);
  if (!patch.ok) return NextResponse.json({ error: patch.error }, { status: patch.status });

  const store = await prisma.store.update({ where: { ownerUserId: userId }, data: patch.data });

  // Transición F2→F3: el storefront vivo /tienda/[slug] aún lee de User.
  // Espejamos los campos store-scoped para que los cambios se vean ya.
  const d = patch.data as Record<string, unknown>;
  const userSync: Record<string, unknown> = {};
  if (typeof d.slug === "string") userSync.storeSlug = d.slug;
  if (typeof d.name === "string") userSync.sellerName = d.name;
  if ("description" in d) userSync.sellerDescription = (d.description as string) ?? null;
  if (Object.keys(userSync).length > 0) {
    await prisma.user.update({ where: { id: userId }, data: userSync }).catch(() => null);
  }

  return NextResponse.json({ store, tier, ...urls(store.slug, store.subdomain) });
}
