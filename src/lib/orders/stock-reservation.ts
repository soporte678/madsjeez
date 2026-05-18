import type { PrismaClient } from "@prisma/client";

export type StockReservationLine = {
  productId: string;
  quantity: number;
};

export function hasActiveStockReservation(shippingAddress: unknown): boolean {
  if (!shippingAddress || typeof shippingAddress !== "object") return false;
  const o = shippingAddress as Record<string, unknown>;
  return typeof o.stock_reserved_at === "string" && typeof o.stock_released_at !== "string";
}

export function markStockReserved(shippingAddress: Record<string, unknown>): Record<string, unknown> {
  return {
    ...shippingAddress,
    stock_reserved_at: new Date().toISOString(),
  };
}

export function markStockReleased(shippingAddress: unknown): Record<string, unknown> {
  const base =
    shippingAddress && typeof shippingAddress === "object"
      ? { ...(shippingAddress as Record<string, unknown>) }
      : {};
  return {
    ...base,
    stock_released_at: new Date().toISOString(),
  };
}

export async function reservePrismaStock(
  prisma: PrismaClient,
  lines: StockReservationLine[]
): Promise<{ ok: true } | { ok: false; productId: string }> {
  const normalized = normalizeLines(lines);

  try {
    await prisma.$transaction(async (tx) => {
      for (const line of normalized) {
        const updated = await tx.product.updateMany({
          where: {
            id: line.productId,
            stock: { gte: line.quantity },
            isActive: true,
          },
          data: {
            stock: { decrement: line.quantity },
          },
        });

        if (updated.count !== 1) {
          throw new StockReservationError(line.productId);
        }
      }
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof StockReservationError) {
      return { ok: false, productId: error.productId };
    }
    throw error;
  }
}

export async function restorePrismaStock(
  prisma: PrismaClient,
  lines: StockReservationLine[]
): Promise<void> {
  const normalized = normalizeLines(lines);
  if (!normalized.length) return;

  await prisma.$transaction(
    normalized.map((line) =>
      prisma.product.update({
        where: { id: line.productId },
        data: { stock: { increment: line.quantity } },
      })
    )
  );
}

function normalizeLines(lines: StockReservationLine[]): StockReservationLine[] {
  const merged = new Map<string, number>();
  for (const line of lines) {
    const quantity = Math.max(0, Math.floor(Number(line.quantity)));
    if (!line.productId || quantity <= 0) continue;
    merged.set(line.productId, (merged.get(line.productId) ?? 0) + quantity);
  }
  return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

class StockReservationError extends Error {
  constructor(readonly productId: string) {
    super(`No stock available for product ${productId}`);
  }
}
