import { prisma } from './prisma';

interface ReputationMetrics {
  totalSales: number;
  successfulSales: number;
  canceledSales: number;
  totalRevenue: number;
  openClaims: number;
  resolvedClaims: number;
  claimsAgainst: number;
  mediaciones: number;
  delayedShipments: number;
  onTimeDeliveries: number;
  sellerSince?: Date;
}

interface ReputationLevel {
  level: string;
  color: string;
  minSales: number;
  minDaysAsSeller: number;
  minRevenue: number;
  maxClaimRate: number;
  maxCancellationRate: number;
  maxDelayRate: number;
  boostDiscount: number;
  order: number;
}

export class ReputationCalculator {
  /**
   * Calcula la reputación de un usuario basándose en sus métricas
   */
  static async calculateUserReputation(userId: string): Promise<{
    level: string;
    color: string;
    score: number;
    metrics: any;
  }> {
    // Obtener métricas actuales del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
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
        sellerSince: true,
        createdAt: true,
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calcular tasas
    const totalCompletedSales = user.successfulSales + user.canceledSales;
    const claimRate = totalCompletedSales > 0 ? user.claimsAgainst / totalCompletedSales : 0;
    const cancellationRate = totalCompletedSales > 0 ? user.canceledSales / totalCompletedSales : 0;
    const totalShipments = user.onTimeDeliveries + user.delayedShipments;
    const delayRate = totalShipments > 0 ? user.delayedShipments / totalShipments : 0;

    // Calcular días como vendedor
    const daysAsSeller = user.sellerSince 
      ? Math.floor((new Date().getTime() - user.sellerSince.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Calcular días desde la creación de la cuenta (antigüedad en la plataforma)
    const daysSinceAccountCreated = Math.floor(
      (new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Obtener todos los niveles Madslider ordenados
    const levels = await prisma.madsliderLevel.findMany({
      orderBy: { order: 'asc' }
    });

    // Encontrar el nivel más alto que cumple los requisitos
    let currentLevel = levels[0]; // Default al nivel más bajo
    let maxScore = 0;

    for (const level of levels) {
      if (this.meetsRequirements(user, level, claimRate, cancellationRate, delayRate, daysAsSeller, daysSinceAccountCreated)) {
        const score = this.calculateScore(user, level, claimRate, cancellationRate, delayRate, daysAsSeller);
        if (score > maxScore) {
          maxScore = score;
          currentLevel = level;
        }
      }
    }

    // Determinar color de reputación
    const reputationColor = this.getReputationColor(claimRate);

    return {
      level: currentLevel.level,
      color: reputationColor,
      score: maxScore,
      metrics: {
        ...user,
        claimRate,
        cancellationRate,
        delayRate,
        daysAsSeller
      }
    };
  }

  /**
   * Verifica si un usuario cumple los requisitos para un nivel específico
   */
  private static meetsRequirements(
    user: any,
    level: ReputationLevel,
    claimRate: number,
    cancellationRate: number,
    delayRate: number,
    daysAsSeller: number,
    daysSinceAccountCreated: number
  ): boolean {
    // Para MadsLíder Platinum, se requiere 240 días de antigüedad en la plataforma
    if (level.level === 'MadsLíder Platinum' && daysSinceAccountCreated < 240) {
      return false;
    }

    return (
      user.totalSales >= level.minSales &&
      daysAsSeller >= level.minDaysAsSeller &&
      user.totalRevenue >= level.minRevenue &&
      claimRate <= level.maxClaimRate &&
      cancellationRate <= level.maxCancellationRate &&
      delayRate <= level.maxDelayRate
    );
  }

  /**
   * Calcula el puntaje de reputación (0-1000)
   */
  private static calculateScore(
    user: any,
    level: ReputationLevel,
    claimRate: number,
    cancellationRate: number,
    delayRate: number,
    daysAsSeller: number
  ): number {
    let score = 0;

    // Base según nivel (orden * 100)
    score += level.order * 100;

    // Bonificaciones por métricas
    score += Math.min(user.totalSales / 10, 50); // Hasta 50 puntos por ventas
    score += Math.min(daysAsSeller / 10, 50); // Hasta 50 puntos por antigüedad
    score += Math.min(user.totalRevenue / 10000, 100); // Hasta 100 puntos por facturación

    // Penalizaciones por tasas negativas
    score -= Math.min(claimRate * 1000, 200); // Hasta -200 puntos por reclamos
    score -= Math.min(cancellationRate * 1000, 150); // Hasta -150 puntos por cancelaciones
    score -= Math.min(delayRate * 500, 100); // Hasta -100 puntos por demoras

    return Math.max(0, Math.min(1000, score));
  }

  /**
   * Determina el color de reputación basado en la tasa de reclamos
   */
  private static getReputationColor(claimRate: number): string {
    if (claimRate === 0) return 'VERDE_OSCURO';
    if (claimRate < 0.02) return 'VERDE'; // < 2%
    if (claimRate < 0.05) return 'AMARILLO'; // < 5%
    if (claimRate < 0.10) return 'NARANJA'; // < 10%
    return 'ROJO'; // >= 10%
  }

  /**
   * Actualiza la reputación de un usuario en la base de datos
   */
  static async updateUserReputation(userId: string): Promise<void> {
    const reputation = await this.calculateUserReputation(userId);

    // Guardar historial antes de actualizar
    await this.saveReputationHistory(userId, reputation);

    // Actualizar usuario
    await prisma.user.update({
      where: { id: userId },
      data: {
        reputationLevel: reputation.level,
        reputationColor: reputation.color as any,
        reputationScore: reputation.score,
        claimRate: reputation.metrics.claimRate,
        cancellationRate: reputation.metrics.cancellationRate,
        delayRate: reputation.metrics.delayRate,
        daysAsSeller: reputation.metrics.daysAsSeller,
      }
    });
  }

  /**
   * Guarda un registro en el historial de reputación
   */
  private static async saveReputationHistory(userId: string, reputation: any): Promise<void> {
    await prisma.reputationHistory.create({
      data: {
        userId,
        reputationLevel: reputation.level,
        reputationScore: reputation.score,
        reputationColor: reputation.color as any,
        totalSales: reputation.metrics.totalSales,
        successfulSales: reputation.metrics.successfulSales,
        canceledSales: reputation.metrics.canceledSales,
        totalRevenue: reputation.metrics.totalRevenue,
        openClaims: reputation.metrics.openClaims,
        resolvedClaims: reputation.metrics.resolvedClaims,
        claimsAgainst: reputation.metrics.claimsAgainst,
        mediaciones: reputation.metrics.mediaciones,
        delayedShipments: reputation.metrics.delayedShipments,
        onTimeDeliveries: reputation.metrics.onTimeDeliveries,
        claimRate: reputation.metrics.claimRate,
        cancellationRate: reputation.metrics.cancellationRate,
        delayRate: reputation.metrics.delayRate,
        daysAsSeller: reputation.metrics.daysAsSeller,
      }
    });
  }

  /**
   * Actualiza métricas específicas cuando ocurren eventos
   */
  static async updateMetricsOnSale(userId: string, amount: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalSales: { increment: 1 },
        successfulSales: { increment: 1 },
        totalRevenue: { increment: amount },
      }
    });

    await this.updateUserReputation(userId);
  }

  static async updateMetricsOnCancellation(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalSales: { increment: 1 },
        canceledSales: { increment: 1 },
      }
    });

    await this.updateUserReputation(userId);
  }

  static async updateMetricsOnClaim(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        claimsAgainst: { increment: 1 },
        openClaims: { increment: 1 },
      }
    });

    await this.updateUserReputation(userId);
  }

  static async updateMetricsOnDelayedShipment(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        delayedShipments: { increment: 1 },
      }
    });

    await this.updateUserReputation(userId);
  }

  static async updateMetricsOnTimeShipment(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        onTimeDeliveries: { increment: 1 },
      }
    });

    await this.updateUserReputation(userId);
  }
}
