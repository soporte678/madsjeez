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

const mockPending: PendingOpinion[] = [
  {
    id: 'mock-p-1',
    orderId: 'mock-o-1',
    productId: 'mock-prod-1',
    productTitle: 'Pizarra Blanca Magnética 40x60cm Uso Intensivo Borra Facil Doggo By Apxer Premium',
    productImage: 'https://via.placeholder.com/80?text=Pizarra',
    sellerName: 'Escolaria Shop',
    purchaseDate: 'Comprado el 25 de feb, 2026',
  },
  {
    id: 'mock-p-2',
    orderId: 'mock-o-2',
    productId: 'mock-prod-2',
    productTitle: 'Tanque Nafta Desmalezadora 2 Agujeros 43cc 52cc Chinas',
    productImage: 'https://via.placeholder.com/80?text=Tanque',
    sellerName: 'MotoGarden Tools',
    purchaseDate: 'Comprado el 12 de feb, 2026',
  },
  {
    id: 'mock-p-3',
    orderId: 'mock-o-3',
    productId: 'mock-prod-3',
    productTitle: 'Tanque Nafta Desmalezadora 2 Agujeros 43cc 52cc Chinas.',
    productImage: 'https://via.placeholder.com/80?text=Tanque',
    sellerName: 'MotoGarden Tools',
    purchaseDate: 'Comprado el 10 de feb, 2026',
  },
  {
    id: 'mock-p-4',
    orderId: 'mock-o-4',
    productId: 'mock-prod-4',
    productTitle: 'Carburador Desmalezadora 26cc 33cc Niwa-gamma-garden Bull Service Aluminio',
    productImage: 'https://via.placeholder.com/80?text=Carburador',
    sellerName: 'Repuestos MadsJeez',
    purchaseDate: 'Comprado el 03 de feb, 2026',
  },
  {
    id: 'mock-p-5',
    orderId: 'mock-o-5',
    productId: 'mock-prod-5',
    productTitle: 'Selladora Impulso Manual Dasa Fs-300 Pro 430w Bolsas 30cm 0.15mm Azul',
    productImage: 'https://via.placeholder.com/80?text=Selladora',
    sellerName: 'Packaging Pro',
    purchaseDate: 'Comprado el 03 de feb, 2026',
  },
];

const mockCompleted: CompletedOpinion[] = [
  {
    id: 'mock-c-1',
    productId: 'mock-prod-6',
    productTitle: '10 Film Stretch Negro 10cm 500g P Embalar Embalaje Resistent Negro',
    productImage: 'https://via.placeholder.com/80?text=Stretch',
    rating: 1,
    comment: null,
    date: 'Realizada el 26 de nov, 2025',
    likes: 0,
  },
  {
    id: 'mock-c-2',
    productId: 'mock-prod-7',
    productTitle: 'Bolsas E Commerce 30x40 + 5 Negra Adhesivo Inviolable X100 U Negro 30x40 Negro X 100',
    productImage: 'https://via.placeholder.com/80?text=Bolsas',
    rating: 4,
    comment: null,
    date: 'Realizada el 17 de nov, 2025',
    likes: 0,
  },
  {
    id: 'mock-c-3',
    productId: 'mock-prod-8',
    productTitle: 'Bolsas Polietileno Gris Oscuro Belmotec 17x30cm Adhesivo X100 Liso',
    productImage: 'https://via.placeholder.com/80?text=Bolsas',
    rating: 4,
    comment: null,
    date: 'Realizada el 17 de nov, 2025',
    likes: 0,
  },
  {
    id: 'mock-c-4',
    productId: 'mock-prod-9',
    productTitle: 'Zapatilla Topper Strong Pace Iii Azul Liso 38 Ar',
    productImage: 'https://via.placeholder.com/80?text=Topper',
    rating: 5,
    comment: null,
    date: 'Actualizada el 17 de sep, 2025',
    likes: 0,
  },
];

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

    const isRealData = pending.length > 0 || completed.length > 0;

    const response = {
      pending: isRealData ? pending : mockPending,
      completed: isRealData ? completed : mockCompleted,
      isRealData,
      tableExists,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching opiniones:', error);
    return NextResponse.json({
      pending: mockPending,
      completed: mockCompleted,
      isRealData: false,
      tableExists: false,
      error: 'Error fetching opiniones',
    });
  }
}
