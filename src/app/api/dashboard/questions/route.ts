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
          price: Number(q.product.price),
          comparePrice: q.product.comparePrice ? Number(q.product.comparePrice) : null,
          stock: q.product.stock,
          question: q.question,
          questionDate: formatRelativeDate(q.createdAt),
          answer: q.answer || null,
          answerDate: q.answeredAt ? formatRelativeDate(q.answeredAt) : null,
          status: q.status,
          shipping: q.product.stock > 0 ? 'Envío gratis a todo el país' : null,
          installments: Number(q.product.price) > 50000 ? 'Mismo precio en cuotas' : null,
        }));
      }
    } catch (dbError) {
      console.warn('Question table may not exist or error fetching:', dbError);
      tableExists = false;
    }

    return NextResponse.json({
      questions: realQuestions,
      total: realQuestions.length,
      tableExists,
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({
      questions: [],
      total: 0,
      tableExists: false,
      error: 'Error fetching questions',
    });
  }
}
