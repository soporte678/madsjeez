"use client"
import { FLASH_STATUS_LABELS, FLASH_STATUS_COLORS } from "@/lib/flash/types"
import type { FlashShipmentStatus } from "@prisma/client"
import { Zap } from "lucide-react"

export function FlashStatusBadge({ status }: { status: FlashShipmentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${FLASH_STATUS_COLORS[status]}`}>
      <Zap className="h-3 w-3 fill-current" />
      {FLASH_STATUS_LABELS[status]}
    </span>
  )
}
