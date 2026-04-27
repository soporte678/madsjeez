import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    minDaysAsSeller: 60,
    minRevenue: 25000,
    maxClaimRate: 0.06, // 6%
    maxCancellationRate: 0.04, // 4%
    maxDelayRate: 0.08, // 8%
    description: 'Vendedor con primeras ventas consolidadas',
    boostDiscount: 0.03, // 3% descuento en boosts
    order: 2
  },
  {
    level: 'PLATA',
    color: 'AMARILLO',
    minSales: 25,
    minDaysAsSeller: 60,
    minRevenue: 150000,
    maxClaimRate: 0.04, // 4%
    maxCancellationRate: 0.03, // 3%
    maxDelayRate: 0.06, // 6%
    description: 'Vendedor con reputación consolidada',
    boostDiscount: 0.07, // 7% descuento en boosts
    order: 3
  },
  {
    level: 'ORO',
    color: 'VERDE',
    minSales: 100,
    minDaysAsSeller: 60,
    minRevenue: 750000,
    maxClaimRate: 0.025, // 2.5%
    maxCancellationRate: 0.02, // 2%
    maxDelayRate: 0.04, // 4%
    description: 'Vendedor con excelente reputación',
    boostDiscount: 0.12, // 12% descuento en boosts
    order: 4
  },
  {
    level: 'PLATINUM',
    color: 'AZUL',
    minSales: 300,
    minDaysAsSeller: 60,
    minRevenue: 2500000,
    maxClaimRate: 0.015, // 1.5%
    maxCancellationRate: 0.01, // 1%
    maxDelayRate: 0.03, // 3%
    description: 'Vendedor premium con reputación excepcional',
    boostDiscount: 0.18, // 18% descuento en boosts
    order: 5
  },
  {
    level: 'MadsLíder Platinum',
    color: 'VERDE_OSCURO',
    minSales: 750,
    minDaysAsSeller: 60,
    minRevenue: 8000000,
    maxClaimRate: 0.01, // 1%
    maxCancellationRate: 0.008, // 0.8%
    maxDelayRate: 0.02, // 2%
    description: 'Líder elite de la plataforma con reputación impecable',
    boostDiscount: 0.25, // 25% descuento máximo en boosts
    order: 6
  }
];

async function seedMadsliderLevels() {
  console.log('🌟 Seeding Madslider levels...');
  
  try {
    // Limpiar niveles existentes
    await prisma.madsliderLevel.deleteMany();
    
    // Insertar nuevos niveles
    for (const level of madsliderLevels) {
      await prisma.madsliderLevel.create({
        data: level
      });
      console.log(`✅ Created level: ${level.level}`);
    }
    
    console.log('🎉 Madslider levels seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding Madslider levels:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  seedMadsliderLevels()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default seedMadsliderLevels;
