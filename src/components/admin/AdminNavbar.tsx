"use client"

import Link from "next/link"
import RainbowLogo from "@/components/brand/RainbowLogo"
import { ExternalLink } from "lucide-react"

/** Barra superior del panel admin: solo marca (texto) + volver al marketplace. */
export function AdminNavbar() {
  return (
    <header className="sticky top-0 z-[100] flex h-14 shrink-0 items-center border-b border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(15,23,42,0.95)_100%)] font-outfit shadow-[0_8px_24px_rgba(2,6,23,0.28)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <RainbowLogo
            href="/admin"
            showIcon={false}
            textSizeClassName="text-[20px] font-montserrat"
          />
          <span className="hidden border-l border-white/15 pl-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 sm:inline">
            Panel Admin
          </span>
        </div>

        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-[13px] font-medium text-slate-200 transition-colors hover:border-white/25 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          Ir al marketplace
        </Link>
      </div>
    </header>
  )
}
