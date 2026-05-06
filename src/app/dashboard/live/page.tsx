"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useLiveMonitor } from "@/hooks/useLiveMonitor"
import { HourlySalesChart } from "@/components/dashboard/charts/HourlySalesChart"
import {
  ArrowLeft, ChevronDown, Users, ShoppingCart, RefreshCcw,
  Box, Tag, Activity, Target
} from "lucide-react"
import Link from "next/link"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 2
  }).format(value)
}

export default function LiveMonitorPage() {
  const router = useRouter()
  const { status } = useSession()
  const { live, topProducts, hourlyData, isLoading, lastUpdated, refresh } = useLiveMonitor()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?redirect=/dashboard/live")
    }
  }, [status, router])

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const liveData = live || {
    todayRevenue: 0,
    todaySales: 0,
    todayViews: 0,
    uniqueBuyers: 0,
    conversionRate: 0,
    averagePrice: 0,
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <div className="bg-muted py-8 text-center relative border-b border-border">
        <Link href="/dashboard" className="absolute left-6 top-6 flex items-center gap-1 text-slate-900 font-bold hover:underline">
          <ArrowLeft size={16} /> Volver al dashboard
        </Link>
        <h1 className="text-2xl font-black text-gray-800">Ventas de hoy en vivo</h1>
        
        {/* Caja Blanca Flotante */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-10 w-[500px] bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
          <div className="flex justify-center items-center gap-2 text-xs font-bold text-gray-500 mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> HOY, EN ESTE MOMENTO
          </div>
          <div className="text-5xl font-black text-gray-800">{formatCurrency(liveData.todayRevenue)}</div>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-2">Actualizado: {new Date(lastUpdated).toLocaleTimeString('es-AR')}</p>
          )}
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-[1200px] mx-auto pt-20 px-4 pb-12 flex gap-6">
        
        {/* Métricas Clave */}
        <div className="w-72 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-6 grid grid-cols-2 gap-y-8 gap-x-4 text-center">
          <div className="col-span-2 mb-2">
            <h3 className="font-bold text-gray-800 text-sm">Métricas clave</h3>
          </div>
          <div className="flex flex-col items-center">
            <Users size={20} className="text-blue-400 mb-2"/>
            <span className="text-xs text-gray-500 mb-1">Visitas únicas</span>
            <span className="text-lg font-black">{liveData.todayViews.toLocaleString('es-AR')}</span>
          </div>
          <div className="flex flex-col items-center border-l border-gray-100">
            <Users size={20} className="text-cyan-400 mb-2"/>
            <span className="text-xs text-gray-500 mb-1">Compradores</span>
            <span className="text-lg font-black">{liveData.uniqueBuyers}</span>
          </div>
          <div className="flex flex-col items-center border-t border-gray-100 pt-6">
            <ShoppingCart size={20} className="text-blue-500 mb-2"/>
            <span className="text-xs text-gray-500 mb-1">Ventas</span>
            <span className="text-lg font-black">{liveData.todaySales}</span>
          </div>
          <div className="flex flex-col items-center border-t border-l border-gray-100 pt-6">
            <RefreshCcw size={20} className="text-purple-400 mb-2"/>
            <span className="text-xs text-gray-500 mb-1">Conversión</span>
            <span className="text-lg font-black">{liveData.conversionRate}%</span>
          </div>
          <div className="flex flex-col items-center border-t border-gray-100 pt-6">
            <Box size={20} className="text-emerald-400 mb-2"/>
            <span className="text-xs text-gray-500 mb-1">Unidades</span>
            <span className="text-lg font-black">{liveData.todaySales} u.</span>
          </div>
          <div className="flex flex-col items-center border-t border-l border-gray-100 pt-6">
            <Tag size={20} className="text-orange-400 mb-2"/>
            <span className="text-xs text-gray-500 mb-1">Precio prom.</span>
            <span className="text-lg font-black">{formatCurrency(liveData.averagePrice)}</span>
          </div>
        </div>

        {/* Gráfico en vivo */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-sm">Tendencias en ventas brutas</h3>
            <button onClick={refresh} className="flex items-center gap-1 text-blue-600 text-xs font-bold hover:underline">
              <RefreshCcw size={12} /> Actualizar
            </button>
          </div>
          <div className="flex gap-3 text-xs font-bold text-gray-500 mb-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Hoy</span>
          </div>
          {hourlyData && hourlyData.length > 0 ? (
            <HourlySalesChart hourlyData={hourlyData} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 pb-10 relative min-h-[350px]">
              <Activity size={40} className="mb-3 opacity-30" />
              <span className="text-sm font-medium">Esperando transacciones...</span>
              <div className="absolute bottom-0 w-full flex justify-between text-[10px] translate-y-4">
                <span>00</span><span>04</span><span>08</span><span>12</span><span>16</span><span>20</span><span>24</span>
              </div>
            </div>
          )}
        </div>

        {/* Ranking Productos */}
        <div className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 text-sm mb-6 text-center">Productos más vendidos hoy</h3>
          {topProducts && topProducts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {topProducts.map((product, i) => (
                <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                  <span className="text-lg font-black text-blue-600 w-8 text-center">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{product.title}</p>
                    <p className="text-xs text-gray-500">{product.quantity} vendidos · {formatCurrency(product.revenue || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 h-64 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
              <Target size={32} className="mb-2 opacity-50"/>
              <span className="text-sm font-medium text-center px-4">Tu top de ventas aparecerá aquí.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
