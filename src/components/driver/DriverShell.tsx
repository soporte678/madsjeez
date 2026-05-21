"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Home,
  Package,
  Wallet,
  LayoutGrid,
  QrCode,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { FlashDriverDutyStatus } from "@prisma/client"
import { DUTY_STATUS_COLORS, DUTY_STATUS_LABELS } from "@/lib/flash/driver-constants"
import { DriverSupportFab } from "@/components/driver/DriverSupportFab"

type DriverShellProps = {
  children: React.ReactNode
  onScan?: () => void
  dutyStatus?: FlashDriverDutyStatus
  onDutyChange?: (status: FlashDriverDutyStatus) => void
}

const NAV = [
  { href: "/driver", label: "Inicio", icon: Home, match: (p: string) => p === "/driver" },
  {
    href: "/driver/pedidos",
    label: "Pedidos",
    icon: Package,
    match: (p: string) => p.startsWith("/driver/pedidos"),
  },
  {
    href: "/driver/ganancias",
    label: "Ganancias",
    icon: Wallet,
    match: (p: string) => p.startsWith("/driver/ganancias"),
  },
  {
    href: "/driver/mas",
    label: "Más",
    icon: LayoutGrid,
    match: (p: string) => p.startsWith("/driver/mas") || p.startsWith("/driver/perfil"),
  },
] as const

export function DriverShell({
  children,
  onScan,
  dutyStatus = "OFFLINE",
  onDutyChange,
}: DriverShellProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const firstName =
    session?.user?.name?.split(" ")[0] ||
    session?.user?.email?.split("@")[0] ||
    "Repartidor"

  const cycleDuty = () => {
    if (!onDutyChange) return
    const order: FlashDriverDutyStatus[] = ["OFFLINE", "ONLINE", "ON_BREAK", "ON_TRIP"]
    const idx = order.indexOf(dutyStatus)
    onDutyChange(order[(idx + 1) % order.length])
  }

  return (
    <div className="driver-app flex min-h-[100dvh] flex-col bg-[#0b0f14] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0b0f14]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-lg px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#facc15] to-[#f97316] shadow-lg shadow-amber-500/25">
                <Zap className="h-6 w-6 fill-black text-black" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Flash Repartidor
                </p>
                <h1 className="truncate text-lg font-bold text-white">Hola, {firstName}</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={cycleDuty}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors",
                DUTY_STATUS_COLORS[dutyStatus]
              )}
            >
              {DUTY_STATUS_LABELS[dutyStatus]}
            </button>
          </div>
        </div>
      </header>

      <main className="driver-main mx-auto w-full max-w-lg flex-1 px-4 pb-32 pt-4">{children}</main>

      <DriverSupportFab />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[#121820]/98 backdrop-blur-xl"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="relative mx-auto grid max-w-lg grid-cols-4 items-end px-2 pt-1">
          {NAV.map((item) => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[9px] font-semibold",
                  active ? "text-[#facc15]" : "text-slate-500"
                )}
              >
                <item.icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
                {item.label}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={onScan}
            className="absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-5 items-center justify-center rounded-2xl bg-gradient-to-br from-[#facc15] to-[#ea580c] text-black shadow-xl shadow-orange-500/40 ring-4 ring-[#0b0f14]"
            aria-label="Escanear"
          >
            <QrCode className="h-7 w-7" strokeWidth={2.5} />
          </button>
        </div>
      </nav>
    </div>
  )
}
