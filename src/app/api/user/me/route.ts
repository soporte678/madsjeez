import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/me
 *
 * Devuelve el perfil del usuario actual leyendo SIEMPRE desde la DB (no de la sesión),
 * para que los cambios persistan en todos lados sin esperar a que la sesión se refresque.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isSeller: true,
        sellerName: true,
        sellerDescription: true,
        storeSlug: true,
        role: true,
      },
    });

    if (!u) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: u.id,
      name: u.name || 'Usuario',
      email: u.email,
      image: u.image,
      isSeller: u.isSeller,
      sellerName: u.sellerName,
      sellerDescription: u.sellerDescription,
      storeSlug: u.storeSlug,
      role: u.role,
      hasAccessKey: session.user.hasAccessKey || false,
    });
  } catch (error) {
    console.error('GET /api/user/me:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/me
 *
 * Actualiza campos editables del perfil. Body acepta:
 *   { name?, sellerName?, sellerDescription?, image? }
 *
 * Email NO se cambia desde acá (requiere flujo de verificación).
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: {
      name?: string;
      sellerName?: string;
      sellerDescription?: string;
      image?: string | null;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (typeof body.name === 'string') {
      const v = body.name.trim();
      if (v.length < 1 || v.length > 120) {
        return NextResponse.json({ error: 'Nombre inválido (1-120 caracteres)' }, { status: 400 });
      }
      data.name = v;
    }
    if (typeof body.sellerName === 'string') {
      const v = body.sellerName.trim();
      if (v.length > 120) {
        return NextResponse.json({ error: 'Nombre de tienda demasiado largo' }, { status: 400 });
      }
      data.sellerName = v || null;
    }
    if (typeof body.sellerDescription === 'string') {
      data.sellerDescription = body.sellerDescription.trim().slice(0, 2000) || null;
    }
    if (body.image !== undefined) {
      data.image = body.image;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        sellerName: true,
        sellerDescription: true,
        storeSlug: true,
        isSeller: true,
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name || 'Usuario',
      email: updated.email,
      image: updated.image,
      isSeller: updated.isSeller,
      sellerName: updated.sellerName,
      sellerDescription: updated.sellerDescription,
      storeSlug: updated.storeSlug,
    });
  } catch (error) {
    console.error('PATCH /api/user/me:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
