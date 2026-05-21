"use client"
import { FLASH_STATUS_LABELS } from "@/lib/flash/types"
import type { FlashShipmentStatus } from "@prisma/client"
import { CheckCircle2, Clock, XCircle } from "lucide-react"

interface LogEntry {
  id: string
  action: string
  actorRole: string
  previousStatus?: FlashShipmentStatus | null
  newStatus?: FlashShipmentStatus | null
  createdAt: Date | string
  metadata?: Record<string, unknown> | null
}

export function FlashTimeline({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="relative space-y-0">
      {logs.map((log, i) => {
        const isLast = i === logs.length - 1
        const isGood = log.newStatus === "DELIVERED"
        const isBad = log.newStatus === "RETURNED_TO_SENDER" || log.newStatus?.startsWith("FAILED")
        return (
          <div key={log.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`rounded-full p-1 mt-1 ${isGood ? "bg-green-100 text-green-600" : isBad ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"}`}>
                {isGood ? <CheckCircle2 className="h-4 w-4" /> : isBad ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium">
                {log.newStatus ? FLASH_STATUS_LABELS[log.newStatus] : log.action}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(log.createdAt).toLocaleString("es-AR")} · {log.actorRole}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
