"use client"

import { DriverShell } from "@/components/driver/DriverShell"
import { useDriverDashboard } from "@/components/driver/useDriverDashboard"
import { DriverCard, formatMoney, MetricPill, SectionTitle } from "@/components/driver/driver-ui"
import { formatArs } from "@/lib/flash/format"

export default function DriverGananciasPage() {
  const { data, loading, setDutyStatus } = useDriverDashboard()

  if (loading || !data) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0b0f14]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#facc15] border-t-transparent" />
      </div>
    )
  }

  const rates = data.rates as Record<string, number>

  return (
    <DriverShell dutyStatus={data.driver.dutyStatus} onDutyChange={setDutyStatus}>
      <SectionTitle title="Ganancias y comisiones" subtitle="Billetera del conductor" />

      <DriverCard accent="green" className="mb-4">
        <p className="text-xs uppercase text-emerald-400">Comisión acumulada hoy</p>
        <p className="text-3xl font-black text-white">{formatMoney(data.summary.commissionToday)}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <MetricPill label="Semana" value={formatMoney(data.summary.earnedWeek)} />
          <MetricPill label="Mes" value={formatMoney(data.summary.earnedMonth)} />
          <MetricPill label="Propinas" value={formatMoney(data.summary.tipsToday ?? 0)} />
        </div>
      </DriverCard>

      <SectionTitle title="Billetera" />
      <div className="mb-4 grid grid-cols-3 gap-2">
        <DriverCard className="!p-3 text-center">
          <p className="text-[10px] text-slate-500">Disponible</p>
          <p className="text-lg font-black text-emerald-400">{formatMoney(data.wallet.available)}</p>
        </DriverCard>
        <DriverCard className="!p-3 text-center">
          <p className="text-[10px] text-slate-500">Pendiente</p>
          <p className="text-lg font-black text-amber-400">{formatMoney(data.wallet.pending)}</p>
        </DriverCard>
        <DriverCard className="!p-3 text-center">
          <p className="text-[10px] text-slate-500">Procesando</p>
          <p className="text-lg font-black text-sky-400">{formatMoney(data.wallet.processing)}</p>
        </DriverCard>
      </div>

      <DriverCard className="mb-4">
        <p className="text-sm font-bold text-white">Próximo cobro</p>
        <p className="mt-1 text-2xl font-black text-white">
          {formatMoney(data.summary.nextPayoutEstimate)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Estado: {data.summary.nextPayoutStatus === "PROCESSING" ? "Procesando" : "Pendiente"}
        </p>
        <button
          type="button"
          className="mt-3 w-full rounded-xl border border-white/15 py-2.5 text-sm font-bold text-slate-300"
          disabled
        >
          Solicitar retiro (próximamente)
        </button>
      </DriverCard>

      <SectionTitle title="Tarifas vigentes" subtitle="Configuradas por el administrador" />
      <DriverCard className="mb-4 space-y-2 text-sm">
        <Row label="Base por pedido" value={formatArs(rates.basePerOrder ?? 3032.9)} />
        <Row label="Base por paquete" value={formatArs(rates.basePerPackage ?? 2850)} />
        <Row label="Extra por km" value={formatArs(rates.extraPerKm ?? 180)} />
        <Row label="Extra lluvia" value={`+${rates.rainBonusPercent ?? 15}%`} />
        <Row label="Extra nocturno" value={`+${rates.nightBonusPercent ?? 12}%`} />
        <Row label="Alta demanda" value={`+${rates.highDemandBonusPercent ?? 20}%`} />
        <Row label="Comisión plataforma" value={`${rates.platformCommissionPercent ?? 8}%`} />
        <Row label="Mín. por bloque Flex" value={formatArs(rates.minGuaranteedPerBlock ?? 12000)} />
      </DriverCard>

      <SectionTitle title="Historial reciente" />
      <div className="space-y-2">
        {(data.earnings ?? []).map(
          (e) => (
            <DriverCard key={e.id} className="!p-3 flex justify-between">
              <div>
                <p className="text-sm font-medium text-white">{e.description}</p>
                <p className="text-[10px] text-slate-500">
                  {new Date(e.createdAt).toLocaleDateString("es-AR")} · {e.status}
                </p>
              </div>
              <p className="font-bold text-emerald-400">{formatMoney(e.netAmount)}</p>
            </DriverCard>
          )
        )}
        {(data.earnings ?? []).length === 0 && (
          <p className="text-center text-sm text-slate-500 py-8">
            Las ganancias aparecerán al completar entregas.
          </p>
        )}
      </div>
    </DriverShell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 py-2 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  )
}
