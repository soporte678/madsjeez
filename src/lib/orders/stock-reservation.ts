import type { PrismaClient } from "@prisma/client";

export type StockReservationLine = {
  productId: string;
  quantity: number;
};

/** Valida que un productId sea un string no vacío y seguro */
function isValidProductId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(id);
}

/** Valida que una cantidad sea un entero positivo seguro */
function isValidQuantity(q: unknown): q is number {
  return typeof q === "number" && Number.isFinite(q) && q > 0 && q <= 1_000_000 && Number.isInteger(q);
}

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
  // Validar inputs antes de procesar
  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, productId: "INVALID_LINES" };
  }
  if (lines.length > 100) {
    throw new Error("Too many stock reservation lines (max 100)");
  }

  const normalized = normalizeLines(lines);
  if (normalized.length === 0) {
    return { ok: false, productId: "INVALID_LINES" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const line of normalized) {
        // Lock del registro con select previo para evitar race condition
        const product = await tx.product.findUnique({
          where: { id: line.productId },
          select: { id: true, stock: true, isActive: true },
        });

        if (!product || !product.isActive || product.stock < line.quantity) {
          throw new StockReservationError(line.productId);
        }

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
    }, {
      isolationLevel: "Serializable",
      maxWait: 5000,
      timeout: 10000,
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
  if (!Array.isArray(lines) || lines.length === 0) return;
  const normalized = normalizeLines(lines);
  if (!normalized.length) return;

  await prisma.$transaction(
    normalized.map((line) =>
      prisma.product.update({
        where: { id: line.productId },
        data: { stock: { increment: line.quantity } },
      })
    ),
    {
      isolationLevel: "Serializable",
      maxWait: 5000,
      timeout: 10000,
    }
  );
}

function normalizeLines(lines: StockReservationLine[]): StockReservationLine[] {
  const merged = new Map<string, number>();
  for (const line of lines) {
    // Validación estricta de inputs
    if (!isValidProductId(line.productId) || !isValidQuantity(line.quantity)) {
      continue;
    }
    merged.set(line.productId, (merged.get(line.productId) ?? 0) + line.quantity);
  }
  return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

class StockReservationError extends Error {
  constructor(readonly productId: string) {
    super(`No stock available for product ${productId}`);
  }
}
