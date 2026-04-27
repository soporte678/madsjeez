import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// TABLA DE VALORES MADSLIDER - Basada en estándares de marketplaces latinoamericanos
const madsliderLevels = [
  {
    level: 'VENDEDOR NUEVO',
    color: 'GRIS',
    minSales: 0,
    minDaysAsSeller: 0,
    minRevenue: 0,
    maxClaimRate: 0.08, // 8% - Tolerancia alta para nuevos
    maxCancellationRate: 0.05, // 5%
    maxDelayRate: 0.10, // 10%
    description: 'Vendedor nuevo en construcción de reputación',
    boostDiscount: 0,
    order: 1
  },
  {
    level: 'BRONCE',
    color: 'NARANJA',
    minSales: 5,
    minDaysAsSeller: 15,
    minRevenue: 25000,
    maxClaimRate: 0.06, // 6%
    maxCancellationRate: 0.04, // 4%
    maxDelayRate: 0.08, // 8%
    description: 'Vendedor con primeras ventas consolidadas',
    boostDiscount: 0.03, // 3% descuento
    order: 2
  },
  {
    level: 'PLATA',
    color: 'AMARILLO',
    minSales: 25,
    minDaysAsSeller: 45,
    minRevenue: 150000,
    maxClaimRate: 0.04, // 4%
    maxCancellationRate: 0.03, // 3%
    maxDelayRate: 0.06, // 6%
    description: 'Vendedor con reputación consolidada',
    boostDiscount: 0.07, // 7% descuento
    order: 3
  },
  {
    level: 'ORO',
    color: 'VERDE',
    minSales: 100,
    minDaysAsSeller: 90,
    minRevenue: 750000,
    maxClaimRate: 0.025, // 2.5%
    maxCancellationRate: 0.02, // 2%
    maxDelayRate: 0.04, // 4%
    description: 'Vendedor con excelente reputación',
    boostDiscount: 0.12, // 12% descuento
    order: 4
  },
  {
    level: 'PLATINUM',
    color: 'AZUL',
    minSales: 300,
    minDaysAsSeller: 150,
    minRevenue: 2500000,
    maxClaimRate: 0.015, // 1.5%
    maxCancellationRate: 0.01, // 1%
    maxDelayRate: 0.03, // 3%
    description: 'Vendedor premium con reputación excepcional',
    boostDiscount: 0.18, // 18% descuento
    order: 5
  },
  {
    level: 'MadsLíder Platinum',
    color: 'VERDE_OSCURO',
    minSales: 750,
    minDaysAsSeller: 240,
    minRevenue: 8000000,
    maxClaimRate: 0.01, // 1%
    maxCancellationRate: 0.008, // 0.8%
    maxDelayRate: 0.02, // 2%
    description: 'Líder elite de la plataforma con reputación impecable',
    boostDiscount: 0.25, // 25% descuento máximo
    order: 6
  }
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Solo admins pueden ejecutar este endpoint
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🌟 Seeding Madslider levels...');
    
    // Limpiar niveles existentes
    await prisma.madsliderLevel.deleteMany();
    
    // Insertar nuevos niveles
    const createdLevels = [];
    for (const level of madsliderLevels) {
      const created = await prisma.madsliderLevel.create({
        data: level
      });
      createdLevels.push(created);
      console.log(`✅ Created level: ${level.level}`);
    }
    
    console.log('🎉 Madslider levels seeded successfully!');

    return NextResponse.json({
      message: 'Madslider levels seeded successfully',
      levels: createdLevels
    });

  } catch (error) {
    console.error('❌ Error seeding Madslider levels:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener niveles actuales
    const levels = await prisma.madsliderLevel.findMany({
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ levels });

  } catch (error) {
    console.error('Error fetching Madslider levels:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
