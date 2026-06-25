"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import Link from 'next/link';
import {
  Info, Download, Filter, ChevronDown, ChevronRight, ChevronLeft,
  TrendingUp, TrendingDown, Minus, Search,
  X, Check, MoreVertical, Calendar, Package, Users,
} from 'lucide-react';

type DaySales = { day: string; value: number }
type FunnelItem = { name: string; value: number; fill: string }
type HeatmapRow = { hour: string; lun: number; mar: number; mie: number; jue: number; vie: number; sab: number; dom: number }
type Publication = {
  id: string; sku: string; title: string; price: number; sales: number;
  participation: string; visits: number; img: string; condition: string; badge: string | null
}
type MetricsSummary = {
  grossPeriod: number; totalRevenue: number; totalSales: number; canceledSales: number;
  monthlyViews: number; avgPrice: number; conversionRate: string;
  ordersInPeriod: number; activePublications: number; avgPerDay: number;
  abandonedCarts?: number;
}
type PromoData = { campaigns: any[]; coupons: any[]; chartData: any[]; summary: any } | null
type CostData = { summary: any; costDistribution: any[]; topProducts: any[] } | null
type AtencionData = { summary: any; claimsByType: any[]; recentClaims: any[]; delayedShipments: any[] } | null
type EnviosData = { summary: any; weeklyData: any[]; flashByProvince: any[]; recentDelayed: any[] } | null
type StockData = { summary: any; alerts: any[]; byCategory: any[] } | null
type MercadoData = { seller: any; byCategory: any[]; competitorsAvailable: boolean } | null
type MiPaginaData = { profile: any; topByViews: any[]; topBySales: any[]; summary: any } | null

const EMPTY_HEATMAP: HeatmapRow[] = [
  '00','06','08','10','12','14','16','18','20','22'
].map(h => ({ hour: h, lun:0, mar:0, mie:0, jue:0, vie:0, sab:0, dom:0 }))

const EMPTY_SUMMARY: MetricsSummary = {
  grossPeriod: 0, totalRevenue: 0, totalSales: 0, canceledSales: 0,
  monthlyViews: 0, avgPrice: 0, conversionRate: '0.0',
  ordersInPeriod: 0, activePublications: 0, avgPerDay: 0,
}

const ars = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(v)
const n = (v: number) => v.toLocaleString('es-AR')

const periods = ['Últimos 7 días', 'Últimos 14 días', 'Últimos 30 días', 'Este mes', 'Mes anterior'];

// --- COMPONENTS ---

