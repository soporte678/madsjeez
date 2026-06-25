"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { ArrowLeft, RefreshCw, ShoppingCart, Users, TrendingUp, Package, DollarSign, Eye } from 'lucide-react'

type Hourly = { hour: string; amount: number }
type TopProduct = { title: string; img: string; qty: number; amount: number }
type Metrics = {
  uniqueVisits: number; totalBuyers: number; orderCount: number
  conversion: string; unitsSold: number; avgPrice: number
}
type MonitorData = {
  todayTotal: number; yesterdayTotal: number
  metrics: Metrics; hourlyToday: Hourly[]; hourlyYesterday: Hourly[]
  topProducts: TopProduct[]; updatedAt: string
}

const ars = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(v)

function useClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

export default function MonitorVentas() {
  const [data, setData] = useState<MonitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clock = useClock()

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const r = await fetch('/api/dashboard/monitor-ventas', { cache: 'no-store' })
      if (!r.ok) throw new Error('Error al cargar')
      setData(await r.json())
      setError(null)
    } catch {
      setError('No se pudo cargar el monitor. Reintentando...')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const id = setInterval(() => load(true), 60_000)
    return () => clearInterval(id)
  }, [load])

  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  const chartData = data?.hourlyToday?.map((h, i) => ({
    hour: h.hour,
    Hoy: h.amount,
    Ayer: data.hourlyYesterday?.[i]?.amount ?? 0,
  })) ?? []

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gray-950/95 backdrop-blur border-b border-gray-800">
        <Link href="/dashboard/metricas" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={16} />
          Volver a Métricas
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{today.charAt(0).toUpperCase() + today.slice(1)}</span>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-mono">{clock}</span>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Titulo + total */}
        <div className="text-center space-y-2">
          <h1 className="text-lg text-gray-400 font-medium">Ventas de hoy en vivo</h1>
          {loading ? (
            <div className="h-20 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <p className="text-6xl font-black tabular-nums tracking-tight text-white">
              {ars(data?.todayTotal ?? 0)}
            </p>
          )}
          {data && !loading && (
            <p className="text-sm text-gray-500">
              {data.todayTotal === 0 && data.yesterdayTotal === 0
                ? 'Sin ventas registradas'
                : data.yesterdayTotal > 0
                  ? `Ayer: ${ars(data.yesterdayTotal)}`
                  : 'Sin ventas ayer'
              }
            </p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        {/* Métricas clave */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon: Eye, label: 'Visitas únicas', value: data?.metrics.uniqueVisits ?? 0, fmt: (v: number) => v.toString() },
            { icon: Users, label: 'Total compradores', value: data?.metrics.totalBuyers ?? 0, fmt: (v: number) => v.toString() },
            { icon: ShoppingCart, label: 'Cantidad de ventas', value: data?.metrics.orderCount ?? 0, fmt: (v: number) => v.toString() },
            { icon: TrendingUp, label: 'Conversión', value: data?.metrics.conversion ?? '0%', fmt: (v: string) => v },
            { icon: Package, label: 'Unidades vendidas', value: data?.metrics.unitsSold ?? 0, fmt: (v: number) => `${v} u.` },
            { icon: DollarSign, label: 'Precio promedio', value: data?.metrics.avgPrice ?? 0, fmt: (v: number) => ars(v) },
          ].map(({ icon: Icon, label, value, fmt }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col items-center gap-2">
              <Icon size={20} className="text-gray-500" />
              <p className="text-xs text-gray-500 text-center leading-tight">{label}</p>
              <p className="text-xl font-black text-white tabular-nums">
                {loading ? '—' : (fmt as (v: typeof value) => string)(value)}
              </p>
            </div>
          ))}
        </div>

        {/* Gráfico tendencias */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-6">Tendencias en ventas brutas</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : chartData.every(d => d.Hoy === 0 && d.Ayer === 0) ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2">
              <TrendingUp size={32} className="text-gray-700" />
              <p className="text-sm text-gray-500">Sin ventas registradas hoy</p>
              <p className="text-xs text-gray-600">El gráfico se actualizará cuando lleguen ventas</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={v => v.slice(0, 2)}
                  interval={1}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={v => v === 0 ? '0' : `$${(v/1000).toFixed(0)}k`}
                  width={50}
                />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => ars(Number(v)) as any}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
                  iconType="circle"
                />
                <Line type="monotone" dataKey="Hoy" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Ayer" stroke="#ec4899" strokeWidth={1.5} dot={false} strokeDasharray="4 2" activeDot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Productos más vendidos */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Productos más vendidos hoy</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !data?.topProducts?.length ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <ShoppingCart size={32} className="text-gray-700" />
              <p className="text-sm text-gray-500">No vendiste ningún producto hoy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-xs font-bold text-gray-600 w-4">{i + 1}</span>
                  {p.img && (
                    <img src={p.img} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-700 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{p.title}</p>
                    <p className="text-xs text-gray-500">{p.qty} {p.qty === 1 ? 'unidad' : 'unidades'}</p>
                  </div>
                  <p className="text-sm font-bold text-white tabular-nums flex-shrink-0">{ars(p.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-700 pb-4">
          Actualización automática cada 60 segundos
          {data?.updatedAt && ` · Última actualización: ${new Date(data.updatedAt).toLocaleTimeString('es-AR')}`}
        </p>
      </div>
    </div>
  )
}
