import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CompraItem {
  id: string;
  orderNumber: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  total: number;
  shippingName: string;
  shippingCity: string;
  shippingState: string;
  productTitle: string;
  productImage: string | null;
  productQuantity: number;
  productPrice: number;
  sellerName: string | null;
  createdAt: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente de pago', color: '#f23d4f' },
  PAID: { label: 'Pago confirmado', color: '#3483fa' },
  PROCESSING: { label: 'Preparando envío', color: '#3483fa' },
  SHIPPED: { label: 'En camino', color: '#3483fa' },
  DELIVERED: { label: 'Entregado', color: '#00a650' },
  CANCELLED: { label: 'Cancelada', color: '#999' },
  REFUNDED: { label: 'Reembolsado', color: '#999' },
};

function formatPrice(price: number): string {
  return `$ ${price.toLocaleString('es-AR')}`;
}

function formatDate(date: Date): string {
  const months = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  const d = new Date(date);
  return `${d.getDate()} de ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

const mockCompras: CompraItem[] = [
  {
    id: 'mock-c-1',
    orderNumber: 'ORD-001-ML',
    status: 'DELIVERED',
    statusLabel: 'Entregado',
    statusColor: '#00a650',
    total: 229782,
    shippingName: 'Juan Pérez',
    shippingCity: 'Buenos Aires',
    shippingState: 'CABA',
    productTitle: 'Martillo Demoledor Crebro Hex 60j 1700w 1900rpm',
    productImage: 'https://via.placeholder.com/80?text=Martillo',
    productQuantity: 1,
    productPrice: 229782,
    sellerName: 'HIERROS TORRENT',
    createdAt: '15 de abr, 2026',
  },
  {
    id: 'mock-c-2',
    orderNumber: 'ORD-002-ML',
    status: 'SHIPPED',
    statusLabel: 'En camino',
    statusColor: '#3483fa',
    total: 1699999,
    shippingName: 'Juan Pérez',
    shippingCity: 'Buenos Aires',
    shippingState: 'CABA',
    productTitle: 'Heladera Philco Phsb470xd2 Side By Side',
    productImage: 'https://via.placeholder.com/80?text=Heladera',
    productQuantity: 1,
    productPrice: 1699999,
    sellerName: 'PHILCO',
    createdAt: '20 de abr, 2026',
  },
  {
    id: 'mock-c-3',
    orderNumber: 'ORD-003-ML',
    status: 'PENDING',
    statusLabel: 'Pendiente de pago',
    statusColor: '#f23d4f',
    total: 21800,
    shippingName: 'Juan Pérez',
    shippingCity: 'Rosario',
    shippingState: 'Santa Fe',
    productTitle: '100 Tarjetas Personales Premium Laminadas',
    productImage: 'https://via.placeholder.com/80?text=Tarjetas',
    productQuantity: 2,
    productPrice: 10900,
    sellerName: null,
    createdAt: '25 de abr, 2026',
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    let realCompras: CompraItem[] = [];
    let tableExists = true;

    try {
      const dbOrders = await prisma.order.findMany({
        where: {
          buyerId: userId,
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
          payment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (dbOrders.length > 0) {
        realCompras = dbOrders.map((order: any) => {
          const item = order.items[0];
          const statusInfo = statusMap[order.status] || { label: order.status, color: '#999' };

          return {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            statusLabel: statusInfo.label,
            statusColor: statusInfo.color,
            total: order.total,
            shippingName: order.shippingName,
            shippingCity: order.shippingCity,
            shippingState: order.shippingState,
            productTitle: item?.product?.title || 'Producto sin nombre',
            productImage: item?.product?.images[0]?.url || null,
            productQuantity: item?.quantity || 1,
            productPrice: item?.price || order.total,
            sellerName: item?.product?.seller?.name || null,
            createdAt: formatDate(order.createdAt),
          };
        });
      }
    } catch (dbError) {
      console.warn('Orders table may not exist or error fetching:', dbError);
      tableExists = false;
    }

    const isRealData = realCompras.length > 0;

    const response = {
      compras: isRealData ? realCompras : mockCompras,
      total: isRealData ? realCompras.length : mockCompras.length,
      isRealData,
      tableExists,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching compras:', error);
    return NextResponse.json({
      compras: mockCompras,
      total: mockCompras.length,
      isRealData: false,
      tableExists: false,
      error: 'Error fetching compras',
    });
  }
}