function MetricCard({ title, value, change, changeType }: { title: string; value: string; change?: string; changeType?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-white p-5 border border-gray-100 rounded-lg">
      <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wide">
        {title}
        <Info size={12} className="text-gray-400" />
      </div>
      <div className="text-xl font-black text-gray-800">{value}</div>
      {change && (
        <div className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${
          changeType === 'up' ? 'text-green-600' : changeType === 'down' ? 'text-red-500' : 'text-gray-400'
        }`}>
          {changeType === 'up' && <TrendingUp size={12} />}
          {changeType === 'down' && <TrendingDown size={12} />}
          {changeType === 'neutral' && <Minus size={12} />}
          {change}
        </div>
      )}
    </div>
  );
}

function HeatmapCell({ value, max }: { value: number; max: number }) {
  const intensity = value / max;
  const bg = intensity === 0 ? 'bg-gray-50' :
    intensity < 0.2 ? 'bg-indigo-50' :
    intensity < 0.4 ? 'bg-indigo-100' :
    intensity < 0.6 ? 'bg-indigo-200' :
    intensity < 0.8 ? 'bg-indigo-400' :
    'bg-indigo-600';
  const text = intensity > 0.6 ? 'text-white' : 'text-gray-600';
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${bg} ${text}`}>
      {value > 0 ? value : ''}
    </div>
  );
}

export default function MetricasView() {
  const [activeTab, setActiveTab] = useState('negocio');
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [period, setPeriod] = useState('Últimos 7 días');
  const [compareWith, setCompareWith] = useState('Período anterior');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showCompareDropdown, setShowCompareDropdown] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showMoreMetrics, setShowMoreMetrics] = useState(false);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeAtencionSubTab, setActiveAtencionSubTab] = useState('reclamos');
  const [activeEnvioSubTab, setActiveEnvioSubTab] = useState('turbo');
  const [activeMercadoSubTab, setActiveMercadoSubTab] = useState('posicion');
  const [activeMercadoTab, setActiveMercadoTab] = useState('competencia');
  const [activeMiPaginaSubTab, setActiveMiPaginaSubTab] = useState('trafico');
  const [activeMiPaginaMetric, setActiveMiPaginaMetric] = useState('visitas');
  const [activeAudienciasMetric, setActiveAudienciasMetric] = useState('seguidores');

  // --- Real data state ---
  const [salesData, setSalesData] = useState<DaySales[]>([])
  const [funnelData, setFunnelData] = useState<FunnelItem[]>([])
  const [heatmapData, setHeatmapData] = useState<HeatmapRow[]>(EMPTY_HEATMAP)
  const [publicationsData, setPublicationsData] = useState<Publication[]>([])
  const [summary, setSummary] = useState<MetricsSummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)

  const [promoData, setPromoData] = useState<PromoData>(null)
  const [costData, setCostData] = useState<CostData>(null)
  const [atencionData, setAtencionData] = useState<AtencionData>(null)
  const [enviosData, setEnviosData] = useState<EnviosData>(null)
  const [stockData, setStockData] = useState<StockData>(null)
  const [mercadoData, setMercadoData] = useState<MercadoData>(null)
  const [miPaginaData, setMiPaginaData] = useState<MiPaginaData>(null)
  const [tabLoading, setTabLoading] = useState<string | null>(null)

  const days = period === 'Últimos 14 días' ? 14 : period === 'Últimos 30 días' ? 30 : 7

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dashboard/metricas?days=${days}`)
      .then(r => r.json())
      .then(d => {
        if (d.salesData) setSalesData(d.salesData)
        if (d.funnelData) setFunnelData(d.funnelData)
        if (d.heatmapData) setHeatmapData(d.heatmapData)
        if (d.publicationsData) setPublicationsData(d.publicationsData)
        if (d.summary) setSummary(d.summary)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [days])

  const fetchedTabs = useRef(new Set<string>())

  const loadTab = useCallback(async (tab: string) => {
    if (fetchedTabs.current.has(tab)) return
    fetchedTabs.current.add(tab)
    setTabLoading(tab)
    try {
      const endpointMap: Record<string, string> = {
        promociones: `/api/dashboard/promociones?days=${days}`,
        costos: `/api/dashboard/costos?days=${days}`,
        atencion: `/api/dashboard/atencion?days=${days}`,
        envios: `/api/dashboard/envios`,
        stock: `/api/dashboard/stock`,
        mercado: `/api/dashboard/mercado`,
        mipagina: `/api/dashboard/mipagina`,
      }
      const url = endpointMap[tab]
      if (!url) return
      const r = await fetch(url)
      const d = await r.json()
      if (tab === 'promociones') setPromoData(d)
      else if (tab === 'costos') setCostData(d)
      else if (tab === 'atencion') setAtencionData(d)
      else if (tab === 'envios') setEnviosData(d)
      else if (tab === 'stock') setStockData(d)
      else if (tab === 'mercado') setMercadoData(d)
      else if (tab === 'mipagina') setMiPaginaData(d)
    } catch {}
    finally { setTabLoading(null) }
  }, [days])

  const tabs = [
    { id: 'negocio', label: 'Negocio' },
    { id: 'promociones', label: 'Promociones' },
    { id: 'costos', label: 'Costos' },
    { id: 'atencion', label: 'Atención a tus compradores' },
    { id: 'envios', label: 'Desempeño en envíos' },
    { id: 'stock', label: 'Stock Full' },
    { id: 'mercado', label: 'Análisis de mercado' },
    { id: 'mipagina', label: 'Mi página' },
  ];

  const subTabs = [
    { id: 'general', label: 'Vista general' },
    { id: 'publicaciones', label: 'Publicaciones' },
  ];

  const compareOptions = ['Período anterior', 'Mismo período anterior', 'Sin comparación'];

  const maxHeatmap = useMemo(() =>
    Math.max(1, ...heatmapData.flatMap(d => [d.lun, d.mar, d.mie, d.jue, d.vie, d.sab, d.dom])),
    [heatmapData]);

  const heatStats = useMemo(() => {
    const DAY_KEYS = ['dom','lun','mar','mie','jue','vie','sab'] as const
    const DAY_LABELS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
    let total = 0
    const byDay: Record<string, number> = { dom:0, lun:0, mar:0, mie:0, jue:0, vie:0, sab:0 }
    const byHour: Record<string, number> = {}
    for (const row of heatmapData) {
      let rowTotal = 0
      for (const d of DAY_KEYS) { const v = row[d] || 0; byDay[d] += v; rowTotal += v }
      byHour[row.hour] = rowTotal; total += rowTotal
    }
    const bestDayKey = (Object.entries(byDay).sort((a,b) => b[1]-a[1])[0]?.[0] || 'lun')
    const bestDay = DAY_LABELS[DAY_KEYS.indexOf(bestDayKey as typeof DAY_KEYS[number])] || 'Lunes'
    const peakEntry = Object.entries(byHour).sort((a,b) => b[1]-a[1])[0]
    const peakH = peakEntry ? parseInt(peakEntry[0]) : 18
    const peakPct = total > 0 ? ((Math.max(...Object.values(byHour)) / total) * 100).toFixed(1) : '0.0'
    return { bestDay, bestHour: `De ${String(peakH).padStart(2,'0')}:00 a ${String(peakH+2).padStart(2,'0')}:00`, peakPct }
  }, [heatmapData]);

  const totalPages = Math.ceil(publicationsData.length / 7);
  const paginatedData = publicationsData.slice((currentPage - 1) * 7, currentPage * 7);

  return (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-[1200px] text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-start">
        <h1 className="text-[28px] font-semibold text-slate-800 dark:text-slate-100">Métricas</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setReportMessage(`Reporte listo para ${period.toLowerCase()}${compareWith === 'Sin comparación' ? '' : ` comparado con ${compareWith.toLowerCase()}`}.`)} className="text-blue-600 dark:text-sky-400 text-sm font-medium hover:underline">Generar reporte</button>
          <Link href="/dashboard/monitor-ventas" target="_blank" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-full text-sm font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Monitor de ventas en vivo
          </Link>
        </div>
      </div>

      {reportMessage && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
          <div className="flex items-center justify-between gap-4">
            <span>{reportMessage}</span>
            <button onClick={() => setReportMessage(null)} className="text-sky-600 dark:text-sky-300 hover:opacity-80">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <div className="border-b border-gray-200 dark:border-slate-800">
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); loadTab(tab.id); }}
              className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap ${
                 activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600 dark:text-sky-400 dark:border-sky-400' : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub Tabs (solo Negocio) */}
      {activeTab === 'negocio' && (
        <div className="flex gap-4 border-b border-gray-100 dark:border-slate-800 pb-0">
          {subTabs.map(sub => (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id)}
              className={`pb-2 text-sm transition-colors ${
                activeSubTab === sub.id ? 'text-blue-600 border-b-2 border-blue-600 font-semibold dark:text-sky-400 dark:border-sky-400' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <button
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            {period}
            <ChevronDown size={16} />
          </button>
          {showPeriodDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 w-48">
              {periods.map(p => (
                <button
                  key={p}
                  onClick={() => { setPeriod(p); setShowPeriodDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800 first:rounded-t-lg last:rounded-b-lg"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-sm text-gray-500 dark:text-slate-400">Comparar con</span>
        <div className="relative">
          <button onClick={() => setShowCompareDropdown((prev) => !prev)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800">
            {compareWith}
            <ChevronDown size={16} />
          </button>
          {showCompareDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 w-52">
              {compareOptions.map(option => (
                <button
                  key={option}
                  onClick={() => {
                    setCompareWith(option);
                    setShowCompareDropdown(false);
                    setReportMessage(option === 'Sin comparaciÃ³n' ? 'La vista quedÃ³ sin comparaciÃ³n de perÃ­odos.' : `ComparaciÃ³n activada contra ${option.toLowerCase()}.`);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800 first:rounded-t-lg last:rounded-b-lg"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setShowFilterPanel((prev) => !prev)} className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-sky-400 text-sm font-medium hover:bg-blue-50 dark:hover:bg-sky-500/10 rounded-lg">
          <Filter size={16} />
          Filtrar
        </button>
      </div>

      {showFilterPanel && (
        <div className="rounded-xl border border-slate-200/80 bg-white/92 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/92">
          <div className="flex flex-wrap gap-2">
            {['Marketplace', 'Mercado Pago', 'OrgÃ¡nico', 'Publicidad'].map((chip) => (
              <button
                key={chip}
                onClick={() => setReportMessage(`Filtro rÃ¡pido aplicado: ${chip}.`)}
                className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Necesita ayuda link */}
      <div className="text-right">
        <button onClick={() => setReportMessage('Podemos profundizar mÃ©tricas de ventas, costos, trÃ¡fico o conversiÃ³n segÃºn el mÃ³dulo que estÃ©s revisando.')} className="text-blue-600 dark:text-sky-400 text-sm font-medium hover:underline">Necesito ayuda</button>
      </div>

      {activeTab === 'negocio' && activeSubTab === 'general' && (
        <>
          {/* Resumen de desempeño */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">Resumen de desempeño</h2>
              <button onClick={() => setReportMessage('Resumen exportado para la vista actual de desempeño.')} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800 shadow-sm">
                Descargar reporte
                <ChevronDown size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard title="Ventas brutas" value={loading ? '…' : ars(summary.grossPeriod)} />
              <MetricCard title="Unidades vendidas" value={loading ? '…' : n(summary.totalSales)} />
              <MetricCard title="Precio promedio por unidad" value={loading ? '…' : summary.avgPrice > 0 ? ars(summary.avgPrice) : '—'} />
              <MetricCard title="Visitas" value={loading ? '…' : n(summary.monthlyViews)} />
              {showMoreMetrics && (
                <>
                  <MetricCard title="Cantidad de ventas" value={loading ? '…' : n(summary.totalSales)} />
                  <MetricCard title="Conversión" value={loading ? '…' : `${summary.conversionRate}%`} />
                  <MetricCard title="Precio promedio por venta" value={loading ? '…' : summary.avgPrice > 0 ? ars(summary.avgPrice) : '—'} />
                  <MetricCard title="Cantidad de ventas canceladas" value={loading ? '…' : n(summary.canceledSales)} />
                </>
              )}
            </div>
          </div>

          {/* Ver más */}
          <div className="text-center">
            <button onClick={() => setShowMoreMetrics((prev) => !prev)} className="text-blue-600 dark:text-sky-400 text-sm font-medium hover:underline flex items-center gap-1 mx-auto">
              {showMoreMetrics ? 'Ver menos' : 'Ver más'} <ChevronDown size={16} className={showMoreMetrics ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
          </div>

          {/* Gráfico de Ventas Brutas */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100 mb-4">Ventas brutas</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Ventas']} />
                <Area type="monotone" dataKey="value" stroke="#EC4899" strokeWidth={2} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Conversión de visitas */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 dark:text-slate-100 mb-6">
              Conversión de visitas
              <Info size={14} className="text-gray-400 dark:text-slate-500" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1">Conversión total</div>
                <div className="text-2xl font-black text-gray-800 dark:text-slate-100">{summary.conversionRate}%</div>
                <div className="text-xs text-gray-400 dark:text-slate-500 font-semibold mt-1">últimos {days} días</div>
              </div>
              <div className="flex-[2] w-full">
                <div className="space-y-3">
                  {funnelData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-4">
                      <div className="w-32 text-xs text-gray-500 dark:text-slate-400 text-right">{item.name}</div>
                      <div className="flex-1">
                        <div
                          className="h-10 rounded-lg flex items-center px-3 text-sm font-bold transition-all"
                          style={{
                            width: funnelData[0]?.value ? `${(item.value / funnelData[0].value) * 100}%` : '100%',
                            backgroundColor: item.fill,
                            color: idx === 2 ? 'white' : '#374151',
                            minWidth: '60px'
                          }}
                        >
                          {item.value.toLocaleString()}
                          {idx === 0 && funnelData[0]?.value > 0 && funnelData[2]?.value != null && (
                            <span className="ml-1 text-[10px] font-normal">({((funnelData[2].value / funnelData[0].value) * 100).toFixed(1)}%)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-sm text-gray-500 dark:text-slate-400 mb-2">Ventas totales</div>
                <div className="text-xl font-black text-gray-800 dark:text-slate-100">{summary.ordersInPeriod} <span className="text-xs font-normal text-gray-500 dark:text-slate-400">({ars(summary.grossPeriod)})</span></div>
              </div>
            </div>
            {(summary.abandonedCarts ?? 0) > 0 && (
              <div className="mt-6 p-3 bg-blue-50 dark:bg-sky-500/10 rounded-lg flex items-center gap-3">
                <Info size={16} className="text-blue-600 dark:text-sky-400 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-sky-200">
                  Convertí en ventas los <strong>{n(summary.abandonedCarts ?? 0)} carritos abandonados</strong> comunicando un cupón de descuento.
                </p>
                <button onClick={() => setReportMessage('Acción sugerida: lanzar cupón para carritos abandonados desde Promociones > Cupones.')} className="text-xs text-blue-600 dark:text-sky-300 font-semibold hover:underline flex-shrink-0">Comunicar cupón</button>
              </div>
            )}
          </div>

          {/* Concentración de ventas por día y hora */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 mb-2">
              Concentración de ventas por día y hora
              <Info size={14} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mb-6">
              El período abarca más de una semana, por lo que cada día refleja un promedio. Por ejemplo, los Lunes promedian las ventas de todos los Lunes del período seleccionado.
            </p>
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{summary.ordersInPeriod}</span>
                {summary.ordersInPeriod > 0 && <span className="text-xs text-green-600 font-semibold">{heatStats.peakPct}%</span>}
                <span className="text-xs text-gray-500">Cantidad de ventas totales</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{summary.avgPerDay}</span>
                <span className="text-xs text-gray-500">Promedio de ventas por día</span>
              </div>
              {summary.ordersInPeriod > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">{heatStats.bestDay}</span>
                    <span className="text-xs text-gray-500">Día con más ventas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">{heatStats.bestHour}</span>
                    <span className="text-xs text-gray-500">Franja</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 mb-2">
              <div className="flex gap-1">
                {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => (
                  <div key={d} className="w-8 text-[10px] text-center text-gray-400">{d.slice(0, 3)}</div>
                ))}
              </div>
              <div className="w-12 text-[10px] text-center text-gray-400">Total</div>
            </div>
            {heatmapData.map((row, i) => (
              <div key={i} className="flex items-center gap-1 mb-1">
                <div className="w-12 text-[10px] text-gray-400 text-right pr-2">{row.hour}:00</div>
                <div className="flex gap-1">
                  <HeatmapCell value={row.dom} max={maxHeatmap} />
                  <HeatmapCell value={row.lun} max={maxHeatmap} />
                  <HeatmapCell value={row.mar} max={maxHeatmap} />
                  <HeatmapCell value={row.mie} max={maxHeatmap} />
                  <HeatmapCell value={row.jue} max={maxHeatmap} />
                  <HeatmapCell value={row.vie} max={maxHeatmap} />
                  <HeatmapCell value={row.sab} max={maxHeatmap} />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 mt-4">
              {['Sin ventas', 'Baja', 'Media', 'Alta'].map((label, i) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${
                    i === 0 ? 'bg-gray-50' : i === 1 ? 'bg-indigo-200' : i === 2 ? 'bg-indigo-400' : 'bg-indigo-600'
                  }`} />
                  <span className="text-[10px] text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Detalle de competidores + Rendimiento de publicaciones (para ambas sub-tabs de Negocio) */}
      {activeTab === 'negocio' && (
        <>
          {/* Detalle de competidores */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100 mb-1">Detalle de competidores</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">Análisis basado en tu categoría principal</p>
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Users size={32} className="text-gray-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Análisis de competidores próximamente</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 text-center max-w-xs">Esta sección mostrará métricas comparativas de tu categoría cuando integres tu cuenta de MercadoLibre.</p>
            </div>
          </div>

          {/* Rendimiento de tus publicaciones */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Rendimiento de tus publicaciones</h3>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50">
                  <Search size={14} />
                  Todos
                  <ChevronDown size={14} />
                </button>
                <span className="text-xs text-gray-500">{summary.activePublications} publicaciones</span>
                <button className="flex items-center gap-2 px-3 py-1.5 text-blue-600 text-xs font-medium hover:bg-blue-50 rounded-lg">
                  <Download size={14} />
                  Descargar reporte
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-xs font-semibold text-gray-500">Publicación</th>
                    <th className="text-right p-3 text-xs font-semibold text-gray-500">Ventas brutas</th>
                    <th className="text-right p-3 text-xs font-semibold text-gray-500">Cantidad de ventas</th>
                    <th className="text-right p-3 text-xs font-semibold text-gray-500">% de participación</th>
                    <th className="text-right p-3 text-xs font-semibold text-gray-500">Visitas</th>
                    <th className="text-right p-3 text-xs font-semibold text-gray-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((pub) => (
                    <tr key={pub.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {pub.badge && (
                            <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded">{pub.badge}</span>
                          )}
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            <img src={pub.img} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">{pub.sku}</div>
                            <div className="text-sm text-gray-800 font-medium truncate max-w-[200px]">{pub.title}</div>
                            <div className="text-xs text-gray-500">{pub.condition} • 3 cuotas • Envío gratis</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right text-sm text-gray-800">
                        $ {pub.price.toLocaleString()}
                        <div className="text-xs text-gray-400">—</div>
                      </td>
                      <td className="p-3 text-right text-sm text-gray-800">{pub.sales}</td>
                      <td className="p-3 text-right text-sm text-gray-800">{pub.participation}</td>
                      <td className="p-3 text-right text-sm text-gray-800">{pub.visits}</td>
                      <td className="p-3 text-right">
                        <button className="text-blue-600 text-xs font-medium hover:underline">Ir a detalle</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white text-sm font-semibold rounded-lg">{currentPage}</button>
              {totalPages > 1 && (
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 text-sm hover:bg-gray-100 rounded-lg"
                >
                  {currentPage + 1}
                </button>
              )}
              <span className="text-sm text-gray-500">de {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* === PUBLICACIONES (sub-tab de Negocio) === */}
      {activeTab === 'negocio' && activeSubTab === 'publicaciones' && (
        <>
          {/* Filters */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  {period}
                  <ChevronDown size={16} />
                </button>
                {showPeriodDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48">
                    {periods.map(p => (
                      <button
                        key={p}
                        onClick={() => { setPeriod(p); setShowPeriodDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Período anterior
                <ChevronDown size={16} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{summary.activePublications} publicaciones</span>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                Descargar reporte
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Título o #"
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-gray-600 text-sm hover:bg-gray-100 rounded-lg">
              <Filter size={16} />
              Filtrar
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-6 bg-gray-300 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 shadow"></div>
              </div>
              <span className="text-sm text-gray-600">Con caída en el rendimiento</span>
              <Info size={14} className="text-gray-400" />
            </div>
          </div>

          {/* Publicaciones Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase">Publicación</th>
                  <th className="text-center p-3 text-[10px] font-semibold text-gray-500 uppercase">Ventas brutas</th>
                  <th className="text-center p-3 text-[10px] font-semibold text-gray-500 uppercase">Visitas</th>
                  <th className="text-center p-3 text-[10px] font-semibold text-gray-500 uppercase">Conversión</th>
                  <th className="text-center p-3 text-[10px] font-semibold text-gray-500 uppercase">Cantidad de ventas</th>
                  <th className="text-center p-3 text-[10px] font-semibold text-gray-500 uppercase">Compradores</th>
                  <th className="text-center p-3 text-[10px] font-semibold text-gray-500 uppercase">Unidades vendidas</th>
                  <th className="text-center p-3 text-[10px] font-semibold text-gray-500 uppercase">% de participación</th>
                  <th className="text-center p-3 text-[10px] font-semibold text-gray-500 uppercase">Opiniones negativas</th>
                  <th className="text-center p-3 text-[10px] font-semibold text-gray-500 uppercase">Condiciones de venta</th>
                  <th className="text-center p-3 text-[10px] font-semibold text-gray-500 uppercase">Competitividad</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="p-8 text-center text-sm text-gray-400">Cargando publicaciones…</td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan={11} className="p-8 text-center text-sm text-gray-400">No hay publicaciones activas</td></tr>
                ) : paginatedData.map((pub) => (
                  <tr key={pub.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          <img src={pub.img} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] text-gray-400">{pub.sku} <Info size={10} className="inline" /></div>
                          <div className="text-xs font-medium text-gray-800 truncate max-w-[180px]">{pub.title}</div>
                          <div className="text-[10px] text-gray-500">{ars(pub.price)} | {pub.condition}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="text-xs text-gray-800 font-medium">{ars(pub.price * pub.sales)}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="text-xs text-gray-800">{pub.visits}</div>
                    </td>
                    <td className="p-3 text-center text-xs text-gray-400">—</td>
                    <td className="p-3 text-center">
                      <div className="text-xs text-gray-800">{pub.sales}</div>
                    </td>
                    <td className="p-3 text-center text-xs text-gray-400">—</td>
                    <td className="p-3 text-center">
                      <div className="text-xs text-gray-800">{pub.sales}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="text-xs text-gray-800">{pub.participation}</div>
                    </td>
                    <td className="p-3 text-center text-xs text-gray-400">—</td>
                    <td className="p-3 text-center">
                      {pub.badge && (
                        <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded">{pub.badge}</span>
                      )}
                      {!pub.badge && <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="p-3 text-center text-xs text-gray-400">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* === PROMOCIONES === */}
      {activeTab === 'promociones' && (
        <>
          {tabLoading === 'promociones' && (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">Cargando promociones…</div>
          )}

          {/* Metrics summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                Ventas brutas <Info size={12} className="text-gray-400" />
              </div>
              <div className="text-xl font-black text-gray-800">{ars(promoData?.summary?.grossPeriod ?? 0)}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                Unidades vendidas <Info size={12} className="text-gray-400" />
              </div>
              <div className="text-xl font-black text-gray-800">{n(promoData?.summary?.unitsSold ?? 0)}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                Campañas activas <Info size={12} className="text-gray-400" />
              </div>
              <div className="text-xl font-black text-gray-800">{promoData?.summary?.activeCampaigns ?? 0}</div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={promoData?.chartData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(v) => v > 0 ? `$${(v/1000).toFixed(0)}k` : ''} />
                <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']} />
                <Line type="monotone" dataKey="actual" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Ventas brutas" />
                <Line type="monotone" dataKey="prev" stroke="#9CA3AF" strokeWidth={2} dot={false} name="Período anterior" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span className="text-xs text-gray-500">Ventas brutas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                <span className="text-xs text-gray-500">Período anterior</span>
              </div>
            </div>
          </div>

          {/* Sub-tabs: Promociones | Cupones */}
          <div className="flex gap-4 border-b border-gray-200">
            <button className="pb-2 text-sm font-semibold text-blue-600 border-b-2 border-blue-600">Promociones</button>
            <button className="pb-2 text-sm text-gray-500 hover:text-gray-700">Cupones</button>
          </div>

          {/* Search + count + download */}
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre de la promoción"
                className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 w-72 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">{promoData?.campaigns?.length ?? 0} promociones</span>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">
                <Download size={14} />
                Descargar reporte
              </button>
            </div>
          </div>

          {/* Promotions Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Promociones</th>
                  <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Visitas</th>
                  <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Cantidad de ventas</th>
                  <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Conversión</th>
                  <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Unidades vendidas</th>
                  <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Ventas brutas</th>
                </tr>
              </thead>
              <tbody>
                {promoData === null && tabLoading !== 'promociones' ? (
                  <tr><td colSpan={6} className="p-8 text-center text-sm text-gray-400">Sin datos para el período</td></tr>
                ) : (promoData?.campaigns ?? []).length === 0 && tabLoading !== 'promociones' ? (
                  <tr><td colSpan={6} className="p-8 text-center text-sm text-gray-400">No hay campañas activas</td></tr>
                ) : (promoData?.campaigns ?? []).map((promo: any, i: number) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        {promo.active && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-white bg-green-500 w-fit">ACTIVA</span>
                        )}
                        <span className="text-xs text-gray-400">{promo.dates ?? promo.dateRange ?? ''}</span>
                        <span className="text-sm font-medium text-gray-800">{promo.name ?? promo.title ?? ''}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center text-sm text-gray-800">{promo.visits ?? '—'}</td>
                    <td className="p-3 text-center text-sm text-gray-400">{promo.sales ?? '—'}</td>
                    <td className="p-3 text-center text-sm text-gray-800">{promo.conversion ?? promo.conversionRate ?? '—'}</td>
                    <td className="p-3 text-center text-sm text-gray-400">{promo.units ?? promo.unitsSold ?? '—'}</td>
                    <td className="p-3 text-center text-sm text-gray-800 font-medium">{promo.revenue != null ? ars(promo.revenue) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* === COSTOS === */}
      {activeTab === 'costos' && (
        <>
          {tabLoading === 'costos' && (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">Cargando costos…</div>
          )}

          {/* Resumen circular */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-8">
              {(() => {
                const circ = 2 * Math.PI * 40; // 251.3
                const total = costData?.summary?.totalSales ?? 0;
                const costs = costData?.summary?.totalCosts ?? 0;
                const received = costData?.summary?.received ?? 0;
                const isEmpty = total === 0 && costs === 0 && received === 0;
                const costsArc = isEmpty ? 0 : Math.min((costs / (total || 1)) * circ, circ);
                const receivedArc = isEmpty ? 0 : Math.max(circ - costsArc, 0);
                return (
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                      {!isEmpty && (
                        <>
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#8B5CF6" strokeWidth="12"
                            strokeDasharray={`${costsArc} ${circ - costsArc}`} strokeLinecap="round" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="12"
                            strokeDasharray={`${receivedArc} ${circ - receivedArc}`}
                            strokeDashoffset={`-${costsArc}`} strokeLinecap="round" />
                        </>
                      )}
                    </svg>
                  </div>
                );
              })()}
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                  Ventas concretadas <Info size={12} className="text-gray-400" />
                </div>
                <div className="text-2xl font-black text-gray-800">{ars(costData?.summary?.totalSales ?? 0)}</div>
                <button className="text-blue-600 text-xs font-medium hover:underline mt-1">Ir a detalle</button>
              </div>
              <div className="flex gap-8">
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Cargos e inversiones <Info size={12} className="text-gray-400" /></div>
                  <div className="text-lg font-bold text-gray-800">- {ars(costData?.summary?.totalCosts ?? 0)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Impuestos <Info size={12} className="text-gray-400" /></div>
                  <div className="text-lg font-bold text-gray-800">- {ars(costData?.summary?.taxTotal ?? 0)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Recibiste <Info size={12} className="text-gray-400" /></div>
                  <div className="text-lg font-bold text-gray-800">{ars(costData?.summary?.received ?? 0)}</div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
              <Info size={14} className="text-blue-500 flex-shrink-0" />
              <span className="text-xs text-blue-700 font-medium">0% Comisión — Madsjeez no cobra comisión adicional sobre tus ventas de MercadoLibre.</span>
            </div>
          </div>

          {/* Distribución de costos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Distribución de tus costos</h3>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-2">
                Cargos, inversiones e impuestos <Info size={12} className="text-gray-400" />
              </div>
              <div className="text-2xl font-black text-gray-800 mb-6">
                {ars((costData?.summary?.totalCosts ?? 0) + (costData?.summary?.taxTotal ?? 0))}
              </div>
              <div className="space-y-3">
                {(costData?.costDistribution ?? []).length > 0 ? (
                  (costData?.costDistribution ?? []).map((item: any, i: number) => {
                    const colors = ['bg-purple-500','bg-purple-400','bg-orange-400','bg-purple-300','bg-purple-200','bg-orange-300','bg-purple-200','bg-gray-300']
                    const total = (costData?.costDistribution ?? []).reduce((s: number, x: any) => s + (x.amount ?? x.value ?? 0), 0)
                    const val = item.amount ?? item.value ?? 0
                    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0'
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-48 text-xs text-gray-600 text-right truncate">{item.label ?? item.name ?? ''}</div>
                        <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                          <div className={`h-full ${colors[i % colors.length]} rounded`} style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="w-12 text-xs font-semibold text-gray-700">{pct}%</div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Sin datos para el período</p>
                )}
              </div>
            </div>
          </div>

          {/* Costos por publicación */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Costos por publicación</h3>
            <div className="flex gap-4 border-b border-gray-200 mb-4">
              <button className="pb-2 text-sm font-semibold text-blue-600 border-b-2 border-blue-600">Rendimiento</button>
              <button className="pb-2 text-sm text-gray-500 hover:text-gray-700">Cargos por devolución</button>
              <button className="pb-2 text-sm text-gray-500 hover:text-gray-700">Cargos por envíos Full</button>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Título o #"
                  className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <span className="text-xs text-gray-500">{costData?.topProducts?.length ?? 0} publicaciones</span>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Publicación</th>
                    <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Ventas concretadas</th>
                    <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Cargos e inversiones</th>
                    <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Impuestos</th>
                    <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Recibiste</th>
                    <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Rentabilidad</th>
                    <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {(costData?.topProducts ?? []).length === 0 && tabLoading !== 'costos' ? (
                    <tr><td colSpan={7} className="p-8 text-center text-sm text-gray-400">Sin datos para el período</td></tr>
                  ) : (costData?.topProducts ?? []).map((pub: any, i: number) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            <img src={pub.img ?? '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">{pub.sku ?? pub.id ?? ''} <Info size={10} /></div>
                            <div className="text-sm font-medium text-gray-800 max-w-[200px] truncate">{pub.title ?? pub.name ?? ''}</div>
                            <div className="text-xs text-gray-500">{pub.price != null ? ars(pub.price) : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center text-sm text-gray-800">{pub.sales != null ? ars(pub.sales) : '—'}<div className="text-xs text-gray-400">{pub.qty != null ? `${pub.qty} u.` : ''}</div></td>
                      <td className="p-3 text-center text-sm text-gray-800">{pub.costs != null ? `- ${ars(pub.costs)}` : '—'}</td>
                      <td className="p-3 text-center text-sm text-gray-800">{pub.tax != null ? (pub.tax === 0 ? '$ 0' : `- ${ars(pub.tax)}`) : '—'}</td>
                      <td className="p-3 text-center text-sm text-gray-800 font-medium">{pub.received != null ? ars(pub.received) : '—'}</td>
                      <td className="p-3 text-center text-sm text-gray-800">{pub.rentability != null ? `${pub.rentability}%` : '—'}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button className="text-blue-600 text-xs font-medium hover:underline">Ir a detalle</button>
                          <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* === ATENCIÓN A TUS COMPRADORES === */}
      {activeTab === 'atencion' && (
        <>
          {tabLoading === 'atencion' && (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">Cargando datos de atención…</div>
          )}

          {/* Sub-tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveAtencionSubTab('reclamos')}
              className={`pb-2 text-sm transition-colors ${activeAtencionSubTab === 'reclamos' ? 'font-semibold text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Reclamos, cancelaciones y devoluciones
            </button>
            <button
              onClick={() => setActiveAtencionSubTab('envios')}
              className={`pb-2 text-sm transition-colors ${activeAtencionSubTab === 'envios' ? 'font-semibold text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Detalle de envíos incorrectos
            </button>
          </div>

          {/* === RECLAMOS, CANCELACIONES Y DEVOLUCIONES === */}
          {activeAtencionSubTab === 'reclamos' && (
            <>
              {/* Filters */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                      Últimos 60 días
                      <ChevronDown size={16} />
                    </button>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg">
                    <Filter size={16} />
                    Filtrar
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow"></div>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Afecta mi reputación</span>
                  </div>
                  <span className="text-xs text-gray-500">386 ventas</span>
                </div>
              </div>

              {/* Problemas en tus ventas */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Problemas en tus ventas</h3>
                <div className="flex items-start gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                      Principales tipos de problemas <Info size={12} className="text-gray-400" />
                    </div>
                    <div className="space-y-3">
                      {(atencionData?.claimsByType ?? []).length > 0 ? (
                        (() => {
                          const maxVal = Math.max(1, ...(atencionData?.claimsByType ?? []).map((x: any) => x.count ?? x.value ?? 0))
                          const colors = ['bg-indigo-500','bg-pink-400','bg-gray-300','bg-gray-300','bg-gray-300']
                          return (atencionData?.claimsByType ?? []).map((item: any, i: number) => {
                            const val = item.count ?? item.value ?? 0
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <div className="w-48 text-xs text-gray-600 text-right truncate">{item.label ?? item.type ?? item.name ?? ''}</div>
                                <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                                  <div className={`h-full ${colors[i % colors.length]} rounded`} style={{ width: `${(val / maxVal) * 100}%`, minWidth: val > 0 ? '8px' : '0' }}></div>
                                </div>
                                <div className="w-6 text-xs font-semibold text-gray-700 text-right">{val}</div>
                              </div>
                            )
                          })
                        })()
                      ) : (
                        <p className="text-sm text-gray-400 py-2">Sin datos para el período</p>
                      )}
                    </div>
                  </div>
                  <div className="w-px h-40 bg-gray-100 mx-4"></div>
                  <div className="flex flex-col gap-4">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-800">{atencionData?.summary?.totalClaims ?? 0}</div>
                      <div className="text-xs text-gray-500">problemas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-800">{atencionData?.summary?.openClaims ?? 0}</div>
                      <div className="text-xs text-gray-500">abiertos</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <button className="text-blue-600 text-sm font-medium hover:underline">Revisar todos</button>
                  <ChevronRight size={18} className="text-blue-600" />
                </div>
              </div>

              {/* Métricas de reclamos, cancelaciones y devoluciones */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Métricas de reclamos, cancelaciones y devoluciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Reclamos */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-2">
                      Reclamos <Info size={12} className="text-gray-400" />
                    </div>
                    <div className="text-2xl font-black text-gray-800">{atencionData?.summary?.claimRate != null ? `${atencionData.summary.claimRate}%` : '0%'}</div>
                    <div className="text-xs text-gray-400 mt-1">{atencionData?.summary?.totalClaims ?? 0} ventas</div>
                  </div>

                  {/* Cancelaciones */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-2">
                      Cancelaciones <Info size={12} className="text-gray-400" />
                    </div>
                    <div className="text-2xl font-black text-gray-800">{atencionData?.summary?.cancellationRate != null ? `${atencionData.summary.cancellationRate}%` : '0%'}</div>
                    <div className="text-xs text-gray-400 mt-1">{atencionData?.summary?.canceledOrders ?? 0} ventas</div>
                  </div>

                  {/* Demoras */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-2">
                      Envíos demorados <Info size={12} className="text-gray-400" />
                    </div>
                    <div className="text-2xl font-black text-gray-800">{atencionData?.summary?.delayRate != null ? `${atencionData.summary.delayRate}%` : '0%'}</div>
                    <div className="text-xs text-gray-400 mt-1">{atencionData?.summary?.delayedCount ?? 0} envíos</div>
                  </div>

                  {/* Devoluciones + Cambios */}
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-2">
                        Devoluciones <Info size={12} className="text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Para el cálculo de reputación esta métrica está incluida en <strong className="text-blue-600">Reclamos</strong>.
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-2">
                        Órdenes totales <Info size={12} className="text-gray-400" />
                      </div>
                      <div className="text-xl font-black text-gray-800">{n(atencionData?.summary?.totalOrders ?? 0)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer note */}
              <div className="text-xs text-gray-400 space-y-1">
                <p>Métricas comparadas con el período anterior: 5 de marzo a 4 de mayo de 2026.</p>
                <p>Puedes encontrar algunos valores distintos a Reputación debido a una diferencia en el tiempo de actualización de los datos.</p>
              </div>
            </>
          )}

          {/* === DETALLE DE ENVÍOS INCORRECTOS === */}
          {activeAtencionSubTab === 'envios' && (
            <>
              {/* Header */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Detalle de envíos incorrectos</h2>
                <p className="text-xs text-gray-500 mb-4">Última actualización: lunes 4 de mayo a las 22 hs</p>
              </div>

              {/* Filters + Banner */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    <Calendar size={16} />
                    Del 6/mes al 5/mes
                    <ChevronDown size={16} />
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    Por fecha de venta
                    <ChevronDown size={16} />
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    2 formas de envío seleccionadas
                    <ChevronDown size={16} />
                  </button>
                </div>
                <div className="bg-blue-500 text-white rounded-lg p-4 w-72 flex-shrink-0 shadow-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold">Descargá un Excel con el detalle de tus envíos incorrectos</h4>
                    <button className="text-blue-200 hover:text-white"><X size={16} /></button>
                  </div>
                  <p className="text-xs text-blue-100 mb-3">Analizá la información de cada producto afectado sin tener que conectarte.</p>
                  <button className="px-4 py-1.5 bg-white text-blue-600 text-xs font-semibold rounded-md hover:bg-blue-50">Entendido</button>
                </div>
              </div>

              {/* Sub-tabs: Por venta | Por producto */}
              <div className="flex gap-4 border-b border-gray-200">
                <button className="pb-2 text-sm font-semibold text-blue-600 border-b-2 border-blue-600">Por venta</button>
                <button className="pb-2 text-sm text-gray-500 hover:text-gray-700">Por producto</button>
              </div>

              {/* Descargar */}
              <div className="flex justify-end">
                <button className="flex items-center gap-2 px-4 py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg border border-blue-200">
                  <Download size={16} />
                  Descargar reporte
                </button>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Venta</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">
                        Producto <ChevronDown size={12} className="inline ml-1" />
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Servicio de envío</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">
                        Fecha y hora máxima para despachar <ChevronDown size={12} className="inline ml-1" />
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">
                        Fecha y hora en la que despachaste <ChevronDown size={12} className="inline ml-1" />
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Reputación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(atencionData?.delayedShipments ?? []).length === 0 && tabLoading !== 'atencion' ? (
                      <tr><td colSpan={6} className="p-8 text-center text-sm text-gray-400">Sin envíos incorrectos para el período</td></tr>
                    ) : (atencionData?.delayedShipments ?? []).map((row: any, i: number) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <div className="text-xs text-blue-600 font-medium">{row.id ?? row.orderId ?? '—'}</div>
                          <div className="text-xs text-gray-400">{row.date ?? ''}</div>
                        </td>
                        <td className="p-3 text-xs text-gray-700 truncate max-w-[180px]">{row.product ?? row.title ?? '—'}</td>
                        <td className="p-3 text-xs text-gray-700">{row.service ?? row.shippingService ?? '—'}</td>
                        <td className="p-3 text-xs text-gray-700">{row.maxDate ?? row.deadline ?? '—'}</td>
                        <td className="p-3 text-xs text-gray-700">{row.shipDate ?? row.shippedAt ?? 'No despachado'}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            <span className="text-xs text-gray-700 font-medium">{row.rep ?? row.reputation ?? 'Afectada'}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* === DESEMPEÑO EN ENVÍOS === */}
      {activeTab === 'envios' && (
        <>
          {tabLoading === 'envios' && (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">Cargando envíos…</div>
          )}

          {/* Sub-tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveEnvioSubTab('turbo')}
              className={`pb-2 text-sm transition-colors ${activeEnvioSubTab === 'turbo' ? 'font-semibold text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Envío Turbo
            </button>
            <button
              onClick={() => setActiveEnvioSubTab('flex')}
              className={`pb-2 text-sm transition-colors ${activeEnvioSubTab === 'flex' ? 'font-semibold text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Envíos Flex
            </button>
          </div>

          {/* Action links */}
          <div className="flex items-center justify-end gap-4">
            <button className="text-blue-600 text-sm font-medium hover:underline">Descargar reporte de envíos</button>
            <button className="text-blue-600 text-sm font-medium hover:underline">Necesito ayuda</button>
          </div>

          {/* Resumen de envíos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                Total envíos <Info size={12} className="text-gray-400" />
              </div>
              <div className="text-xl font-black text-gray-800">{n(enviosData?.summary?.totalShipments ?? 0)}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                A tiempo <Info size={12} className="text-gray-400" />
              </div>
              <div className="text-xl font-black text-green-600">{enviosData?.summary?.onTimePct != null ? `${enviosData.summary.onTimePct}%` : '—'}</div>
              <div className="text-xs text-gray-400 mt-1">{n(enviosData?.summary?.onTime ?? 0)} envíos</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                Demorados <Info size={12} className="text-gray-400" />
              </div>
              <div className="text-xl font-black text-red-500">{n(enviosData?.summary?.delayed ?? 0)}</div>
              <div className="text-xs text-gray-400 mt-1">{enviosData?.summary?.delayRate != null ? `${enviosData.summary.delayRate}%` : '—'} tasa</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                Envíos Flash <Info size={12} className="text-gray-400" />
              </div>
              <div className="text-xl font-black text-gray-800">{n(enviosData?.summary?.flashCount ?? 0)}</div>
            </div>
          </div>

          {/* Exposure cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exposición actual */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 mb-4">
                Exposición actual <Info size={14} className="text-gray-400" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
                <span className="text-lg font-bold text-gray-800">Excelente</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-600">Envíos Flex</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-600">Tenés la exposición</span>
                </div>
              </div>
            </div>

            {/* Exposición previsto */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 mb-4">
                Exposición previsto para la próxima semana <Info size={14} className="text-gray-400" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center">
                  <Minus size={12} className="text-white" />
                </div>
                <span className="text-lg font-bold text-gray-800">Sin calcular</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Envío correcto</div>
                  <div className="text-xs text-gray-800 font-medium">Esta semana</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Envío correcto</div>
                  <div className="text-xs text-gray-400">— %</div>
                </div>
              </div>
              <button className="text-blue-600 text-xs font-medium hover:underline mt-4">Recibir estas notificaciones de tu exposición</button>
            </div>
          </div>

          {/* Detalle por zona */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                Detalle por zona con ventas <Info size={14} className="text-gray-400" />
              </div>
              <button className="text-blue-600 text-xs font-medium hover:underline">Editar</button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase">Zona</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase">Exposición actual</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase">Envíos correctos esta semana</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase">Exposición prevista</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { zone: 'Mar', exposure: 'Llego hoy', correct: 'Sin calcular', forecast: 'Sin calcular' },
                    { zone: 'San Vicente', exposure: 'Llego hoy', correct: 'Sin calcular', forecast: 'Sin calcular' },
                    { zone: 'Cañas', exposure: 'Llego hoy', correct: 'Sin calcular', forecast: 'Sin calcular' },
                    { zone: 'Gascon Balcarce', exposure: 'Llego hoy', correct: 'Sin calcular', forecast: 'Sin calcular' },
                    { zone: 'Holmes', exposure: 'Llego hoy', correct: 'Sin calcular', forecast: 'Sin calcular' },
                    { zone: 'Fortín Mercedes', exposure: 'Llego hoy', correct: 'Sin calcular', forecast: 'Sin calcular' },
                    { zone: 'Alegre', exposure: 'Llego hoy', correct: 'Sin calcular', forecast: 'Sin calcular' },
                    { zone: 'Real', exposure: 'Llego hoy', correct: 'Sin calcular', forecast: 'Sin calcular' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-xs text-gray-700">{row.zone}</td>
                      <td className="p-3 text-xs text-gray-700">{row.exposure}</td>
                      <td className="p-3 text-xs text-gray-500">{row.correct}</td>
                      <td className="p-3 text-xs text-gray-500">{row.forecast}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button className="text-blue-600 text-xs font-medium hover:underline">Revisar la configuración de mis zonas</button>
              <ChevronRight size={16} className="text-blue-600" />
            </div>
          </div>

          {/* Historial chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 mb-6">
              Historial de tus envíos en las últimas semanas <Info size={14} className="text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={enviosData?.weeklyData ?? []} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip formatter={(value: any, name: any) => [`${value}%`, name]} />
                <Bar dataKey="correct" stackId="a" fill="#10B981" name="Envío correcto" radius={[0,0,0,0]} />
                <Bar dataKey="anticipados" stackId="a" fill="#FBBF24" name="Anticipados" radius={[0,0,0,0]} />
                <Bar dataKey="incSafe" stackId="a" fill="#9CA3AF" name="Incompletos sin afectar reputación" radius={[0,0,0,0]} />
                <Bar dataKey="incBad" stackId="a" fill="#EF4444" name="Incompletos que afectan reputación" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-1.5 rounded-full bg-green-500"></span>
                <span className="text-xs text-gray-600">Envío correcto (0%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1.5 rounded-full bg-yellow-400"></span>
                <span className="text-xs text-gray-600">Anticipados (0,0%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1.5 rounded-full bg-gray-400"></span>
                <span className="text-xs text-gray-600">Incompletos que no afectan tu reputación (0,0%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1.5 rounded-full bg-red-500"></span>
                <span className="text-xs text-gray-600">Incompletos que afectan tu reputación (0,0%)</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-400">
            Última actualización: lunes 4 de mayo a las 22 hs
          </div>
        </>
      )}

      {/* === STOCK FULL === */}
      {activeTab === 'stock' && (
        <>
          {tabLoading === 'stock' && (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">Cargando stock…</div>
          )}

          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                Total publicaciones <Info size={12} className="text-gray-400" />
              </div>
              <div className="text-xl font-black text-gray-800">{n(stockData?.summary?.total ?? 0)}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                Sin stock <Info size={12} className="text-gray-400" />
              </div>
              <div className="text-xl font-black text-red-500">{n(stockData?.summary?.outOfStock ?? 0)}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                Stock crítico <Info size={12} className="text-gray-400" />
              </div>
              <div className="text-xl font-black text-orange-500">{n(stockData?.summary?.critical ?? 0)}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                Stock bajo <Info size={12} className="text-gray-400" />
              </div>
              <div className="text-xl font-black text-yellow-600">{n(stockData?.summary?.lowStock ?? 0)}</div>
            </div>
          </div>

          {/* Additional summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 mb-1">Unidades totales</div>
              <div className="text-xl font-black text-gray-800">{n(stockData?.summary?.totalUnits ?? 0)}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 mb-1">Valor en stock</div>
              <div className="text-xl font-black text-gray-800">{ars(stockData?.summary?.totalStockValue ?? 0)}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 mb-1">Publicaciones activas</div>
              <div className="text-xl font-black text-green-600">{n(stockData?.summary?.active ?? 0)}</div>
            </div>
          </div>

          {/* Alerts table */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Alertas de stock</h3>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                    <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                    <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Alerta</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                  </tr>
                </thead>
                <tbody>
                  {(stockData?.alerts ?? []).length === 0 && tabLoading !== 'stock' ? (
                    <tr><td colSpan={4} className="p-8 text-center text-sm text-gray-400">Sin alertas de stock</td></tr>
                  ) : (stockData?.alerts ?? []).map((alert: any, i: number) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="text-sm font-medium text-gray-800 truncate max-w-[280px]">{alert.title ?? alert.name ?? '—'}</div>
                        <div className="text-xs text-gray-400">{alert.sku ?? alert.id ?? ''}</div>
                      </td>
                      <td className="p-3 text-center text-sm text-gray-800">{alert.stock ?? alert.quantity ?? 0}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          (alert.alertType ?? alert.level ?? '') === 'out_of_stock' ? 'bg-red-100 text-red-700' :
                          (alert.alertType ?? alert.level ?? '') === 'critical' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {alert.alertLabel ?? alert.alertType ?? alert.level ?? 'Bajo'}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-600">{alert.category ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* By category */}
          {(stockData?.byCategory ?? []).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Distribución por categoría</h3>
              <div className="space-y-3">
                {(stockData?.byCategory ?? []).map((cat: any, i: number) => {
                  const total = (stockData?.byCategory ?? []).reduce((s: number, x: any) => s + (x.count ?? x.total ?? 0), 0)
                  const val = cat.count ?? cat.total ?? 0
                  const pct = total > 0 ? Math.round((val / total) * 100) : 0
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-40 text-xs text-gray-600 text-right truncate">{cat.category ?? cat.name ?? ''}</div>
                      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                        <div className="h-full bg-blue-500 rounded" style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="w-16 text-xs font-semibold text-gray-700 text-right">{val} ({pct}%)</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* === ANÁLISIS DE MERCADO === */}
      {activeTab === 'mercado' && (
        <>
          {tabLoading === 'mercado' && (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">Cargando análisis de mercado…</div>
          )}

          {/* Sub-tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveMercadoTab('competencia')}
              className={`pb-2 text-sm transition-colors ${activeMercadoTab === 'competencia' ? 'font-semibold text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Competencia
            </button>
            <button
              onClick={() => setActiveMercadoTab('tendencias')}
              className={`pb-2 text-sm transition-colors ${activeMercadoTab === 'tendencias' ? 'font-semibold text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tendencias por categoría
            </button>
          </div>

          {/* === COMPETENCIA === */}
          {activeMercadoTab === 'competencia' && (
            <>
              {/* Header */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Ranking de competidores de tus categorías</h2>
                <p className="text-xs text-gray-500 mb-4">Las categorías y los competidores están ordenados de mayor a menor según el monto de ventas brutas.</p>
              </div>

          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Período</span>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Mes en curso
                <ChevronDown size={16} />
              </button>
            </div>
            <button className="text-blue-600 text-sm font-medium hover:underline">Necesito ayuda</button>
          </div>

          {/* Seller metrics + category cards */}
          {mercadoData?.seller && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-700 flex items-center justify-center text-white text-sm font-bold">
                  {(mercadoData.seller.name ?? 'M').charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{mercadoData.seller.name ?? '—'}</div>
                  <div className="text-xs text-gray-500">{mercadoData.seller.reputationLevel ?? ''}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Ventas totales</div>
                  <div className="text-lg font-bold text-gray-800">{ars(mercadoData.seller.totalRevenue ?? 0)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Cantidad de ventas</div>
                  <div className="text-lg font-bold text-gray-800">{n(mercadoData.seller.totalSales ?? 0)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Visitas mensuales</div>
                  <div className="text-lg font-bold text-gray-800">{n(mercadoData.seller.monthlyViews ?? 0)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Conversión</div>
                  <div className="text-lg font-bold text-gray-800">{mercadoData.seller.conversionRate ?? '—'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Category cards */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{(mercadoData?.byCategory ?? []).length} categorías</span>
              <button className="flex items-center gap-2 text-blue-600 text-xs font-medium hover:underline">
                <Download size={14} />
                Descargar reporte
              </button>
            </div>
            <div className="flex gap-3 flex-wrap">
              {(mercadoData?.byCategory ?? []).length > 0 ? (
                (mercadoData?.byCategory ?? []).map((cat: any, i: number) => (
                  <div key={i} className={`flex-1 min-w-[180px] rounded-lg p-4 border border-gray-100 cursor-pointer hover:border-blue-300 transition-colors ${i === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <div className="text-sm font-semibold text-gray-800 mb-1">{cat.category ?? cat.name ?? '—'}</div>
                    <div className="text-xs text-gray-500">Ventas brutas totales</div>
                    <div className="text-sm font-bold text-gray-800">{ars(cat.totalRevenue ?? cat.sales ?? 0)}</div>
                    <div className="text-xs text-gray-500 mt-1">Cantidad de ventas: <span className="font-medium text-gray-700">{n(cat.totalSales ?? cat.qty ?? 0)}</span></div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 py-2">Sin datos de categorías</p>
              )}
            </div>
          </div>

          {/* Subcategory filter */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Filtrar subcategorías</span>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50">
              Tu subcategoría
              <ChevronDown size={14} />
            </button>
          </div>

          {/* Position tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveMercadoSubTab('posicion')}
              className={`pb-2 text-sm transition-colors ${activeMercadoSubTab === 'posicion' ? 'font-semibold text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tu posición
            </button>
            <button
              onClick={() => setActiveMercadoSubTab('mejores')}
              className={`pb-2 text-sm transition-colors ${activeMercadoSubTab === 'mejores' ? 'font-semibold text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Mejores vendedores
            </button>
          </div>

          <div className="flex justify-end">
            <button className="text-blue-600 text-xs font-medium hover:underline">Ir a tendencias de búsqueda</button>
          </div>

          {/* TU POSICIÓN Table */}
          {activeMercadoSubTab === 'posicion' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase w-16">Posición</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase">
                      Vendedor <Info size={12} className="inline ml-1 text-gray-400" />
                    </th>
                    <th className="text-right p-3 text-[10px] font-semibold text-gray-500 uppercase">Ventas brutas</th>
                    <th className="text-right p-3 text-[10px] font-semibold text-gray-500 uppercase">Cantidad de ventas</th>
                    <th className="text-right p-3 text-[10px] font-semibold text-gray-500 uppercase">Visitas</th>
                    <th className="text-right p-3 text-[10px] font-semibold text-gray-500 uppercase">Conversión</th>
                    <th className="text-right p-3 text-[10px] font-semibold text-gray-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { pos: 491, change: 86, changeUp: true, name: 'BRONCE.HURON.MITICO', level: 'MercadoLider Platinum', official: false, sales: '$ 6.200.000', salesChange: 22.9, salesUp: true, qty: 70, qtyChange: 9.4, qtyUp: true, visits: 2100, visitsChange: 10.5, visitsUp: false, conv: '3.3%' },
                    { pos: 492, change: 108, changeUp: true, name: 'LILA.ASCIDIAS.ARENOSO', level: 'MercadoLider Platinum', official: true, sales: '$ 6.200.000', salesChange: 21.0, salesUp: true, qty: 120, qtyChange: 11.6, qtyUp: true, visits: 5900, visitsChange: 16.2, visitsUp: true, conv: '2.1%' },
                    { pos: 493, change: 9, changeUp: true, name: 'PORRACO.SALAMANDRA.NOCTUR...', level: 'MercadoLider Platinum', official: true, sales: '$ 6.200.000', salesChange: 2.2, salesUp: true, qty: 170, qtyChange: 20.6, qtyUp: true, visits: 7800, visitsChange: 32.7, visitsUp: true, conv: '2.2%' },
                    { pos: 494, change: 243, changeUp: true, name: 'AMARILLO.CIVETA.PRECISO', level: 'MercadoLider Platinum', official: true, sales: '$ 6.100.000', salesChange: 47.8, salesUp: true, qty: 330, qtyChange: 88.2, qtyUp: true, visits: 5400, visitsChange: 17.6, visitsUp: true, conv: '6.2%' },
                    { pos: 495, change: 64, changeUp: true, name: 'CARMESI.PAVO.MEDIAS', level: 'MercadoLider Platinum', official: true, sales: '$ 6.100.000', salesChange: 12.4, salesUp: true, qty: 240, qtyChange: 20.4, qtyUp: true, visits: 4300, visitsChange: 26.6, visitsUp: true, conv: '5.6%' },
                    { pos: 496, change: 79, changeUp: true, name: 'GRANATE.CABALLO.DORADO', level: 'MercadoLider Platinum', official: true, sales: '$ 6.100.000', salesChange: 15.7, salesUp: true, qty: 40, qtyChange: 21.7, qtyUp: true, visits: 6100, visitsChange: 26.0, visitsUp: true, conv: '0.6%' },
                    { pos: 497, change: 38, changeUp: true, name: 'ARENA.ZARIGUEYA.CASUAL', level: 'MercadoLider Platinum', official: false, sales: '$ 6.100.000', salesChange: 8.2, salesUp: true, qty: 110, qtyChange: 14.3, qtyUp: true, visits: 1400, visitsChange: 48.8, visitsUp: true, conv: '7.5%' },
                    { pos: 498, change: 400, changeUp: false, name: 'RUFO.TIBURON.INNATO', level: 'MercadoLider Platinum', official: true, sales: '$ 6.100.000', salesChange: 71.8, salesUp: true, qty: 20, qtyChange: 66.2, qtyUp: true, visits: 1300, visitsChange: 40.6, visitsUp: true, conv: '1.6%' },
                    { pos: 499, change: 56, changeUp: false, name: 'MORADO.JIRAFA.BIOLOGICO', level: 'MercadoLider Platinum', official: true, sales: '$ 6.100.000', salesChange: 7.1, salesUp: true, qty: 60, qtyChange: 0.0, qtyUp: false, visits: 6100, visitsChange: 48.9, visitsUp: true, conv: '1.0%' },
                    { pos: 500, change: 500, changeUp: true, isMe: true, name: 'MAQJEEZ_J', level: 'MercadoLider Platinum', official: false, sales: '$ 284.970,54', salesChange: 41.7, salesUp: true, qty: 9, qtyChange: 28.6, qtyUp: true, visits: 443, visitsChange: 18.4, visitsUp: true, conv: '2.0%' },
                  ].map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 hover:bg-gray-50 ${row.isMe ? 'bg-purple-50' : ''}`}>
                      <td className="p-3 text-center">
                        <div className="text-sm font-bold text-gray-800">{row.pos}</div>
                        <div className={`text-[10px] font-semibold flex items-center justify-center gap-0.5 ${row.changeUp ? 'text-green-600' : 'text-red-500'}`}>
                          {row.changeUp ? '▲' : '▼'} {row.change}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-gray-800">{row.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-500">{row.level}</span>
                          {row.official && (
                            <span className="text-[10px] text-green-600 font-medium">Tienda oficial</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-xs text-gray-800 font-medium">+ {row.sales}</div>
                        <div className={`text-[10px] font-semibold ${row.salesUp ? 'text-green-600' : 'text-red-500'}`}>
                          {row.salesUp ? '▲' : '▼'} {row.salesChange}%
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-xs text-gray-800 font-medium">+ {row.qty}</div>
                        <div className={`text-[10px] font-semibold ${row.qtyUp ? 'text-green-600' : 'text-red-500'}`}>
                          {row.qtyUp ? '▲' : '▼'} {row.qtyChange}%
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-xs text-gray-800 font-medium">+ {row.visits.toLocaleString()}</div>
                        <div className={`text-[10px] font-semibold ${row.visitsUp ? 'text-green-600' : 'text-red-500'}`}>
                          {row.visitsUp ? '▲' : '▼'} {row.visitsChange}%
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-xs text-gray-800 font-medium">{row.conv}</div>
                      </td>
                      <td className="p-3 text-right">
                        {!row.isMe && (
                          <button className="text-blue-600 text-xs font-medium hover:underline">Compararme</button>
                        )}
                        {row.isMe && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MEJORES VENDEDORES Table */}
          {activeMercadoSubTab === 'mejores' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase w-12">Posición</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-gray-500 uppercase">
                      Vendedor <Info size={12} className="inline ml-1 text-gray-400" />
                    </th>
                    <th className="text-right p-3 text-[10px] font-semibold text-gray-500 uppercase">Ventas brutas</th>
                    <th className="text-right p-3 text-[10px] font-semibold text-gray-500 uppercase">Cantidad de ventas</th>
                    <th className="text-right p-3 text-[10px] font-semibold text-gray-500 uppercase">Visitas</th>
                    <th className="text-right p-3 text-[10px] font-semibold text-gray-500 uppercase">Conversión</th>
                    <th className="text-right p-3 text-[10px] font-semibold text-gray-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { pos: 1, change: 0, changeUp: true, name: 'INDIGO.KAKAPO.AUTENTICO', level: 'MercadoLider Platinum', official: true, sales: '$ 287.000.000', salesChange: 24.1, salesUp: true, qty: 2700, qtyChange: 40.4, qtyUp: true, visits: 106000, visitsChange: 26.6, visitsUp: true, conv: '2.5%' },
                    { pos: 2, change: 5, changeUp: false, name: 'MOSTAZA.RUNNER.AFERRABLE', level: 'MercadoLider Platinum', official: true, sales: '$ 167.000.000', salesChange: 24.9, salesUp: true, qty: 1900, qtyChange: 8.1, qtyUp: true, visits: 23500, visitsChange: 55.6, visitsUp: true, conv: '0.8%' },
                    { pos: 3, change: 2, changeUp: true, name: 'ACERO.PERCEBE.FRONTIERIZOS', level: 'MercadoLider Platinum', official: true, sales: '$ 147.000.000', salesChange: 4.9, salesUp: true, qty: 2100, qtyChange: 12.1, qtyUp: true, visits: 42800, visitsChange: 29.0, visitsUp: true, conv: '5.1%' },
                    { pos: 4, change: 6, changeUp: true, name: 'AZUL.ARCON.ORNITORRINCO.ESTABLE', level: 'MercadoLider Platinum', official: true, sales: '$ 141.100.000', salesChange: 17.0, salesUp: true, qty: 1100, qtyChange: 14.0, qtyUp: true, visits: 108000, visitsChange: 23.1, visitsUp: true, conv: '4.0%' },
                    { pos: 5, change: 11, changeUp: true, name: 'VIOLETA.ANDINO.PRACTICAS', level: 'MercadoLider Platinum', official: true, sales: '$ 128.700.000', salesChange: 69.6, salesUp: true, qty: 1900, qtyChange: 16.2, qtyUp: true, visits: 13400, visitsChange: 25.2, visitsUp: true, conv: '1.3%' },
                    { pos: 6, change: 0, changeUp: true, name: 'TRIGO.URRACA.ROTA', level: 'MercadoLider Platinum', official: true, sales: '$ 118.700.000', salesChange: 5.4, salesUp: true, qty: 1800, qtyChange: 2.8, qtyUp: true, visits: 53300, visitsChange: 44.0, visitsUp: true, conv: '5.8%' },
                    { pos: 7, change: 18, changeUp: true, name: 'ROSA.SALTAMONTES.REVOLUCION', level: 'MercadoLider Platinum', official: true, sales: '$ 118.300.000', salesChange: 83.4, salesUp: true, qty: 400, qtyChange: 104.5, qtyUp: true, visits: 65800, visitsChange: 8.2, visitsUp: false, conv: '0.6%' },
                    { pos: 8, change: 8, changeUp: true, name: 'CASTAÑO.SERPIENTE.PARTICULARES', level: 'MercadoLider Platinum', official: true, sales: '$ 107.400.000', salesChange: 2.0, salesUp: true, qty: 1600, qtyChange: 1.1, qtyUp: true, visits: 20200, visitsChange: 33.2, visitsUp: true, conv: '5.8%' },
                    { pos: 9, change: 9, changeUp: true, name: 'AZABACHE.URRACA.AMIGO', level: 'MercadoLider Platinum', official: true, sales: '$ 105.200.000', salesChange: 22.6, salesUp: true, qty: 650, qtyChange: 7.4, qtyUp: true, visits: 22300, visitsChange: 55.6, visitsUp: true, conv: '2.5%' },
                    { pos: 10, change: 2, changeUp: false, name: 'GRIS.GALLINA.CONCRETO', level: 'MercadoLider Platinum', official: true, sales: '$ 103.900.000', salesChange: 5.2, salesUp: true, qty: 1100, qtyChange: 3.0, qtyUp: true, visits: 33500, visitsChange: 52.2, visitsUp: true, conv: '3.5%' },
                    { pos: 41, change: 4, changeUp: true, name: 'XANADU.BUFALO.CRUEL', level: 'MercadoLider Platinum', official: true, sales: '$ 51.000.000', salesChange: 21.0, salesUp: true, qty: 530, qtyChange: 23.3, qtyUp: true, visits: 33800, visitsChange: 23.9, visitsUp: true, conv: '2.5%' },
                    { pos: 42, change: 9, changeUp: false, name: 'ALUMINIO.PEREZOSO.PROPICIO', level: 'MercadoLider Platinum', official: true, sales: '$ 44.400.000', salesChange: 12.3, salesUp: true, qty: 1600, qtyChange: 9.0, qtyUp: true, visits: 27450, visitsChange: 54.9, visitsUp: true, conv: '5.9%' },
                    { pos: 43, change: 13, changeUp: false, name: 'JADE.ORANGUTAN.AUSTRALES', level: 'MercadoLider Platinum', official: true, sales: '$ 43.600.000', salesChange: 5.4, salesUp: true, qty: 270, qtyChange: 26.9, qtyUp: true, visits: 9200, visitsChange: 9.2, visitsUp: false, conv: '3.0%' },
                    { pos: 44, change: 0, changeUp: true, name: 'UVA.FOCA.ADMIRABLE', level: 'MercadoLider Platinum', official: true, sales: '$ 43.200.000', salesChange: 0.9, salesUp: true, qty: 1500, qtyChange: 22.3, qtyUp: true, visits: 21500, visitsChange: 28.2, visitsUp: true, conv: '7.4%' },
                    { pos: 45, change: 27, changeUp: false, name: 'SEPIA.COYOTE.CAMPO', level: 'MercadoLider Platinum', official: true, sales: '$ 42.300.000', salesChange: 57.2, salesUp: true, qty: 280, qtyChange: 94.9, qtyUp: true, visits: 14400, visitsChange: 65.1, visitsUp: true, conv: '2.1%' },
                    { pos: 46, change: 90, changeUp: true, name: 'CALIPSO.CAMARON.SIMBOLO', level: 'MercadoLider Platinum', official: true, sales: '$ 41.700.000', salesChange: 133.5, salesUp: true, qty: 3400, qtyChange: 118.6, qtyUp: true, visits: 11600, visitsChange: 10.5, visitsUp: false, conv: '28.6%' },
                    { pos: 47, change: 26, changeUp: false, name: 'FucsIA.LOBATO.PROVINCIAL', level: 'MercadoLider Platinum', official: true, sales: '$ 41.600.000', salesChange: 39.9, salesUp: true, qty: 680, qtyChange: 50.9, qtyUp: true, visits: 40600, visitsChange: 16.2, visitsUp: true, conv: '1.7%' },
                    { pos: 48, change: 34, changeUp: true, name: 'SEPIA.TIBURON.PIRENAICO', level: 'MercadoLider Platinum', official: true, sales: '$ 41.600.000', salesChange: 66.3, salesUp: true, qty: 160, qtyChange: 109.6, qtyUp: true, visits: 11700, visitsChange: 7.1, visitsUp: false, conv: '0.7%' },
                    { pos: 49, change: 5, changeUp: true, name: 'HIELO.SEPIA.SIMILAR', level: 'MercadoLider Platinum', official: true, sales: '$ 40.800.000', salesChange: 4.2, salesUp: true, qty: 470, qtyChange: 25.0, qtyUp: true, visits: 23400, visitsChange: 18.6, visitsUp: true, conv: '2.0%' },
                    { pos: 50, change: 9, changeUp: false, name: 'CALABAZA.ASOCIAS.REVELADORA', level: 'MercadoLider Platinum', official: true, sales: '$ 39.100.000', salesChange: 23.4, salesUp: true, qty: 150, qtyChange: 7.0, qtyUp: true, visits: 14000, visitsChange: 40.0, visitsUp: true, conv: '1.1%' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-center">
                        <div className="text-sm font-bold text-gray-800">{row.pos}</div>
                        <div className={`text-[10px] font-semibold flex items-center justify-center gap-0.5 ${row.changeUp ? 'text-green-600' : 'text-red-500'}`}>
                          {row.changeUp ? '▲' : '▼'} {row.change}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-gray-800">{row.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-500">{row.level}</span>
                          {row.official && (
                            <span className="text-[10px] text-green-600 font-medium">Tienda oficial</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-xs text-gray-800 font-medium">+ {row.sales}</div>
                        <div className={`text-[10px] font-semibold ${row.salesUp ? 'text-green-600' : 'text-red-500'}`}>
                          {row.salesUp ? '▲' : '▼'} {row.salesChange}%
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-xs text-gray-800 font-medium">+ {row.qty}</div>
                        <div className={`text-[10px] font-semibold ${row.qtyUp ? 'text-green-600' : 'text-red-500'}`}>
                          {row.qtyUp ? '▲' : '▼'} {row.qtyChange}%
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-xs text-gray-800 font-medium">+ {row.visits.toLocaleString()}</div>
                        <div className={`text-[10px] font-semibold ${row.visitsUp ? 'text-green-600' : 'text-red-500'}`}>
                          {row.visitsUp ? '▲' : '▼'} {row.visitsChange}%
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-xs text-gray-800 font-medium">{row.conv}</div>
                      </td>
                      <td className="p-3 text-right">
                        <button className="text-blue-600 text-xs font-medium hover:underline">Compararme</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </>
          )}

          {/* === TENDENCIAS POR CATEGORÍA === */}
          {activeMercadoTab === 'tendencias' && (
            <>
              {/* Header */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Conocé las tendencias de venta y llegá a más compradores</h2>
              </div>

              {/* Period filter */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">Período</span>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  Mes en curso
                  <ChevronDown size={16} />
                </button>
              </div>

              <p className="text-xs text-gray-500">Seguí el avance de las categorías donde tenés presencia y ajustá tu estrategia.</p>

              {/* Desempeño de tus categorías */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Desempeño de tus categorías</h3>
                {(mercadoData?.byCategory ?? []).length > 0 ? (
                  <div className="flex gap-4 flex-wrap">
                    {(mercadoData?.byCategory ?? []).map((cat: any, i: number) => (
                      <div key={i} className="flex-1 min-w-[200px] bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            {cat.totalSales ?? cat.qty ?? 0}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{cat.category ?? cat.name ?? '—'}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-600">
                          <div>Ventas brutas: <span className="font-medium text-gray-800">{ars(cat.totalRevenue ?? cat.sales ?? 0)}</span></div>
                          <div>Cantidad: <span className="font-medium text-gray-800">{n(cat.totalSales ?? cat.qty ?? 0)}</span></div>
                          {cat.views != null && <div>Visitas: <span className="font-medium text-gray-800">{n(cat.views)}</span></div>}
                          {cat.avgPrice != null && <div>Precio prom.: <span className="font-medium text-gray-800">{ars(cat.avgPrice)}</span></div>}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">Ir a detalle</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-4">Sin datos de categorías para el período</p>
                )}
              </div>

              {/* Otras categorías */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Otras categorías</h3>
                <p className="text-xs text-gray-500 mb-3">Consultá nuevos segmentos para expandir tu oferta.</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { name: 'Juegos y Juguetes', trend: '+9.4%', up: true },
                    { name: 'Ropa y Accesorios', trend: '+5.0%', up: true },
                    { name: 'Muebles', trend: '+5.1%', up: true },
                    { name: 'Electrónica, Audio y Video', trend: '+2.1%', up: true },
                    { name: 'Música, Películas y Series', trend: '+5.9%', up: true },
                    { name: 'Belleza y Cuidado Personal', trend: '+8.5%', up: true },
                    { name: 'Cámaras y Accesorios', trend: '+9.8%', up: true },
                    { name: 'Celulares y Teléfonos', trend: '+6.3%', up: true },
                    { name: 'Motos', trend: '+9.8%', up: true },
                    { name: 'Puericultura, Juegos y Bebés', trend: '+6.9%', up: true },
                    { name: 'Otras categorías', trend: '+5.8%', up: true },
                    { name: 'Joyería y Relojes', trend: '+6.3%', up: true },
                    { name: 'Instrumentos Musicales', trend: '-0.5%', up: false },
                    { name: 'Antigüedades y Colecciones', trend: '-6.4%', up: false },
                    { name: 'Animales y Mascotas', trend: '-5.8%', up: false },
                    { name: 'Hogar, Limpieza y Mascotas', trend: '-5.8%', up: false },
                    { name: 'Souvenirs, Cotillón y Fiestas', trend: '-3.9%', up: false },
                    { name: 'Deportes y Fitness', trend: '-5.7%', up: false },
                    { name: 'Construcción', trend: '-4.8%', up: false },
                    { name: 'Automóviles y Camionetas', trend: '-4.8%', up: false },
                    { name: 'Industria y Oficina', trend: '-0.5%', up: false },
                    { name: 'Computación', trend: '-4.8%', up: false },
                    { name: 'Salud y Equipamiento Médico', trend: '-2.0%', up: false },
                    { name: 'Agro', trend: '-5.9%', up: false },
                    { name: 'Consolas y Videojuegos', trend: '-3.0%', up: false },
                    { name: 'Libros, Revistas y Comics', trend: '-4.8%', up: false },
                    { name: 'Servicios', trend: '+9.9%', up: true },
                    { name: 'Entradas para Eventos', trend: '-5.9%', up: false },
                  ].map((cat, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between hover:border-blue-300 transition-colors cursor-pointer">
                      <span className="text-xs text-gray-700 font-medium truncate">{cat.name}</span>
                      <span className={`text-xs font-semibold ${cat.up ? 'text-green-600' : 'text-red-500'}`}>{cat.trend}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* === MI PÁGINA === */}
      {activeTab === 'mipagina' && (
        <>
          {tabLoading === 'mipagina' && (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">Cargando mi página…</div>
          )}

          {/* Profile card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs text-gray-400 mb-3">Recorrido: Últimos 30 días</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-700 flex items-center justify-center text-white text-sm font-bold">
                  {(miPaginaData?.profile?.name ?? 'M').charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{miPaginaData?.profile?.name ?? 'MAQJEEZ'}</div>
                  <div className="text-xs text-gray-500">{miPaginaData?.profile?.reputationLevel ?? ''}</div>
                  <button className="text-blue-600 text-xs font-medium hover:underline mt-0.5">Ir a Mi página</button>
                </div>
              </div>
              <div className="flex items-center gap-12">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Visitas</div>
                  <div className="text-sm font-bold text-gray-800">{n(miPaginaData?.profile?.monthlyViews ?? 0)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Ventas exitosas</div>
                  <div className="text-sm font-bold text-gray-800">{n(miPaginaData?.profile?.successfulSales ?? 0)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Conversión</div>
                  <div className="text-sm font-bold text-gray-800">{miPaginaData?.profile?.conversionRate ?? '—'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Ingresos totales</div>
                  <div className="text-sm font-bold text-gray-800">{ars(miPaginaData?.profile?.totalRevenue ?? 0)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top products by views table */}
          {(miPaginaData?.topByViews ?? []).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Top productos por visitas</h3>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Visitas</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Ventas</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(miPaginaData?.topByViews ?? []).map((prod: any, i: number) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <div className="text-sm font-medium text-gray-800 truncate max-w-[280px]">{prod.title ?? prod.name ?? '—'}</div>
                          <div className="text-xs text-gray-400">{prod.sku ?? prod.id ?? ''}</div>
                        </td>
                        <td className="p-3 text-center text-sm text-gray-800">{n(prod.views ?? prod.visits ?? 0)}</td>
                        <td className="p-3 text-center text-sm text-gray-800">{n(prod.sales ?? 0)}</td>
                        <td className="p-3 text-center text-sm text-gray-800">{prod.revenue != null ? ars(prod.revenue) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveMiPaginaSubTab('trafico')}
              className={`pb-2 text-sm transition-colors ${activeMiPaginaSubTab === 'trafico' ? 'font-semibold text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tráfico
            </button>
            <button
              onClick={() => setActiveMiPaginaSubTab('audiencias')}
              className={`pb-2 text-sm transition-colors ${activeMiPaginaSubTab === 'audiencias' ? 'font-semibold text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Audiencias
            </button>
          </div>

          {/* Filters for Tráfico */}
          {activeMiPaginaSubTab === 'trafico' && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveMiPaginaMetric('visitas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeMiPaginaMetric === 'visitas' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
                >
                  Visitas
                </button>
                <button
                  onClick={() => setActiveMiPaginaMetric('seguidores')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeMiPaginaMetric === 'seguidores' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
                >
                  Seguidores
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Tipo de audiencia</span>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700">
                  Todas <ChevronDown size={12} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Frecuencia de las visitas</span>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700">
                  Todas <ChevronDown size={12} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Período</span>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700">
                  Últimos 30 días <ChevronDown size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Filters for Audiencias */}
          {activeMiPaginaSubTab === 'audiencias' && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveAudienciasMetric('visitantes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeAudienciasMetric === 'visitantes' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
                >
                  Visitantes
                </button>
                <button
                  onClick={() => setActiveAudienciasMetric('seguidores')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeAudienciasMetric === 'seguidores' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
                >
                  Seguidores
                </button>
                <button
                  onClick={() => setActiveAudienciasMetric('compradores')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeAudienciasMetric === 'compradores' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
                >
                  Compradores
                </button>
              </div>
              <div className="ml-auto text-xs text-gray-500">Últimos 30 días</div>
            </div>
          )}

          {/* === TRÁFICO — VISITAS === */}
          {activeMiPaginaSubTab === 'trafico' && activeMiPaginaMetric === 'visitas' && (
            <>
              {(() => {
                const totalViews = miPaginaData?.summary?.totalViews ?? 0;
                const hasViews = totalViews > 0;
                const topProducts = (miPaginaData?.topByViews ?? []).filter((p: { views?: number }) => (p.views ?? 0) > 0);
                return (
                  <>
                    {/* Charts row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Visitas totales — Donut */}
                      <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 mb-4">
                          Visitas en la plataforma <Info size={14} className="text-gray-400" />
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="w-40 h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={hasViews
                                    ? [{ name: 'Vistas', value: totalViews, fill: '#8B5CF6' }]
                                    : [{ name: 'Sin visitas', value: 1, fill: '#E5E7EB' }]
                                  }
                                  cx="50%" cy="50%"
                                  innerRadius={45} outerRadius={70}
                                  paddingAngle={0} dataKey="value" stroke="none"
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="text-2xl font-bold text-gray-800">{n(totalViews)}</div>
                              <div className="text-xs text-gray-400">vistas acumuladas</div>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${hasViews ? 'bg-purple-500' : 'bg-gray-300'}`}></span>
                                <span className="text-xs text-gray-600">Vistas de productos</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-gray-200"></span>
                                <span className="text-xs text-gray-400">Origen por fuente: próximamente</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Top productos por vistas — Bar chart */}
                      <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 mb-4">
                          Productos más vistos <Info size={14} className="text-gray-400" />
                        </div>
                        {topProducts.length > 0 ? (
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart
                              data={topProducts.slice(0, 5).map((p: { title?: string; views?: number }) => ({
                                name: (p.title ?? 'Producto').slice(0, 20),
                                value: p.views ?? 0,
                              }))}
                              layout="vertical" barSize={16} margin={{ left: 8 }}
                            >
                              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} width={90} />
                              <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-40 text-sm text-gray-400">
                            Aún no hay vistas en tus productos
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Evolución — sin historial disponible */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="text-sm font-semibold text-gray-800 mb-2">Evolución de tus visitas</div>
                      <div className="flex items-center justify-center h-28 text-sm text-gray-400">
                        El historial diario de visitas estará disponible próximamente
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {/* === TRÁFICO — SEGUIDORES === */}
          {activeMiPaginaSubTab === 'trafico' && activeMiPaginaMetric === 'seguidores' && (
            <>
              {/* Balance + Origen cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Balance de tus seguidores */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 mb-4">
                    Balance de tus seguidores <Info size={14} className="text-gray-400" />
                  </div>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Nuevos seguidores</div>
                      <div className="text-lg font-bold text-gray-800">19 <span className="text-xs text-red-500">▼ 55%</span></div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Dejaron de seguirte</div>
                      <div className="text-lg font-bold text-gray-800">0 <span className="text-xs text-gray-400">—%</span></div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Balance</div>
                      <div className="text-lg font-bold text-gray-800">19 <span className="text-xs text-red-500">▼ 54%</span></div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={[
                      { day: '5 abr', val: 0 },
                      { day: '12 abr', val: 2 },
                      { day: '19 abr', val: 1 },
                      { day: '26 abr', val: 0 },
                      { day: '3 may', val: 4 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                      <Line type="monotone" dataKey="val" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Origen de tus nuevos seguidores */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 mb-4">
                    Origen de tus nuevos seguidores <Info size={14} className="text-gray-400" />
                  </div>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Nuevos seguidores</div>
                      <div className="text-lg font-bold text-gray-800">19 <span className="text-xs text-red-500">▼ 55%</span></div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Te siguieron por cupón</div>
                      <div className="text-lg font-bold text-gray-800">0</div>
                      <div className="text-xs text-gray-400">Multiplicá tus seguidores. <span className="text-blue-600 cursor-pointer hover:underline">Crear cupón</span></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-20">Orgánicas</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                        <div className="h-full bg-blue-300 rounded" style={{ width: '35%' }}></div>
                      </div>
                      <span className="text-xs font-bold text-gray-800 w-6 text-right">5</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-20">Publicidad</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                        <div className="h-full bg-blue-400 rounded" style={{ width: '100%' }}></div>
                      </div>
                      <span className="text-xs font-bold text-gray-800 w-6 text-right">14</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-[10px] text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-blue-300"></span> Sin cupón
                  </div>
                </div>
              </div>

              {/* Evolución de tus nuevos seguidores */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-sm font-semibold text-gray-800 mb-4">Evolución de tus nuevos seguidores</div>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={[
                    { day: '5 abr', publicidad: 0, organicas: 0 },
                    { day: '12 abr', publicidad: 0, organicas: 1 },
                    { day: '19 abr', publicidad: 1, organicas: 0 },
                    { day: '26 abr', publicidad: 2, organicas: 0 },
                    { day: '3 may', publicidad: 4, organicas: 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                    <Line type="monotone" dataKey="publicidad" stroke="#06B6D4" strokeWidth={2} dot={false} name="Publicidad" />
                    <Line type="monotone" dataKey="organicas" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Orgánicas" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-6 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                    <span className="text-xs text-gray-500">Publicidad</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span className="text-xs text-gray-500">Orgánicas</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* === AUDIENCIAS — SEGUIDORES === */}
          {activeMiPaginaSubTab === 'audiencias' && activeAudienciasMetric === 'seguidores' && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-xs text-gray-500 mb-1">Seguidores totales</div>
                  <div className="text-2xl font-bold text-gray-800">620</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-xs text-gray-500 mb-1">Seguidores que te visitaron en los últimos 30 días</div>
                  <div className="text-2xl font-bold text-gray-800">13 <span className="text-xs text-gray-400">(2.1%)</span></div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-xs text-gray-500 mb-1">Seguidores que te compraron en los últimos 30 días</div>
                  <div className="text-2xl font-bold text-gray-800">0 <span className="text-xs text-gray-400">(0%)</span></div>
                </div>
              </div>

              {/* Demographics row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dispositivo */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-sm font-semibold text-gray-800 mb-4">Dispositivo</div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden flex">
                        <div className="h-full bg-purple-500 rounded-l" style={{ width: '92%' }}></div>
                        <div className="h-full bg-cyan-400 rounded-r" style={{ width: '8%' }}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500">
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Móvil</div>
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Computadora</div>
                    </div>
                  </div>
                </div>

                {/* Género */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-sm font-semibold text-gray-800 mb-4">Género</div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden flex">
                        <div className="h-full bg-cyan-400 rounded-l" style={{ width: '65%' }}></div>
                        <div className="h-full bg-purple-500 rounded-r" style={{ width: '35%' }}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500">
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Masculino</div>
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Femenino</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Age + Purchase charts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Rango de edad */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-sm font-semibold text-gray-800 mb-4">Rango de edad</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={[
                      { range: '18 a 24', pct: 5 },
                      { range: '25 a 34', pct: 18 },
                      { range: '35 a 44', pct: 34 },
                      { range: '45 a 54', pct: 24 },
                      { range: '55 a 64', pct: 11 },
                      { range: '+65', pct: 7 },
                    ]} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(v) => `${v}%`} />
                      <Bar dataKey="pct" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Poder de compra */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 mb-4">
                    Poder de compra <Info size={14} className="text-gray-400" />
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-24 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Alto', value: 30, fill: '#8B5CF6' },
                              { name: 'Medio', value: 50, fill: '#06B6D4' },
                              { name: 'Bajo', value: 20, fill: '#FBBF24' },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={42}
                            dataKey="value"
                            stroke="none"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-gray-500">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Alto</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Medio</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Bajo</div>
                  </div>
                </div>

                {/* Hábito de compra */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 mb-4">
                    Hábito de compra <Info size={14} className="text-gray-400" />
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-24 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Alto', value: 25, fill: '#8B5CF6' },
                              { name: 'Medio', value: 45, fill: '#06B6D4' },
                              { name: 'Bajo', value: 30, fill: '#FBBF24' },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={42}
                            dataKey="value"
                            stroke="none"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-gray-500">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Alto</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Medio</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Bajo</div>
                  </div>
                </div>
              </div>

              {/* Categorías que más navegan */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold text-gray-800">Categorías que más navegan tus seguidores en Mercado Libre</div>
                  <div className="text-xs text-gray-500">Últimos 30 días</div>
                </div>
                <div className="space-y-3">
                  {[
                    { cat: 'Hogar, Muebles y Jardín', val: 429, pct: 100 },
                    { cat: 'Accesorios para Vehículos', val: 344, pct: 80 },
                    { cat: 'Herramientas', val: 343, pct: 80 },
                    { cat: 'Ropa, Calzados y Accesorios', val: 298, pct: 69 },
                    { cat: 'Deportes y Fitness', val: 273, pct: 64 },
                    { cat: 'Construcción', val: 256, pct: 60 },
                    { cat: 'Electrodomésticos y Aires Ac.', val: 245, pct: 57 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-500 w-40 text-right truncate">{item.cat}</span>
                      <div className="flex-1 h-3 bg-gray-100 rounded overflow-hidden">
                        <div className="h-full bg-purple-500 rounded" style={{ width: `${item.pct}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-gray-800 w-8 text-right">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* === AUDIENCIAS — COMPRADORES (empty state) === */}
          {activeMiPaginaSubTab === 'audiencias' && activeAudienciasMetric === 'compradores' && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-700 font-medium mb-1">Alcanzá 100 compradores en los últimos 30 días para acceder a sus métricas</p>
              <p className="text-xs text-gray-500 mb-3">Compartí el link de tu tienda en redes sociales para conseguirlos.</p>
              <button className="text-blue-600 text-xs font-medium hover:underline">Copiar link</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

