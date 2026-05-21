import { Prisma } from "@prisma/client";

/** Tabla o columna aún no creada (migrate deploy pendiente o fallido). */
export function isPrismaSchemaMissingError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return e.code === "P2021" || e.code === "P2022";
  }
  if (typeof e === "object" && e !== null && "code" in e) {
    const c = (e as { code?: unknown }).code;
    return c === "P2021" || c === "P2022";
  }
  return false;
}
