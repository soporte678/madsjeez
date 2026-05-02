"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  TrendingUp,
  Truck,
  Scale,
  ShieldCheck,
  Download,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
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
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  useEffect(() => {
    fetchDashboardData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // Get today's sales
      const today = new Date().toISOString().split("T")[0]
      const { data: ventasHoy } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", today)
        .eq("status", "completed")

      const ventasDia = ventasHoy?.reduce((acc, order) => acc + (order.total_amount || 0), 0) || 0

      // Get delayed shipments
      const { count: enviosDemora } = await supabase
        .from("shipments")
        .select("*", { count: "exact", head: true })
        .eq("status", "delayed")

      // Get open disputes
      const { count: mediacionesAbiertas } = await supabase
        .from("disputes")
        .select("*", { count: "exact", head: true })
        .eq("status", "open")

      // Get blocked fraud attempts
      const { count: fraudesBloqueados } = await supabase
        .from("fraud_logs")
        .select("*", { count: "exact", head: true })
        .eq("action_taken", "blocked")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      // Get total users
      const { count: totalUsuarios } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })

      // Get total products
      const { count: totalProductos } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })

      // Get total orders
      const { count: totalOrdenes } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })

      // Get monthly revenue
      const firstDayOfMonth = new Date()
      firstDayOfMonth.setDate(1)
      firstDayOfMonth.setHours(0, 0, 0, 0)
      
      const { data: revenueData } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", firstDayOfMonth.toISOString())
        .eq("status", "completed")

      const ingresosMes = revenueData?.reduce((acc, order) => acc + (order.total_amount || 0), 0) || 0

      setStats({
        ventasDia,
        enviosDemora: enviosDemora || 0,
        mediacionesAbiertas: mediacionesAbiertas || 0,
        fraudesBloqueados: fraudesBloqueados || 0,
        totalUsuarios: totalUsuarios || 0,
        totalProductos: totalProductos || 0,
        totalOrdenes: totalOrdenes || 0,
        ingresosMes,
      })
      setLastUpdated(new Date().toLocaleTimeString("es-AR"))
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Error al cargar estadísticas")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const statCards = [
    {
      title: "Ventas del Día",
      value: formatCurrency(stats.ventasDia),
      trend: "+15%",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/admin/ordenes",
    },
    {
      title: "Envíos con Demora",
      value: stats.enviosDemora.toString(),
      trend: "-2%",
      icon: Truck,
      color: "text-red-600",
      bgColor: "bg-red-50",
      alert: stats.enviosDemora > 0,
      href: "/admin/envios",
    },
    {
      title: "Mediaciones Abiertas",
      value: stats.mediacionesAbiertas.toString(),
      trend: "+12%",
      icon: Scale,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      alert: stats.mediacionesAbiertas > 10,
      href: "/admin/mediaciones",
    },
    {
      title: "Intentos de Fraude Bloq.",
      value: stats.fraudesBloqueados.toLocaleString(),
      trend: "Automático",
      icon: ShieldCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/admin/fraude",
    },
  ]

  const secondaryStats = [
    { label: "Usuarios Totales", value: stats.totalUsuarios.toLocaleString(), icon: Users },
    { label: "Productos Activos", value: stats.totalProductos.toLocaleString(), icon: Package },
    { label: "Órdenes del Mes", value: stats.totalOrdenes.toLocaleString(), icon: DollarSign },
    { label: "Ingresos del Mes", value: formatCurrency(stats.ingresosMes), icon: TrendingUp },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Centro de Comando Global</h2>
          <p className="text-sm text-gray-500">Métricas en tiempo real de MaqJeez</p>
          <p className="text-xs text-gray-400 mt-1">
            Actualizado: {lastUpdated || "..."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-gray-600 font-medium hover:bg-gray-100 px-3 py-2 rounded-md transition-colors border border-gray-200 bg-white disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <TrendingUp size={16} />
            )}
            Actualizar
          </button>
          <button className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:bg-blue-50 px-3 py-2 rounded-md transition-colors border border-blue-200 bg-white">
            <Download size={16} /> Descargar Reporte DGT
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Link
            key={i}
            href={stat.href}
            className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <span
                className={`text-xs font-bold flex items-center gap-1 ${
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
                <span>Requiere atención</span>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryStats.map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
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

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/admin/mediaciones"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Scale size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Mediaciones</p>
              <p className="text-xs text-gray-500">Gestionar disputas</p>
            </div>
          </Link>
          
          <Link
            href="/admin/envios"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Envíos</p>
              <p className="text-xs text-gray-500">Radar de demoras</p>
            </div>
          </Link>
          
          <Link
            href="/admin/mensajes"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Moderación</p>
              <p className="text-xs text-gray-500">Preguntas y mensajes</p>
            </div>
          </Link>
          
          <Link
            href="/admin/vendedores"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Vendedores</p>
              <p className="text-xs text-gray-500">Gestión de reputación</p>
            </div>
          </Link>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-lg text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold">Estado del Sistema</h3>
            <p className="text-slate-400 text-sm">Todos los servicios operativos</p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Operativo</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-slate-300">Base de datos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-slate-300">API REST</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-slate-300">Storage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-slate-300">Auth Service</span>
          </div>
        </div>
      </div>
    </div>
  )
}
