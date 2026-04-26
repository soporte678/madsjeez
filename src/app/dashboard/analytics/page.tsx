"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useDashboardData } from "@/hooks/useDashboardData"
import { TabButton } from "@/components/dashboard/TabButton"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { MetricBlock } from "@/components/dashboard/MetricBlock"
import { EmptyChartState } from "@/components/dashboard/EmptyChartState"
import { EmptyTableState } from "@/components/dashboard/EmptyTableState"
import { SalesChart } from "@/components/dashboard/charts/SalesChart"
import { CategoryChart } from "@/components/dashboard/charts/CategoryChart"
import {
  ArrowLeft, BarChart2, Filter, ChevronDown, Info,
  LayoutGrid, TrendingUp, ShieldAlert, Clock, Target,
  Users, ShoppingCart, RefreshCcw, Box, Tag, Activity
} from "lucide-react"
import Link from "next/link"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 2
  }).format(value)
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("negocio")
  const router = useRouter()
  const { status } = useSession()
  const { metrics, isLoading, refresh } = useDashboardData()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?redirect=/dashboard/analytics")
    }
  }, [status, router])

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const m = metrics || {
    sales: { total: 0, count: 0, today: 0, todayCount: 0 },
    products: { total: 0, views: 0 },
    orders: [],
    claims: { open: 0 },
    reviews: { pending: 0, average: 0, total: 0 },
    questions: { pending: 0 },
    promotions: { active: 0 },
    shipping: { express: 0 },
  }

  const conversionRate = m.products.views > 0 ? ((m.sales.count / m.products.views) * 100).toFixed(2) : "0"
  const avgPricePerUnit = m.sales.count > 0 ? m.sales.total / m.sales.count : 0

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <header className="bg-[#fff159] py-4 px-4 shadow-sm">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-1 text-blue-900 font-bold hover:underline">
              <ArrowLeft size={16} /> Volver
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Métricas</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-blue-600 font-semibold text-sm hover:underline">Generar reportes</button>
            <Link href="/dashboard/live" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-semibold shadow-sm hover:bg-gray-50">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Monitor en vivo
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="border-b border-gray-200 overflow-x-auto whitespace-nowrap mb-6">
          <nav className="flex gap-6 text-[15px] font-medium">
            <TabButton id="negocio" label="Negocio" current={activeTab} set={setActiveTab} />
            <TabButton id="promociones" label="Promociones" current={activeTab} set={setActiveTab} />
            <TabButton id="costos" label="Costos" current={activeTab} set={setActiveTab} />
            <TabButton id="atencion" label="Atención a compradores" current={activeTab} set={setActiveTab} />
            <TabButton id="envios" label="Desempeño en envíos" current={activeTab} set={setActiveTab} />
            <TabButton id="stock" label="Stock Express" current={activeTab} set={setActiveTab} />
            <TabButton id="mercado" label="Análisis de mercado" current={activeTab} set={setActiveTab} />
            <TabButton id="pagina" label="Mi página" current={activeTab} set={setActiveTab} />
          </nav>
        </div>

        {activeTab === "negocio" && (
          <>
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-500 font-semibold uppercase">Período principal</label>
                  <button className="w-48 flex justify-between items-center px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium">
                    Últimos 7 días <ChevronDown size={16} className="text-gray-400"/>
                  </button>
                </div>
                <button className="flex items-center gap-1 text-blue-600 text-sm font-semibold mt-5 ml-2 hover:underline">
                  <Filter size={14} /> Filtrar
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-base">Resumen de desempeño</h3>
              </div>
              <div className="grid grid-cols-4 border-b border-gray-100">
                <MetricCard title="Ventas brutas" value={formatCurrency(m.sales.total)} />
                <MetricCard title="Unidades vendidas" value={m.sales.count.toString()} />
                <MetricCard title="Precio promedio por unidad" value={formatCurrency(avgPricePerUnit)} />
                <MetricCard title="Visitas" value={m.products.views.toLocaleString('es-AR')} borderRight={false} />
              </div>
              <div className="grid grid-cols-4">
                <MetricCard title="Cantidad de ventas" value={m.sales.count.toString()} />
                <MetricCard title="Conversión" value={`${conversionRate}%`} />
                <MetricCard title="Precio promedio por venta" value={formatCurrency(avgPricePerUnit)} />
                <MetricCard title="Reclamos abiertos" value={m.claims.open.toString()} borderRight={false} />
              </div>
              {m.sales.total > 0 ? (
                <div className="p-6">
                  <SalesChart
                    labels={["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]}
                    data={[0, 0, 0, 0, 0, 0, m.sales.today]}
                    label="Ventas"
                  />
                </div>
              ) : (
                <EmptyChartState
                  text="Aún no tienes ventas en este período"
                  subtext="Tu gráfico se construirá aquí cuando recibas compras."
                  icon={<BarChart2 size={32} />}
                />
              )}
            </div>
          </>
        )}

        {activeTab === "promociones" && (
          <>
            <div className="flex justify-between items-end mb-2 mt-4">
              <button className="w-48 flex justify-between items-center px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium">
                Últimos 7 días <ChevronDown size={16} className="text-gray-400"/>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <MetricCard title="Ventas brutas" value={formatCurrency(m.sales.total)} borderRight={false} />
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <MetricCard title="Promociones activas" value={m.promotions.active.toString()} borderRight={false} />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <EmptyChartState text="Aún no tienes ventas por promociones" subtext="El rendimiento de tus campañas aparecerá aquí." icon={<BarChart2 size={32} />} />
            </div>
            <EmptyTableState title="Promociones" headers={["Promociones", "Visitas", "Ventas", "Conversión", "Ventas Brutas"]} emptyText="Aún no tienes promociones activas con ventas" />
          </>
        )}

        {activeTab === "costos" && (
          <>
            <div className="flex justify-between items-end mb-2 mt-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500 font-semibold uppercase">Período</label>
                <button className="w-48 flex justify-between items-center px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium">
                  Últimos 30 días <ChevronDown size={16} className="text-gray-400"/>
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 p-6">
              <div className="flex items-center gap-12">
                <div className="w-20 h-20 rounded-full border-[10px] border-gray-100 flex items-center justify-center">
                  <span className="text-gray-300 font-bold text-xs">0%</span>
                </div>
                <div className="flex flex-1 justify-between">
                  <MetricBlock title="Ventas concretadas" value={formatCurrency(m.sales.total)} color="bg-blue-500" />
                  <MetricBlock title="Cargos e inversiones" value="-$ 0" color="bg-purple-500" />
                  <MetricBlock title="Impuestos" value="-$ 0" color="bg-orange-500" />
                  <MetricBlock title="Recibiste" value={formatCurrency(m.sales.total)} color="bg-emerald-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-base">Distribución de tus costos</h3>
                <p className="text-2xl font-black text-gray-800 mt-2">{formatCurrency(0)}</p>
              </div>
              <EmptyChartState text="Sin costos registrados" subtext="Tus cargos y retenciones se graficarán aquí." icon={<LayoutGrid size={32} />} />
            </div>
            <EmptyTableState title="Costos por publicación" headers={["Publicación", "Ventas concretadas", "Cargos e inversiones", "Impuestos", "Recibiste"]} emptyText="No hay costos asociados a publicaciones en este período" />
          </>
        )}

        {activeTab === "atencion" && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 mt-4">
              <h3 className="font-semibold text-gray-800 text-base mb-4">Problemas en tus ventas</h3>
              <div className="flex justify-between text-xs text-gray-500 border-b border-gray-100 pb-2 mb-4">
                <span>Principales tipos de problemas</span>
                <span>{m.claims.open} problemas | {m.claims.open} ventas afectadas</span>
              </div>
              {m.claims.open === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <ShieldAlert size={32} className="mb-2 opacity-50" />
                  <span className="text-sm font-medium">No tienes problemas registrados</span>
                  <span className="text-xs">¡Excelente trabajo! Seguí así.</span>
                </div>
              ) : (
                <div className="text-sm text-red-600 font-bold">{m.claims.open} reclamos abiertos</div>
              )}
            </div>
            <h3 className="font-semibold text-gray-800 text-base mb-4">Métricas de reclamos, cancelaciones y devoluciones</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-sm font-bold text-gray-600 mb-1">Reclamos</h4>
                <p className="text-2xl font-black text-gray-800 mb-1">{m.claims.open > 0 ? ((m.claims.open / Math.max(m.sales.count, 1)) * 100).toFixed(1) : 0}% <span className="text-xs text-gray-400 font-normal ml-2">{m.claims.open} ventas</span></p>
                <div className="w-16 h-16 rounded-full border-8 border-gray-100 mt-4"></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-sm font-bold text-gray-600 mb-1">Cancelaciones</h4>
                <p className="text-2xl font-black text-gray-800 mb-1">0% <span className="text-xs text-gray-400 font-normal ml-2">0 ventas</span></p>
                <div className="w-16 h-16 rounded-full border-8 border-gray-100 mt-4"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="text-sm font-bold text-gray-600 mb-1">Mediaciones</h4>
                <p className="text-xl font-black text-gray-800">0%</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 opacity-60">
                <h4 className="text-sm font-bold text-gray-600 mb-1">Devoluciones</h4>
                <p className="text-xs text-gray-500 mt-2">Incluida en Reclamos.</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 opacity-60">
                <h4 className="text-sm font-bold text-gray-600 mb-1">Cambios</h4>
                <p className="text-xs text-gray-500 mt-2">No afecta reputación.</p>
              </div>
            </div>
          </>
        )}

        {activeTab === "envios" && (
          <>
            <div className="flex items-center gap-6 text-sm font-semibold text-gray-600 mb-6 mt-4">
              <button className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md border border-blue-200">Envíos Express</button>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 text-sm mb-4">Radio de cobertura actual</h3>
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ajustable
                </div>
                <p className="text-xs text-gray-500 mt-2">Podés modificar tu radio de cobertura.</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 text-sm mb-4">Radio de cobertura previsto</h3>
                <div className="flex items-center gap-2 text-gray-400 font-bold">
                  <span className="w-4 h-4 rounded-full bg-gray-200"></span> Sin calcular
                </div>
                <p className="text-xs text-gray-500 mt-2">Lo calcularemos cuando hagas entregas.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-base">Historial de tus envíos en las últimas semanas</h3>
              </div>
              <EmptyChartState text="Aún no has realizado envíos Express" subtext="Aquí verás la puntualidad de tus entregas." icon={<Clock size={32} />} />
            </div>
          </>
        )}

        {activeTab === "stock" && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 mt-4">
              <h3 className="font-semibold text-gray-800 text-base mb-4">Asignación y estimación de tu espacio</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2"><span className="font-bold">Este mes</span> <span className="text-[10px] bg-gray-200 px-1 rounded">ASIGNADO</span></div>
                  <p className="text-xs text-gray-500 mb-1">Productos activos</p><p className="font-bold">{m.products.total} u.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2"><span className="font-bold">Envíos express</span> <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded">EXPRESS</span></div>
                  <p className="text-xs text-gray-500 mb-1">Productos con envío</p><p className="font-bold">{m.shipping.express} u.</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-800 text-base mb-4">Espacio de almacenamiento</h3>
              <div className="flex gap-12 items-center">
                <div className="flex-1">
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1"><span>Uso de stock</span><span>{m.products.total} productos</span></div>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((m.products.total / Math.max(m.products.total + 10, 1)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-4 border-l border-gray-200 pl-8">
                  <div className="w-16 h-16 rounded-full border-[6px] border-gray-100 flex items-center justify-center"></div>
                  <div className="text-xs text-gray-500 flex flex-col gap-1">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> Reclamos: {m.claims.open}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Calificación: {m.reviews.average > 0 ? `${m.reviews.average.toFixed(1)}/5` : "Sin datos"}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "mercado" && (
          <>
            <div className="flex items-center gap-6 text-sm font-semibold text-gray-600 mb-6 mt-4">
              <button className="text-blue-600 border-b-2 border-blue-600 pb-2">Competencia</button>
              <button className="hover:text-gray-900 pb-2">Tendencias por categoría</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 p-6">
              <h3 className="font-semibold text-gray-800 text-base mb-2">Ranking de competidores de tus categorías</h3>
              <p className="text-xs text-gray-500 mb-6">Comienza a vender para ver tu posición respecto a otros vendedores.</p>
              <EmptyTableState
                title=""
                headers={["Posición", "Vendedor", "Ventas brutas", "Cantidad de ventas", "Conversión"]}
                emptyText="No hay competidores registrados en tu segmento"
              />
            </div>
          </>
        )}

        {activeTab === "pagina" && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center text-white font-black italic text-xl">M</div>
                <div><h3 className="font-bold text-gray-800">Tu página de vendedor</h3><p className="text-xs text-gray-500">{m.products.views} visitas totales</p></div>
              </div>
              <div className="flex gap-8">
                <div className="flex flex-col"><span className="text-xs text-gray-500 font-bold">Visitas</span><span className="text-xl font-black">{m.products.views.toLocaleString('es-AR')}</span></div>
                <div className="flex flex-col border-l border-gray-200 pl-8"><span className="text-xs text-gray-500 font-bold">Ventas</span><span className="text-xl font-black">{m.sales.count}</span></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 text-sm mb-4">Origen de tus visitas</h3>
                <CategoryChart categories={[
                  { name: "Orgánico", count: Math.round(m.products.views * 0.7), color: "#8B5CF6" },
                  { name: "Publicidad", count: Math.round(m.products.views * 0.3), color: "#06B6D4" },
                ]} />
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 text-sm mb-4">Detalle del origen</h3>
                <div className="flex flex-col gap-4 justify-center h-48 px-8">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16 text-right">Internas</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full">
                      <div className="h-3 bg-purple-500 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16 text-right">Externas</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full">
                      <div className="h-3 bg-cyan-500 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-base">Evolución de tus visitas</h3>
              </div>
              {m.products.views > 0 ? (
                <div className="p-6">
                  <SalesChart labels={["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]} data={Array(7).fill(0).map(() => Math.round(m.products.views / 30))} label="Visitas" />
                </div>
              ) : (
                <EmptyChartState text="Aún no tienes visitas a tu página" subtext="Aquí verás el crecimiento de tu tráfico." icon={<TrendingUp size={32} />} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
