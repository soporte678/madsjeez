import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener datos del usuario - solo campos que existen en producción
    let user: any = null;
    let salesLast60Days = 0;
    let salesWithShippingLast60Days = 0;

    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          reputationColor: true,
          totalSales: true,
          successfulSales: true,
          canceledSales: true,
          delayedShipments: true,
          claimRate: true,
          sellerSince: true,
          name: true,
          email: true,
        }
      });
    } catch (userError) {
      console.error('Error fetching user:', userError);
      // Fallback: user not found or schema mismatch
    }

    // Calcular métricas de los últimos 60 días (como vendedor)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    try {
      // Ventas como vendedor en los últimos 60 días
      salesLast60Days = await prisma.order.count({
        where: {
          items: {
            some: {
              product: {
                sellerId: userId
              }
            }
          },
          status: {
            in: ['DELIVERED', 'PAID', 'SHIPPED']
          },
          createdAt: {
            gte: sixtyDaysAgo
          }
        }
      });
    } catch (orderError) {
      console.error('Error counting orders:', orderError);
    }

    // Datos fallback si no hay user
    const totalSales = user?.totalSales || 0;
    const successfulSales = user?.successfulSales || 0;
    const canceledSales = user?.canceledSales || 0;
    const delayedShipments = user?.delayedShipments || 0;
    const claimRate = user?.claimRate || 0;

    // Calcular tasas
    const totalCompletedSales = successfulSales + canceledSales;
    const claimRatePercent = totalCompletedSales > 0 ? (claimRate * 100) : 0;
    const cancellationRatePercent = totalCompletedSales > 0 ? (canceledSales / totalCompletedSales * 100) : 0;

    // Determinar nivel basado en ventas (fallback sin tabla madsliderLevel)
    let level = 'VENDEDOR NUEVO';
    if (totalSales >= 750) level = 'MadsLíder Platinum';
    else if (totalSales >= 300) level = 'PLATINUM';
    else if (totalSales >= 100) level = 'ORO';
    else if (totalSales >= 25) level = 'PLATA';
    else if (totalSales >= 5) level = 'BRONCE';

    // Límites por nivel (fallback)
    const limits: Record<string, any> = {
      'VENDEDOR NUEVO': { claim: 8, mediation: 4, cancellation: 5, delay: 10 },
      'BRONCE': { claim: 6, mediation: 3, cancellation: 4, delay: 8 },
      'PLATA': { claim: 4, mediation: 2, cancellation: 3, delay: 6 },
      'ORO': { claim: 3, mediation: 1, cancellation: 2, delay: 4 },
      'PLATINUM': { claim: 2, mediation: 1, cancellation: 1, delay: 3 },
      'MadsLíder Platinum': { claim: 1, mediation: 1, cancellation: 1, delay: 2 },
    };
    const levelLimits = limits[level] || limits['VENDEDOR NUEVO'];

    // Intentar obtener límites reales desde Madslider si existe
    try {
      const madsliderLevel = await prisma.madsliderLevel.findFirst({
        where: { level }
      });
      if (madsliderLevel) {
        levelLimits.claim = Math.round(madsliderLevel.maxClaimRate * 100);
        levelLimits.mediation = Math.round(madsliderLevel.maxClaimRate * 50);
        levelLimits.cancellation = Math.round(madsliderLevel.maxCancellationRate * 100);
        levelLimits.delay = Math.round(madsliderLevel.maxDelayRate * 100);
      }
    } catch (e) {
      // Tabla no existe, usar límites fallback
    }

    const reputationData = {
      level: level,
      color: user?.reputationColor || 'VERDE',
      score: totalSales * 10,
      sales60Days: salesLast60Days,
      salesWithShipping: salesWithShippingLast60Days,
      salesCompleted: successfulSales,
      amountBilled: '0',
      claims: {
        percent: claimRatePercent.toFixed(2).replace('.', ','),
        count: Math.round(claimRate * totalCompletedSales) || 0,
        limit: `${levelLimits.claim}%`
      },
      mediations: {
        percent: '0',
        count: 0,
        limit: `${levelLimits.mediation}%`
      },
      cancelled: {
        percent: cancellationRatePercent.toFixed(2).replace('.', ','),
        count: canceledSales,
        limit: `${levelLimits.cancellation}%`
      },
      wrongShipping: {
        percent: totalCompletedSales > 0 ? ((delayedShipments / totalCompletedSales) * 100).toFixed(2).replace('.', ',') : '0',
        count: delayedShipments,
        limit: `${levelLimits.delay}%`
      },
      daysAsSeller: user?.sellerSince 
        ? Math.floor((new Date().getTime() - new Date(user.sellerSince).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      sellerSince: user?.sellerSince || null
    };

    return NextResponse.json(reputationData);
  } catch (error) {
    console.error('Error fetching reputation data:', error);
    // Devolver datos fallback para que el UI no se rompa
    return NextResponse.json({
      level: 'VENDEDOR NUEVO',
      color: 'VERDE',
      score: 0,
      sales60Days: 0,
      salesWithShipping: 0,
      salesCompleted: 0,
      amountBilled: '0',
      claims: { percent: '0', count: 0, limit: '8%' },
      mediations: { percent: '0', count: 0, limit: '4%' },
      cancelled: { percent: '0', count: 0, limit: '5%' },
      wrongShipping: { percent: '0', count: 0, limit: '10%' },
      daysAsSeller: 0,
      sellerSince: null
    });
  }
}
