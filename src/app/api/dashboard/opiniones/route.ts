import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PendingOpinion {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  sellerName: string | null;
  purchaseDate: string;
}

interface CompletedOpinion {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  rating: number;
  comment: string | null;
  date: string;
  likes: number;
}

function formatPurchaseDate(date: Date): string {
  const months = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `Comprado el ${day} de ${month}, ${year}`;
}

function formatReviewDate(date: Date): string {
  const months = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `Realizada el ${day} de ${month}, ${year}`;
}


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    let pending: PendingOpinion[] = [];
    let completed: CompletedOpinion[] = [];
    let tableExists = true;

    try {
      // Buscar órdenes completadas sin review (pendientes de opinar)
      const ordersWithoutReview = await prisma.order.findMany({
        where: {
          buyerId: userId,
          status: 'DELIVERED',
          review: null,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  seller: true,
                  images: { orderBy: { order: 'asc' }, take: 1 },
                },
              },
            },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      pending = ordersWithoutReview.map((order: any) => ({
        id: order.id,
        orderId: order.id,
        productId: order.items[0]?.product?.id || '',
        productTitle: order.items[0]?.product?.title || 'Producto sin nombre',
        productImage: order.items[0]?.product?.images[0]?.url || null,
        sellerName: order.items[0]?.product?.seller?.name || null,
        purchaseDate: formatPurchaseDate(order.createdAt),
      }));
    } catch (e) {
      console.warn('Orders table may not have data:', e);
    }

    try {
      // Buscar reviews realizadas por el usuario
      const reviews = await prisma.review.findMany({
        where: {
          reviewerId: userId,
        },
        include: {
          product: {
            include: {
              images: { orderBy: { order: 'asc' }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      completed = reviews.map((review: any) => ({
        id: review.id,
        productId: review.productId,
        productTitle: review.product?.title || 'Producto sin nombre',
        productImage: review.product?.images[0]?.url || null,
        rating: review.rating,
        comment: review.comment,
        date: formatReviewDate(review.createdAt),
        likes: 0, // Por ahora no hay tabla de likes
      }));
    } catch (e) {
      console.warn('Reviews table may not exist or have data:', e);
      tableExists = false;
    }

    return NextResponse.json({
      pending,
      completed,
      tableExists,
    });
  } catch (error) {
    console.error('Error fetching opiniones:', error);
    return NextResponse.json({
      pending: [],
      completed: [],
      tableExists: false,
      error: 'Error fetching opiniones',
    });
  }
}
