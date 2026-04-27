import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface QuestionItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  sellerName: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  question: string | null;
  questionDate: string | null;
  answer: string | null;
  answerDate: string | null;
  status: string;
  shipping: string | null;
  installments: string | null;
}

function formatPrice(price: number): string {
  return `$ ${price.toLocaleString('es-AR')}`;
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Hace 1 día';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return `Hace ${Math.floor(diffDays / 30)} meses`;
}

// Datos mock para fallback
const mockQuestions: QuestionItem[] = [
  {
    id: '1',
    productId: 'mock-1',
    productTitle: 'Bujía Para Desmalezadoras Motoguadaña 33/43/52cc',
    productImage: 'https://via.placeholder.com/80?text=Bujia',
    sellerName: 'Repuestos Maqjeez',
    price: 7999,
    comparePrice: null,
    stock: 10,
    question: 'Hola buenas! Sirve como repuesto para una china de segunda marca?',
    questionDate: 'Hace 3 días',
    answer: 'Hola, son aptas para todas las chinas mientras sean del cc que mencionamos en la publicación, esperamos tu compra, saludos!',
    answerDate: 'Hace 3 días',
    status: 'answered',
    shipping: null,
    installments: null,
  },
  {
    id: '2',
    productId: 'mock-2',
    productTitle: 'Barral Completo Desmalezadora Más Campana Más Caja Engranaje',
    productImage: 'https://via.placeholder.com/80?text=Barral',
    sellerName: 'Repuestos Maqjeez',
    price: 79999,
    comparePrice: null,
    stock: 2,
    question: 'Es compatible con recortardora stihl?',
    questionDate: 'Hace 3 días',
    answer: 'Hola buenas! En este caso solo si es de origen chino, saludos!',
    answerDate: 'Hace 3 días',
    status: 'answered',
    shipping: 'Envío gratis a todo el país',
    installments: 'Mismo precio en cuotas',
  },
  {
    id: '3',
    productId: 'mock-3',
    productTitle: 'Tijera Profesional Dorada Modista 26cm Tela Lana Premium Dorado',
    productImage: 'https://via.placeholder.com/80?text=Tijera',
    sellerName: 'Casa de Costura',
    price: 149999,
    comparePrice: null,
    stock: 3,
    question: 'hola, mas grande tenes?',
    questionDate: 'Hace 14 días',
    answer: 'HOLA, POR EL MOMENTO ES EL UNICO TAMAÑO AT...',
    answerDate: null,
    status: 'answered',
    shipping: 'Envío gratis a todo el país',
    installments: 'Mismo precio en cuotas',
  },
  {
    id: '4',
    productId: 'mock-4',
    productTitle: 'Brazo De Suspensión Inferior Recto Vw Passat Audi A4',
    productImage: 'https://via.placeholder.com/80?text=Brazo',
    sellerName: 'Autopartes Premium',
    price: 97965,
    comparePrice: 90274.75,
    stock: 15,
    question: null,
    questionDate: null,
    answer: null,
    answerDate: null,
    status: 'pending',
    shipping: 'Envío gratis a todo el país',
    installments: null,
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Intentar obtener preguntas reales de la base de datos
    let realQuestions: QuestionItem[] = [];
    let tableExists = true;

    try {
      const dbQuestions = await prisma.question.findMany({
        where: {
          buyerId: userId,
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

      if (dbQuestions.length > 0) {
        realQuestions = dbQuestions.map((q: any) => ({
          id: q.id,
          productId: q.productId,
          productTitle: q.product.title,
          productImage: q.product.images[0]?.url || null,
          sellerName: q.product.seller?.name || 'Vendedor',
          price: q.product.price,
          comparePrice: q.product.comparePrice || null,
          stock: q.product.stock,
          question: q.question,
          questionDate: formatRelativeDate(q.createdAt),
          answer: q.answer || null,
          answerDate: q.answeredAt ? formatRelativeDate(q.answeredAt) : null,
          status: q.status,
          shipping: q.product.stock > 0 ? 'Envío gratis a todo el país' : null,
          installments: q.product.price > 50000 ? 'Mismo precio en cuotas' : null,
        }));
      }
    } catch (dbError) {
      console.warn('Question table may not exist or error fetching:', dbError);
      tableExists = false;
    }

    const response = {
      questions: realQuestions.length > 0 ? realQuestions : mockQuestions,
      total: realQuestions.length > 0 ? realQuestions.length : mockQuestions.length,
      isRealData: realQuestions.length > 0,
      tableExists,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching questions:', error);
    // Devolver datos mock en caso de error
    return NextResponse.json({
      questions: mockQuestions,
      total: mockQuestions.length,
      isRealData: false,
      tableExists: false,
      error: 'Error fetching questions',
    });
  }
}
