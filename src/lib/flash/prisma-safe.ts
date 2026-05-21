import { Prisma } from "@prisma/client"

export function isPrismaSchemaDriftError(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return false
  return ["P2021", "P2022", "P2010", "P2032"].includes(e.code)
}
