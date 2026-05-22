/**
 * OrderStatus en Postgres (Prisma): PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED.
 * No existe COMPLETED; el alias histórico "completed" se mapea a DELIVERED.
 */

export const PRISMA_ORDER_STATUS_VALUES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type PrismaOrderStatus = (typeof PRISMA_ORDER_STATUS_VALUES)[number];

const LEGACY_TO_DB: Record<string, PrismaOrderStatus> = {
  pending: "PENDING",
  paid: "PAID",
  preparing: "PROCESSING",
  processing: "PROCESSING",
  shipped: "SHIPPED",
  delivered: "DELIVERED",
  completed: "DELIVERED",
  cancelled: "CANCELLED",
  canceled: "CANCELLED",
  refunded: "REFUNDED",
};

/** Valor seguro para filtros Supabase/PostgREST (.eq("status", …)). */
export function toSupabaseOrderStatusFilter(value: string): PrismaOrderStatus {
  const key = value.trim().toLowerCase();
  return LEGACY_TO_DB[key] ?? (value.trim().toUpperCase() as PrismaOrderStatus);
}

/** Normaliza lectura de fila (UI / API) — acepta alias legacy. */
export function normalizeOrderStatusForUi(status: string): string {
  const upper = toSupabaseOrderStatusFilter(status);
  return upper;
}

export function isCompletedOrderStatus(status: string): boolean {
  const u = toSupabaseOrderStatusFilter(status);
  return u === "DELIVERED";
}

export function isPaidLikeOrderStatus(status: string): boolean {
  const u = toSupabaseOrderStatusFilter(status);
  return (
    u === "PAID" ||
    u === "PROCESSING" ||
    u === "SHIPPED" ||
    u === "DELIVERED"
  );
}
