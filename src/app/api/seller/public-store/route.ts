import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo/site";
import { ensureStoreSlugForUser, userQualifiesForPublicStore } from "@/lib/public-store";
import { isValidStoreSlug, slugifyStoreName } from "@/lib/store-slug";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const qualifies = await userQualifiesForPublicStore(userId);
  if (!qualifies) {
    return NextResponse.json(
      {
        error: "Publicá al menos un producto activo con imagen para activar tu tienda pública.",
        qualifies: false,
      },
      { status: 403 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storeSlug: true, sellerName: true, name: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const slug = user.storeSlug || (await ensureStoreSlugForUser(userId));
  const productCount = await prisma.product.count({
    where: {
      sellerId: userId,
      isActive: true,
      stock: { gt: 0 },
      images: { some: {} },
    },
  });

  const storeUrl = slug ? `${SITE_URL}/tienda/${slug}` : null;

  return NextResponse.json({
    storeSlug: slug,
    storeUrl,
    displayName: user.sellerName || user.name,
    productCount,
    badgeUrl: slug ? `${SITE_URL}/brand/madsjeez-icon-512.png` : null,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const qualifies = await userQualifiesForPublicStore(userId);
  if (!qualifies) {
    return NextResponse.json({ error: "Sin productos publicados" }, { status: 403 });
  }

  let body: { storeSlug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const raw = (body.storeSlug ?? "").trim().toLowerCase();
  const slug = slugifyStoreName(raw);
  if (!isValidStoreSlug(slug)) {
    return NextResponse.json(
      {
        error:
          "Slug inválido. Usá 3–48 caracteres: letras minúsculas, números y guiones (ej: maqjeez-repuestos).",
      },
      { status: 400 }
    );
  }

  const reserved = new Set(["marketplace", "admin", "api", "tienda", "product", "search"]);
  if (reserved.has(slug)) {
    return NextResponse.json({ error: "Ese nombre está reservado" }, { status: 400 });
  }

  const taken = await prisma.user.findFirst({
    where: { storeSlug: slug, NOT: { id: userId } },
    select: { id: true },
  });
  if (taken) {
    return NextResponse.json({ error: "Ese nombre de tienda ya está en uso" }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { storeSlug: slug },
  });

  return NextResponse.json({
    storeSlug: slug,
    storeUrl: `${SITE_URL}/tienda/${slug}`,
  });
}
