import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface FavoritoItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  sellerName: string | null;
  verified: boolean;
  oldPrice: number | null;
  price: number;
  discount: string | null;
  installments: string | null;
  shipping: string | null;
  fullShipping: boolean;
}


function formatPrice(price: number): string {
  return `$ ${price.toLocaleString('es-AR')}`;
}

function calculateDiscount(oldPrice: number | null, price: number): string | null {
  if (!oldPrice || oldPrice <= price) return null;
  const discount = Math.round(((oldPrice - price) / oldPrice) * 100);
  return `${discount}% OFF`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    let realFavoritos: FavoritoItem[] = [];
    let tableExists = true;

    try {
      const dbFavorites = await prisma.favorite.findMany({
        where: {
          userId: userId,
        },
        include: {
          product: {
            include: {
              seller: true,
              images: {
                orderBy: { order: 'asc' },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (dbFavorites.length > 0) {
        realFavoritos = dbFavorites.map((f: any) => ({
          id: f.id,
          productId: f.productId,
          productTitle: f.product.title,
          productImage: f.product.images[0]?.url || null,
          sellerName: f.product.seller?.name || null,
          verified: f.product.seller?.subscriptionTier === 'GOLD' || f.product.seller?.subscriptionTier === 'PLATINUM',
          oldPrice: f.product.comparePrice ? Number(f.product.comparePrice) : null,
          price: Number(f.product.price),
          discount: calculateDiscount(f.product.comparePrice ? Number(f.product.comparePrice) : null, Number(f.product.price)),
          installments: Number(f.product.price) > 50000
            ? `Mismo precio en cuotas`
            : null,
          shipping: f.product.stock > 0 ? 'Envío gratis' : null,
          fullShipping: Number(f.product.price) > 100000,
        }));
      }
    } catch (dbError) {
      console.warn('Favorite table may not exist yet:', dbError);
      tableExists = false;
    }

    return NextResponse.json({
      favoritos: realFavoritos,
      total: realFavoritos.length,
      tableExists,
    });
  } catch (error) {
    console.error('Error fetching favoritos:', error);
    return NextResponse.json({
      favoritos: [],
      total: 0,
      tableExists: false,
      error: 'Error fetching favoritos',
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id requerido" }, { status: 400 });
    }

    await prisma.favorite.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting favorito:", error);
    return NextResponse.json({ error: "Error al eliminar favorito" }, { status: 500 });
  }
}
