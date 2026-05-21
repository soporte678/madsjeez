"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Home, QrCode, User, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

type DriverShellProps = {
  children: React.ReactNode
  onScan?: () => void
  onRefresh?: () => void
  refreshing?: boolean
}

const NAV = [
  { href: "/driver", label: "Inicio", icon: Home, match: (p: string) => p === "/driver" },
  { href: "/driver/perfil", label: "Perfil", icon: User, match: (p: string) => p.startsWith("/driver/perfil") },
] as const

export function DriverShell({
  children,
  onScan,
}: DriverShellProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const firstName =
    session?.user?.name?.split(" ")[0] ||
    session?.user?.email?.split("@")[0] ||
    "Repartidor"

  return (
    <div className="driver-app flex min-h-[100dvh] flex-col bg-[#0b0f14] text-slate-100">
      {/* Header fijo estilo app de delivery */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0b0f14]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-lg px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#facc15] to-[#f97316] shadow-lg shadow-amber-500/25">
                <Zap className="h-6 w-6 fill-black text-black" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Flash Repartidor
                </p>
                <h1 className="truncate text-lg font-bold text-white">
                  Hola, {firstName}
                </h1>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              En línea
            </span>
          </div>
        </div>
      </header>

      <main className="driver-main mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4">
        {children}
      </main>

      {/* Barra inferior + FAB escanear */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[#121820]/98 backdrop-blur-xl"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="relative mx-auto grid max-w-lg grid-cols-3 items-end px-6 pt-2">
          {(() => {
            const home = NAV[0]
            const activeHome = home.match(pathname)
            return (
              <Link
                href={home.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors",
                  activeHome ? "text-[#facc15]" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <home.icon className={cn("h-5 w-5", activeHome && "stroke-[2.5px]")} />
                {home.label}
              </Link>
            )
          })()}

          <div className="flex justify-center">
            <button
              type="button"
              onClick={onScan}
              className="flex h-14 w-14 -translate-y-5 items-center justify-center rounded-2xl bg-gradient-to-br from-[#facc15] to-[#ea580c] text-black shadow-xl shadow-orange-500/40 ring-4 ring-[#0b0f14] transition-transform active:scale-95"
              aria-label="Escanear pedido"
            >
              <QrCode className="h-7 w-7" strokeWidth={2.5} />
            </button>
          </div>

          {(() => {
            const profile = NAV[1]
            const activeProfile = profile.match(pathname)
            return (
              <Link
                href={profile.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors",
                  activeProfile ? "text-[#facc15]" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <profile.icon className={cn("h-5 w-5", activeProfile && "stroke-[2.5px]")} />
                {profile.label}
              </Link>
            )
          })()}
        </div>
      </nav>
    </div>
  )
}
