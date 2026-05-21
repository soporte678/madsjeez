"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { DriverShell } from "@/components/driver/DriverShell"
import { useDriverDashboard } from "@/components/driver/useDriverDashboard"
import { DriverCard, SectionTitle } from "@/components/driver/driver-ui"
import { TIER_LABELS } from "@/lib/flash/driver-constants"
import {
  User,
  Truck,
  FileText,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Target,
  TrendingDown,
} from "lucide-react"

export default function DriverMasPage() {
  const { data, loading, setDutyStatus } = useDriverDashboard()

  if (loading || !data) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0b0f14]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#facc15] border-t-transparent" />
      </div>
    )
  }

  const perf = data.performance

  return (
    <DriverShell dutyStatus={data.driver.dutyStatus} onDutyChange={setDutyStatus}>
      <SectionTitle title="Rendimiento" subtitle="Métricas de desempeño" />
      <div className="mb-5 grid grid-cols-2 gap-2">
        <DriverCard className="!p-3">
          <Target className="mb-1 h-4 w-4 text-sky-400" />
          <p className="text-lg font-black">{perf.acceptanceRate}%</p>
          <p className="text-[10px] text-slate-500">Aceptación</p>
        </DriverCard>
        <DriverCard className="!p-3">
          <TrendingDown className="mb-1 h-4 w-4 text-emerald-400" />
          <p className="text-lg font-black">{perf.successRate}%</p>
          <p className="text-[10px] text-slate-500">Éxito entregas</p>
        </DriverCard>
        <DriverCard className="!p-3">
          <p className="text-lg font-black">{perf.avgDeliveryMin} min</p>
          <p className="text-[10px] text-slate-500">Promedio entrega</p>
        </DriverCard>
        <DriverCard className="!p-3">
          <p className="text-lg font-black">{perf.rating.toFixed(1)} ★</p>
          <p className="text-[10px] text-slate-500">
            Nivel {TIER_LABELS[perf.tier as keyof typeof TIER_LABELS]}
          </p>
        </DriverCard>
      </div>

      <SectionTitle title="Mi cuenta" />
      <div className="mb-6 space-y-2">
        <MenuLink href="/driver/perfil" icon={User} label="Datos personales y contraseña" />
        <MenuLink href="/driver/perfil" icon={Truck} label="Vehículo y documentación" />
        <MenuLink href="/driver/ganancias" icon={FileText} label="CBU y pagos" />
        <MenuRow icon={Bell} label="Notificaciones" badge={`${data.notifications.length}`} />
        <MenuRow icon={Shield} label="Verificación cuenta" badge="Activo" />
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/driver/login" })}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-bold text-red-400"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>
    </DriverShell>
  )
}

function MenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#121820] px-4 py-3"
    >
      <span className="flex items-center gap-3 text-sm font-medium text-white">
        <Icon className="h-4 w-4 text-slate-400" />
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-slate-500" />
    </Link>
  )
}

function MenuRow({
  icon: Icon,
  label,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#121820] px-4 py-3">
      <span className="flex items-center gap-3 text-sm font-medium text-white">
        <Icon className="h-4 w-4 text-slate-400" />
        {label}
      </span>
      {badge && (
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
          {badge}
        </span>
      )}
    </div>
  )
}
