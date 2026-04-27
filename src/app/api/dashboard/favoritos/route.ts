import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

const mockFavoritos: FavoritoItem[] = [
  {
    id: 'mock-f-1',
    productId: 'mock-prod-f1',
    productTitle: 'Martillo Demoledor Crebro Hex 60j 1700w 1900rpm Maletin Color Azul',
    productImage: 'https://via.placeholder.com/150?text=Demoledor',
    sellerName: 'HIERROS TORRENT',
    verified: true,
    oldPrice: 264117,
    price: 229782,
    discount: '13% OFF',
    installments: '6 cuotas de $ 52.432',
    shipping: 'Envío gratis',
    fullShipping: true,
  },
  {
    id: 'mock-f-2',
    productId: 'mock-prod-f2',
    productTitle: '100 Tarjetas Personales Premium Laminadas Entrega Inmediata',
    productImage: 'https://via.placeholder.com/150?text=Tarjetas',
    sellerName: null,
    verified: false,
    oldPrice: null,
    price: 21800,
    discount: null,
    installments: null,
    shipping: null,
    fullShipping: false,
  },
  {
    id: 'mock-f-3',
    productId: 'mock-prod-f3',
    productTitle: 'Heladera Philco Phsb470xd2 Side By Side Cross Door Slim 4 Puertas No Frost 385l Inox Acero Inoxidable',
    productImage: 'https://via.placeholder.com/150?text=Heladera',
    sellerName: 'PHILCO',
    verified: true,
    oldPrice: 2300543,
    price: 1699999,
    discount: '26% OFF',
    installments: '6 cuotas de $ 387.011',
    shipping: 'Envío gratis',
    fullShipping: false,
  },
  {
    id: 'mock-f-4',
    productId: 'mock-prod-f4',
    productTitle: 'Pc Gamer Mexx G6550 Amd Ryzen 7 5700 32gb 1tb Ssd Rtx 3050 Msi 1 Tb 32 Gb Nvidia Geforce Rtx 3050',
    productImage: 'https://via.placeholder.com/150?text=PC+Gamer',
    sellerName: 'MEXX GAMERS POR NATURALEZA',
    verified: true,
    oldPrice: null,
    price: 1608909,
    discount: null,
    installments: 'Cuota promocionada en 6 cuotas de $ 367.126',
    shipping: 'Envío gratis',
    fullShipping: false,
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Por ahora no existe tabla de favoritos en Prisma
    // Se devuelven datos mock con la estructura real preparada
    // para cuando se cree la tabla en el futuro

    const response = {
      favoritos: mockFavoritos,
      total: mockFavoritos.length,
      isRealData: false,
      tableExists: false,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching favoritos:', error);
    return NextResponse.json({
      favoritos: mockFavoritos,
      total: mockFavoritos.length,
      isRealData: false,
      tableExists: false,
      error: 'Error fetching favoritos',
    });
  }
}
