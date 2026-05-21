import { prisma } from "@/lib/prisma"
import type { FlashShipmentStatus } from "@prisma/client"

export async function logFlashAudit(opts: {
  shipmentId: string
  actorId: string
  actorRole: "DRIVER" | "SELLER" | "ADMIN" | "SYSTEM"
  action: string
  previousStatus?: FlashShipmentStatus
  newStatus?: FlashShipmentStatus
  metadata?: Record<string, unknown>
}) {
  return prisma.flashAuditLog.create({
    data: {
      shipmentId: opts.shipmentId,
      actorId: opts.actorId,
      actorRole: opts.actorRole,
      action: opts.action,
      previousStatus: opts.previousStatus,
      newStatus: opts.newStatus,
      metadata: (opts.metadata ?? {}) as object,
    },
  })
}
