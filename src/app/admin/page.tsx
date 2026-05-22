"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Download,
  Package,
  Scale,
  ShieldCheck,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react"
import { toast } from "sonner"
interface DashboardStats {
  ventasDia: number
  enviosDemora: number
  mediacionesAbiertas: number
  fraudesBloqueados: number
  totalUsuarios: number
  totalProductos: number
  totalOrdenes: number
  ingresosMes: number
  visitas30d: number
  organico30d: number
  pago30d: number
  sesiones30d: number
  pageViews30d: number
  eventos30d: number
  gaSource: string
  internalEvents: Record<string, number>
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    ventasDia: 0,
    enviosDemora: 0,
    mediacionesAbiertas: 0,
    fraudesBloqueados: 0,
    totalUsuarios: 0,
    totalProductos: 0,
    totalOrdenes: 0,
    ingresosMes: 0,
    visitas30d: 0,
    organico30d: 0,
    pago30d: 0,
    sesiones30d: 0,
    pageViews30d: 0,
    eventos30d: 0,
    gaSource: "web_visits",
    internalEvents: {},
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  useEffect(() => {
    void fetchDashboardData()
    const interval = setInterval(() => void fetchDashboardData(), 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)

    try {
      const statsRes = await fetch("/api/admin/dashboard-stats", { credentials: "include" })
      if (!statsRes.ok) {
        throw new Error("dashboard-stats failed")
      }
      const core = await statsRes.json()

      const trafficRes = await fetch("/api/admin/traffic/summary", { credentials: "include" })
      const traffic = trafficRes.ok
        ? await trafficRes.json()
        : {
            total: 0,
            organic: 0,
            paid: 0,
            sessions: 0,
            pageViews: 0,
            eventCount: 0,
            source: "web_visits",
            internalEvents: {},
          }

      setStats({
        ventasDia: core.ventasDia ?? 0,
        enviosDemora: core.enviosDemora ?? 0,
        mediacionesAbiertas: core.mediacionesAbiertas ?? 0,
        fraudesBloqueados: core.fraudesBloqueados ?? 0,
        totalUsuarios: core.totalUsuarios ?? 0,
        totalProductos: core.totalProductos ?? 0,
        totalOrdenes: core.totalOrdenes ?? 0,
        ingresosMes: core.ingresosMes ?? 0,
        visitas30d: traffic.total || 0,
        organico30d: traffic.organic || 0,
        pago30d: traffic.paid || 0,
        sesiones30d: traffic.sessions || 0,
        pageViews30d: traffic.pageViews || 0,
        eventos30d: traffic.eventCount || 0,
        gaSource: traffic.source || "web_visits",
        internalEvents: traffic.internalEvents || {},
      })
      setLastUpdated(new Date().toLocaleTimeString("es-AR"))
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Error al cargar estadisticas")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const statCards = [
    {
      title: "Ventas del dia",
      value: formatCurrency(stats.ventasDia),
      trend: "+15%",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/admin/ordenes",
    },
    {
      title: "Envios con demora",
      value: stats.enviosDemora.toString(),
      trend: "-2%",
      icon: Truck,
      color: "text-red-600",
      bgColor: "bg-red-50",
      alert: stats.enviosDemora > 0,
      href: "/admin/envios",
    },
    {
      title: "Mediaciones abiertas",
      value: stats.mediacionesAbiertas.toString(),
      trend: "+12%",
      icon: Scale,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      alert: stats.mediacionesAbiertas > 10,
      href: "/admin/mediaciones",
    },
    {
      title: "Fraude bloqueado",
      value: stats.fraudesBloqueados.toLocaleString(),
      trend: "Automatico",
      icon: ShieldCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/admin/fraude",
    },
  ]

  const secondaryStats = [
    { label: "Usuarios totales", value: stats.totalUsuarios.toLocaleString(), icon: Users },
    { label: "Productos activos", value: stats.totalProductos.toLocaleString(), icon: Package },
    { label: "Ordenes del mes", value: stats.totalOrdenes.toLocaleString(), icon: DollarSign },
    { label: "Ingresos del mes", value: formatCurrency(stats.ingresosMes), icon: TrendingUp },
    { label: "Visitas 30 dias", value: stats.visitas30d.toLocaleString(), icon: Users },
    { label: "Sesiones 30 dias", value: stats.sesiones30d.toLocaleString(), icon: TrendingUp },
    { label: "Pageviews 30 dias", value: stats.pageViews30d.toLocaleString(), icon: Package },
    { label: "Eventos 30 dias", value: stats.eventos30d.toLocaleString(), icon: ShieldCheck },
    { label: "Organico 30 dias", value: stats.organico30d.toLocaleString(), icon: ArrowUpRight },
    { label: "Pago 30 dias", value: stats.pago30d.toLocaleString(), icon: DollarSign },
  ]

  const eventHighlights = [
    { label: "view_item", value: stats.internalEvents.view_item || 0 },
    { label: "add_to_cart", value: stats.internalEvents.add_to_cart || 0 },
    { label: "begin_checkout", value: stats.internalEvents.begin_checkout || 0 },
    { label: "purchase", value: stats.internalEvents.purchase || 0 },
    { label: "generate_lead", value: stats.internalEvents.generate_lead || 0 },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Centro de comando global</h2>
          <p className="text-sm text-gray-500">
            Metricas en tiempo real del marketplace y Google Analytics
          </p>
          <p className="mt-1 text-xs text-blue-600">
            Fuente de trafico:{" "}
            {stats.gaSource === "ga4" ? "Google Analytics 4" : "Tracking interno"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Actualizado: {lastUpdated || "..."}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            ) : (
              <TrendingUp size={16} />
            )}
            Actualizar
          </button>
          <button className="flex items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50">
            <Download size={16} />
            Descargar reporte DGT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="group rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-2 flex items-start justify-between">
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <span
                className={`flex items-center gap-1 text-xs font-bold ${
                  stat.alert ? "text-red-600" : stat.color
                }`}
              >
                {stat.trend === "+15%" || stat.trend === "+12%" ? (
                  <ArrowUpRight size={12} />
                ) : stat.trend === "-2%" ? (
                  <ArrowDownRight size={12} />
                ) : null}
                {stat.trend}
              </span>
            </div>
            {stat.alert && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-red-600">
                <AlertTriangle size={12} />
                <span>Requiere atencion</span>
              </div>
            )}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {secondaryStats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-100 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2">
                <stat.icon size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Embudo medido del marketplace</h3>
            <p className="text-sm text-gray-500">
              Espejo interno de eventos ecommerce y leads para validar lo que dispara el sitio.
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            Tracking interno espejo
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {eventHighlights.map((event) => (
            <div key={event.label} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{event.label}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{event.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-800">Acciones rapidas</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/mediaciones"
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <Scale size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Mediaciones</p>
              <p className="text-xs text-gray-500">Gestionar disputas</p>
            </div>
          </Link>

          <Link
            href="/admin/envios"
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Truck size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Envios</p>
              <p className="text-xs text-gray-500">Radar de demoras</p>
            </div>
          </Link>

          <Link
            href="/admin/mensajes"
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <AlertTriangle size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Moderacion</p>
              <p className="text-xs text-gray-500">Preguntas y mensajes</p>
            </div>
          </Link>

          <Link
            href="/admin/vendedores"
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Vendedores</p>
              <p className="text-xs text-gray-500">Gestion y reputacion</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold">Estado del sistema</h3>
            <p className="text-sm text-slate-400">
              Seguimiento del marketplace, base de datos y servicios
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-2 text-green-400">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <span className="text-sm font-medium">Operativo</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          {["Base de datos", "API REST", "Storage", "Auth Service"].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
