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

    // Obtener datos del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        reputationLevel: true,
        reputationScore: true,
        reputationColor: true,
        totalSales: true,
        successfulSales: true,
        canceledSales: true,
        totalRevenue: true,
        openClaims: true,
        resolvedClaims: true,
        claimsAgainst: true,
        mediaciones: true,
        delayedShipments: true,
        onTimeDeliveries: true,
        averageShippingTime: true,
        claimRate: true,
        cancellationRate: true,
        delayRate: true,
        daysAsSeller: true,
        sellerSince: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calcular métricas de los últimos 60 días (como vendedor)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Ventas como vendedor en los últimos 60 días
    const salesLast60Days = await prisma.order.count({
      where: {
        items: {
          some: {
            product: {
              sellerId: userId
            }
          }
        },
        status: {
          in: ['DELIVERED', 'COMPLETED']
        },
        createdAt: {
          gte: sixtyDaysAgo
        }
      }
    });

    // Ventas con envío en los últimos 60 días
    const salesWithShippingLast60Days = await prisma.order.count({
      where: {
        items: {
          some: {
            product: {
              sellerId: userId
            }
          }
        },
        status: {
          in: ['DELIVERED', 'COMPLETED']
        },
        shipment: {
          isNot: null
        },
        createdAt: {
          gte: sixtyDaysAgo
        }
      }
    });

    // Calcular tasas
    const totalCompletedSales = user.successfulSales + user.canceledSales;
    const claimRatePercent = totalCompletedSales > 0 ? (user.claimsAgainst / totalCompletedSales * 100) : 0;
    const cancellationRatePercent = totalCompletedSales > 0 ? (user.canceledSales / totalCompletedSales * 100) : 0;
    const delayRatePercent = user.onTimeDeliveries + user.delayedShipments > 0 
      ? (user.delayedShipments / (user.onTimeDeliveries + user.delayedShipments) * 100) 
      : 0;

    // Obtener límites desde la tabla Madslider (con fallback si no existen)
    let limits = {
      claimLimit: 8,
      mediationLimit: 4,
      cancellationLimit: 5,
      delayLimit: 10
    };

    try {
      const madsliderLevel = await prisma.madsliderLevel.findFirst({
        where: {
          level: user.reputationLevel
        }
      });

      if (madsliderLevel) {
        limits = {
          claimLimit: Math.round(madsliderLevel.maxClaimRate * 100),
          mediationLimit: Math.round(madsliderLevel.maxClaimRate * 50),
          cancellationLimit: Math.round(madsliderLevel.maxCancellationRate * 100),
          delayLimit: Math.round(madsliderLevel.maxDelayRate * 100)
        };
      }
    } catch (e) {
      // Si la tabla no existe, usar valores por defecto
      console.log('Madslider levels not found, using defaults');
    }

    const reputationData = {
      level: user.reputationLevel,
      color: user.reputationColor,
      score: user.reputationScore,
      sales60Days: salesLast60Days,
      salesWithShipping: salesWithShippingLast60Days,
      salesCompleted: user.successfulSales,
      amountBilled: user.totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      claims: {
        percent: claimRatePercent.toFixed(2).replace('.', ','),
        count: user.claimsAgainst,
        limit: `${limits.claimLimit}%`
      },
      mediations: {
        percent: user.mediaciones > 0 && totalCompletedSales > 0 
          ? (user.mediaciones / totalCompletedSales * 100).toFixed(2).replace('.', ',')
          : '0',
        count: user.mediaciones,
        limit: `${limits.mediationLimit}%`
      },
      cancelled: {
        percent: cancellationRatePercent.toFixed(2).replace('.', ','),
        count: user.canceledSales,
        limit: `${limits.cancellationLimit}%`
      },
      wrongShipping: {
        percent: delayRatePercent.toFixed(2).replace('.', ','),
        count: user.delayedShipments,
        limit: `${limits.delayLimit}%`
      },
      daysAsSeller: user.daysAsSeller || 0,
      sellerSince: user.sellerSince
    };

    return NextResponse.json(reputationData);
  } catch (error) {
    console.error('Error fetching reputation data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
