"use client"

import { cn } from "@/lib/utils"
import { formatArs } from "@/lib/flash/format"

export function formatMoney(n: number) {
  return formatArs(n)
}

export function DriverCard({
  children,
  className,
  accent,
}: {
  children: React.ReactNode
  className?: string
  accent?: "green" | "blue" | "amber" | "red"
}) {
  const borders = {
    green: "border-emerald-500/25",
    blue: "border-sky-500/25",
    amber: "border-amber-500/25",
    red: "border-red-500/25",
  }
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#121820] p-4",
        accent && borders[accent],
        className
      )}
    >
      {children}
    </div>
  )
}

export function MetricPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-black/25 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  )
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-2">
      <div>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
