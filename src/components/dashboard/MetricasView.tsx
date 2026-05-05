"use client";

import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, FunnelChart, Funnel, LabelList, Cell
} from 'recharts';
import {
  Info, Download, Filter, ChevronDown, ChevronRight, ChevronLeft,
  Eye, TrendingUp, TrendingDown, Minus, Search, FileText, MoreVertical
} from 'lucide-react';

// --- DATA DEMO ---
const salesData = [
  { day: '27 abr', value: 145000 },
  { day: '28 abr', value: 180000 },
  { day: '29 abr', value: 120000 },
  { day: '30 abr', value: 220000 },
  { day: '1 may', value: 280000 },
  { day: '2 may', value: 195000 },
  { day: '3 may', value: 320000 },
  { day: '4 may', value: 290000 },
];

const funnelData = [
  { name: 'Visitas totales', value: 2974, fill: '#E0E7FF' },
  { name: 'Intención de compra', value: 1955, fill: '#C7D2FE' },
  { name: 'Ventas totales', value: 54, fill: '#6366F1' },
];

const heatmapData = [
  { hour: '00', lun: 0, mar: 0, mie: 1, jue: 0, vie: 2, sab: 3, dom: 1 },
  { hour: '06', lun: 1, mar: 0, mie: 0, jue: 1, vie: 0, sab: 0, dom: 0 },
  { hour: '08', lun: 2, mar: 1, mie: 3, jue: 1, vie: 2, sab: 1, dom: 0 },
  { hour: '10', lun: 3, mar: 4, mie: 2, jue: 3, vie: 5, sab: 4, dom: 2 },
  { hour: '12', lun: 5, mar: 6, mie: 4, jue: 5, vie: 7, sab: 6, dom: 3 },
  { hour: '14', lun: 4, mar: 5, mie: 5, jue: 4, vie: 6, sab: 5, dom: 4 },
  { hour: '16', lun: 6, mar: 7, mie: 6, jue: 7, vie: 8, sab: 7, dom: 5 },
  { hour: '18', lun: 8, mar: 9, mie: 8, jue: 8, vie: 10, sab: 9, dom: 6 },
  { hour: '20', lun: 7, mar: 8, mie: 7, jue: 6, vie: 9, sab: 8, dom: 7 },
  { hour: '22', lun: 4, mar: 3, mie: 4, jue: 3, vie: 5, sab: 4, dom: 3 },
];

const publicationsData = [
  { id: 1, sku: 'E02000200016', title: 'Carretel Automatico Reforestal Disponible', price: 209997, sales: 2, participation: '11.4%', visits: 5, img: '/placeholder.svg', condition: 'Nuevo', badge: null },
  { id: 2, sku: 'E02000200026', title: 'Amoladora Desmalezadora Naftera Motosierra', price: 119997, sales: 3, participation: '9.8%', visits: 7, img: '/placeholder.svg', condition: 'Usado', badge: 'OFERTA' },
  { id: 3, sku: 'E02000200010', title: 'B/D Bolsas De Comienso...', price: 99998, sales: 1, participation: '5.6%', visits: 3, img: '/placeholder.svg', condition: 'Nuevo', badge: null },
  { id: 4, sku: 'E02000200020', title: 'Amoladora Angular Gamma Cadena 150 Hz', price: 1234160, sales: 1, participation: '4.8%', visits: 2, img: '/placeholder.svg', condition: 'Nuevo', badge: 'OFERTA' },
  { id: 5, sku: 'E02000200001', title: 'Cilindro Para Desmalezadora...', price: 79998, sales: 2, participation: '4.4%', visits: 1, img: '/placeholder.svg', condition: 'Nuevo', badge: null },
  { id: 6, sku: 'E02000200017', title: 'Manguera Combustible Completa Con...', price: 79998, sales: 1, participation: '4.4%', visits: 3, img: '/placeholder.svg', condition: 'Nuevo', badge: 'OFERTA' },
  { id: 7, sku: 'E02000200005', title: 'Bobina Captadora Cepeda...', price: 79218, sales: 1, participation: '4.3%', visits: 7, img: '/placeholder.svg', condition: 'Nuevo', badge: null },
  { id: 8, sku: 'E02000200004', title: 'Pasto X12 Para De Sputnik...', price: 675000, sales: 4, participation: '27%', visits: 8, img: '/placeholder.svg', condition: 'Nuevo', badge: 'OFERTA' },
];

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
  const [currentPage, setCurrentPage] = useState(1);

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

  const maxHeatmap = useMemo(() => Math.max(...heatmapData.flatMap(d => [d.lun, d.mar, d.mie, d.jue, d.vie, d.sab, d.dom])), []);

  const totalPages = Math.ceil(publicationsData.length / 7);
  const paginatedData = publicationsData.slice((currentPage - 1) * 7, currentPage * 7);

  return (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-[1200px]">
      {/* Header */}
      <div className="flex justify-between items-start">
        <h1 className="text-[28px] font-semibold text-gray-800">Métricas</h1>
        <div className="flex items-center gap-3">
          <button className="text-blue-600 text-sm font-medium hover:underline">Generar reporte</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-semibold shadow-sm hover:bg-gray-50">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Monitor de ventas en vivo
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub Tabs (solo Negocio) */}
      {activeTab === 'negocio' && (
        <div className="flex gap-4 border-b border-gray-100 pb-0">
          {subTabs.map(sub => (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id)}
              className={`pb-2 text-sm transition-colors ${
                activeSubTab === sub.id ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
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
        <span className="text-sm text-gray-500">Comparar con</span>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          {compareWith}
          <ChevronDown size={16} />
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg">
          <Filter size={16} />
          Filtrar
        </button>
      </div>

      {/* Necesita ayuda link */}
      <div className="text-right">
        <button className="text-blue-600 text-sm font-medium hover:underline">Necesito ayuda</button>
      </div>

      {activeTab === 'negocio' && activeSubTab === 'general' && (
        <>
          {/* Resumen de desempeño */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Resumen de desempeño</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 shadow-sm">
                Descargar reporte
                <ChevronDown size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard title="Ventas brutas" value="$ 1.834.577" change="64.2%" changeType="up" />
              <MetricCard title="Unidades vendidas" value="66" change="85%" changeType="up" />
              <MetricCard title="Precio promedio por unidad" value="$ 27.796,62" change="0.5%" changeType="down" />
              <MetricCard title="Visitas" value="2.974" change="3.3%" changeType="down" />
              <MetricCard title="Cantidad de ventas" value="54" change="63.6%" changeType="up" />
              <MetricCard title="Conversión" value="1.8%" change="57 puntos" changeType="up" />
              <MetricCard title="Precio promedio por venta" value="$ 33.973,65" change="0.3%" changeType="down" />
              <MetricCard title="Cantidad de ventas canceladas" value="0" change="100%" changeType="neutral" />
            </div>
          </div>

          {/* Ver más */}
          <div className="text-center">
            <button className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1 mx-auto">
              Ver más <ChevronDown size={16} />
            </button>
          </div>

          {/* Gráfico de Ventas Brutas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Ventas brutas</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Ventas']} />
                <Area type="monotone" dataKey="value" stroke="#EC4899" strokeWidth={2} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Conversión de visitas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 mb-6">
              Conversión de visitas
              <Info size={14} className="text-gray-400" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-500 mb-1">Conversión total</div>
                <div className="text-2xl font-black text-gray-800">1.8%</div>
                <div className="text-xs text-green-600 font-semibold mt-1">+0.3 puntos</div>
              </div>
              <div className="flex-[2] w-full">
                <div className="space-y-3">
                  {funnelData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-4">
                      <div className="w-32 text-xs text-gray-500 text-right">{item.name}</div>
                      <div className="flex-1">
                        <div
                          className="h-10 rounded-lg flex items-center px-3 text-sm font-bold transition-all"
                          style={{
                            width: `${(item.value / funnelData[0].value) * 100}%`,
                            backgroundColor: item.fill,
                            color: idx === 2 ? 'white' : '#374151',
                            minWidth: '60px'
                          }}
                        >
                          {item.value.toLocaleString()}
                          {idx === 0 && <span className="ml-1 text-[10px] font-normal">({((funnelData[2].value / item.value) * 100).toFixed(1)}%)</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-sm text-gray-500 mb-2">Ventas totales</div>
                <div className="text-xl font-black text-gray-800">54 <span className="text-xs font-normal text-gray-500">($1.834.576)</span></div>
              </div>
            </div>
            <div className="mt-6 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
              <Info size={16} className="text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Convertí en ventas los <strong>744 carritos abandonados</strong> comunicando un cupón de descuento. Incluye a quienes dejaron tus productos en el carrito entre 3 y 14 días previos a hoy.
              </p>
              <button className="text-xs text-blue-600 font-semibold hover:underline flex-shrink-0">Comunicar cupón</button>
            </div>
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
                <span className="text-sm font-semibold text-gray-800">54</span>
                <span className="text-xs text-green-600 font-semibold">63.6%</span>
                <span className="text-xs text-gray-500">Cantidad de ventas totales</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">7</span>
                <span className="text-xs text-gray-500">Promedio de ventas por día</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">Lunes</span>
                <span className="text-xs text-gray-500">Día con más ventas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">De 18:00 a 0:00</span>
                <span className="text-xs text-gray-500">Franja</span>
              </div>
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
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Detalle de competidores</h3>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-2xl font-black text-indigo-600">4</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Frecuentes</div>
                <div className="text-xl font-black text-gray-800">4.8%</div>
                <div className="text-xs text-gray-400">Total 52 • 50.0%</div>
              </div>
              <div className="w-px h-12 bg-gray-200"></div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Frecuentes</div>
                <div className="text-xl font-black text-gray-800">4 <span className="text-xs font-normal text-gray-500">+100%</span></div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Nuevos</div>
                <div className="text-xl font-black text-gray-800">48 <span className="text-xs font-normal text-gray-500">+33.3%</span></div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Tasa de conversión</div>
                <div className="text-xl font-black text-gray-800">8%</div>
              </div>
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
                <span className="text-xs text-gray-500">44 publicaciones</span>
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
                        <div className="text-xs text-gray-400">{pub.sales > 0 ? '+' : ''}{(Math.random() * 20).toFixed(0)}%</div>
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

      {/* === PROMOCIONES === */}
      {activeTab === 'promociones' && (
        <>
          {/* Metrics summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                Ventas brutas <Info size={12} className="text-gray-400" />
              </div>
              <div className="text-xl font-black text-gray-800">$ 82.444 <span className="text-xs font-semibold text-green-600">+ 169 %</span></div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                Unidades vendidas <Info size={12} className="text-gray-400" />
              </div>
              <div className="text-xl font-black text-gray-800">1 <span className="text-xs font-semibold text-red-500">- 50 %</span></div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={[
                { day: '28 abr', actual: 0, prev: 0 },
                { day: '29 abr', actual: 0, prev: 0 },
                { day: '30 abr', actual: 0, prev: 10000 },
                { day: '1 may', actual: 0, prev: 0 },
                { day: '2 may', actual: 0, prev: 0 },
                { day: '3 may', actual: 82444, prev: 0 },
                { day: '4 may', actual: 0, prev: 0 },
              ]}>
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
              <span className="text-xs text-gray-500">8 promociones</span>
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
                {[
                  { name: 'Lo mejor para tu Hogar 2', dates: 'Del 30 de marzo al 28 de junio', visits: 13, sales: '-', conversion: '0%', units: '-', revenue: '-', active: true },
                  { name: 'DESCUENTOS 5.5', dates: 'Del 18 de abril al 5 de mayo', visits: 41, sales: '-', conversion: '0%', units: '-', revenue: '-', active: true },
                  { name: 'Potencia tus ventas Abril', dates: 'Del 4 de abril al 5 de mayo', visits: 70, sales: 1, conversion: '1,4%', units: 1, revenue: '$ 82.444,3', active: true },
                  { name: 'Hace crecer tus ventas Abril', dates: 'Del 4 de abril al 5 de mayo', visits: 22, sales: '-', conversion: '0%', units: '-', revenue: '-', active: true },
                  { name: 'Oferta relámpago Para MADSJEEZ', dates: '30 de abril de 15 a las 21 hs', visits: 48, sales: '-', conversion: '0%', units: '-', revenue: '-', active: false },
                  { name: 'Ofertas Const e Ind Abril', dates: 'Del 31 de marzo al 30 de abril', visits: 2, sales: '-', conversion: '0%', units: '-', revenue: '-', active: false },
                  { name: 'TIER_3', dates: 'Contiene fechas específicas', visits: 11, sales: '-', conversion: '0%', units: '-', revenue: '-', active: false },
                  { name: 'Oferta relámpago', dates: 'Contiene fechas específicas', visits: 9, sales: '-', conversion: '0%', units: '-', revenue: '-', active: false },
                ].map((promo, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        {promo.active && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-white bg-green-500 w-fit">ACTIVA</span>
                        )}
                        <span className="text-xs text-gray-400">{promo.dates}</span>
                        <span className="text-sm font-medium text-gray-800">{promo.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center text-sm text-gray-800">{promo.visits}</td>
                    <td className="p-3 text-center text-sm text-gray-400">{promo.sales}</td>
                    <td className="p-3 text-center text-sm text-gray-800">{promo.conversion}</td>
                    <td className="p-3 text-center text-sm text-gray-400">{promo.units}</td>
                    <td className="p-3 text-center text-sm text-gray-800 font-medium">{promo.revenue}</td>
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
          {/* Resumen circular */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-8">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#8B5CF6" strokeWidth="12" strokeDasharray="188.5 62.8" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="12" strokeDasharray="62.8 188.5" strokeDashoffset="-188.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                  Ventas concretadas <Info size={12} className="text-gray-400" />
                </div>
                <div className="text-2xl font-black text-gray-800">$ 5.614.345 <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+ 51.9%</span></div>
                <button className="text-blue-600 text-xs font-medium hover:underline mt-1">Ir a detalle</button>
              </div>
              <div className="flex gap-8">
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Cargos e inversiones <Info size={12} className="text-gray-400" /></div>
                  <div className="text-lg font-bold text-gray-800">- $ 3.336.520 <span className="text-xs text-gray-400">59.4%</span></div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Impuestos <Info size={12} className="text-gray-400" /></div>
                  <div className="text-lg font-bold text-gray-800">- $ 264.161 <span className="text-xs text-gray-400">4.7%</span></div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Recibiste <Info size={12} className="text-gray-400" /></div>
                  <div className="text-lg font-bold text-gray-800">$ 2.013.664 <span className="text-xs text-gray-400">35.9%</span></div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <span className="text-xs text-green-700 font-medium">Beneficios:</span>
              <span className="text-xs text-green-700"> Durante este período tuviste descuentos y/o bonificaciones. </span>
              <button className="text-blue-600 text-xs font-medium hover:underline">Revisar</button>
            </div>
          </div>

          {/* Distribución de costos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Distribución de tus costos</h3>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-2">
                Cargos, inversiones e impuestos <Info size={12} className="text-gray-400" />
              </div>
              <div className="text-2xl font-black text-gray-800 mb-6">$ 3.600.680</div>
              <div className="space-y-3">
                {[
                  { label: 'Cargos por venta totales', pct: '42.5%', color: 'bg-purple-500', width: '42.5%' },
                  { label: 'Inversión en Publicidad', pct: '37.2%', color: 'bg-purple-400', width: '37.2%' },
                  { label: 'Percepciones', pct: '6.6%', color: 'bg-orange-400', width: '6.6%' },
                  { label: 'Costos de envío', pct: '9.9%', color: 'bg-purple-300', width: '9.9%' },
                  { label: 'Cargos por envíos Full', pct: '1.5%', color: 'bg-purple-200', width: '1.5%' },
                  { label: 'Otros cargos', pct: '0.9%', color: 'bg-purple-200', width: '0.9%' },
                  { label: 'Retenciones', pct: '0.7%', color: 'bg-orange-300', width: '0.7%' },
                  { label: 'Cargos por devolución', pct: '0.6%', color: 'bg-purple-200', width: '0.6%' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-48 text-xs text-gray-600 text-right truncate">{item.label}</div>
                    <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                      <div className={`h-full ${item.color} rounded`} style={{ width: item.width }}></div>
                    </div>
                    <div className="w-12 text-xs font-semibold text-gray-700">{item.pct}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
                {[
                  { label: 'Cargos por venta', color: 'bg-purple-500' },
                  { label: 'Costos de envío', color: 'bg-purple-300' },
                  { label: 'Cargos por otros servicios', color: 'bg-purple-200' },
                  { label: 'Inversión en Publicidad', color: 'bg-purple-400' },
                  { label: 'Impuestos', color: 'bg-orange-400' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                    <span className="text-[10px] text-gray-500">{item.label}</span>
                  </div>
                ))}
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
              <span className="text-xs text-gray-500">266 publicaciones</span>
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
                  {[
                    { sku: '#3112842870', title: 'Tapa De Arranque Cortacesped 3.5 Hp 4...', price: '$33.000', sales: '$ 33.849', qty: '1 u.', costs: '- $ 7.689', tax: '$ 0', received: '$ 26.160', rent: '77.3%', img: '/placeholder.svg' },
                    { sku: '#2762315998', title: 'Amoladora Angular Gamma 850w - G1917ar Celeste 50...', price: '$103.515,50', sales: '$ 83.093', qty: '1 u.', costs: '- $ 19.210', tax: '$ 0', received: '$ 63.884', rent: '76.9%', img: '/placeholder.svg', catalog: true },
                    { sku: '#2708560344', title: 'Tapa Arranque Fácil Desmalezadora Chines...', price: '$35.999', sales: '$ 36.848', qty: '1 u.', costs: '- $ 8.388', tax: '- $ 728', received: '$ 27.732', rent: '75.3%', img: '/placeholder.svg', full: true },
                    { sku: '#1684180971', title: 'Arco Sierra Mini 300mm 12 Pulgadas Premium Alta...', price: '$33.000', sales: '$ 33.849', qty: '1 u.', costs: '- $ 7.755', tax: '- $ 673', received: '$ 25.421', rent: '75.1%', img: '/placeholder.svg' },
                    { sku: '#2378214276', title: 'Tapa Arranque Moño Desmalezadora...', price: '$14.999', sales: '$ 38.498', qty: '2 u.', costs: '- $ 9.500', tax: '- $ 157', received: '$ 28.841', rent: '74.9%', img: '/placeholder.svg', full: true },
                    { sku: '#2747600680', title: '50 Bolsas De Consorcio Residuos 80x110 Reforzade...', price: '$49.699', sales: '$ 140.846', qty: '5 u.', costs: '- $ 36.819', tax: '- $ 525', received: '$ 103.502', rent: '73.5%', img: '/placeholder.svg' },
                  ].map((pub, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {pub.catalog && <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded">CATÁLOGO</span>}
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            <img src={pub.img} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">{pub.sku} <Info size={10} /></div>
                            <div className="text-sm font-medium text-gray-800 max-w-[200px] truncate">{pub.title}</div>
                            <div className="text-xs text-gray-500">{pub.price} | 3 cuo... | Envío gr...</div>
                            <div className="text-[10px] text-gray-400">{pub.full ? '$ FULL | ' : ''}MERCADO ENVÍOS FLEX</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center text-sm text-gray-800">{pub.sales}<div className="text-xs text-gray-400">{pub.qty}</div></td>
                      <td className="p-3 text-center text-sm text-gray-800">{pub.costs}</td>
                      <td className="p-3 text-center text-sm text-gray-800">{pub.tax}</td>
                      <td className="p-3 text-center text-sm text-gray-800 font-medium">{pub.received}</td>
                      <td className="p-3 text-center text-sm text-gray-800">{pub.rent}</td>
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
            {/* Pagination */}
            <div className="p-4 flex items-center justify-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white text-sm font-semibold rounded-lg">1</button>
              {[2,3,4,5,6,7,8,9].map(n => (
                <button key={n} className="w-8 h-8 flex items-center justify-center text-gray-500 text-sm hover:bg-gray-100 rounded-lg">{n}</button>
              ))}
              <span className="text-gray-400 px-2">...</span>
              <button className="w-8 h-8 flex items-center justify-center text-gray-500 text-sm hover:bg-gray-100 rounded-lg">27</button>
              <button className="flex items-center gap-1 px-3 py-1.5 text-gray-500 text-sm hover:bg-gray-100 rounded-lg">
                Siguiente <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* === ATENCIÓN A TUS COMPRADORES === */}
      {activeTab === 'atencion' && (
        <>
          {/* Sub-tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button className="pb-2 text-sm font-semibold text-blue-600 border-b-2 border-blue-600">Reclamos, cancelaciones y devoluciones</button>
            <button className="pb-2 text-sm text-gray-500 hover:text-gray-700">Detalle de envíos incorrectos</button>
          </div>

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
                  {[
                    { label: 'Con el producto entregado', value: 2, color: 'bg-indigo-500', max: 5 },
                    { label: 'Al gestionar o preparar la venta', value: 1, color: 'bg-pink-400', max: 5 },
                    { label: 'Por otros motivos', value: 0, color: 'bg-gray-300', max: 5 },
                    { label: 'Porque el comprador se arrepintió', value: 0, color: 'bg-gray-300', max: 5 },
                    { label: 'Al despachar o entregar el producto', value: 0, color: 'bg-gray-300', max: 5 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-48 text-xs text-gray-600 text-right truncate">{item.label}</div>
                      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                        <div className={`h-full ${item.color} rounded`} style={{ width: `${(item.value / item.max) * 100}%`, minWidth: item.value > 0 ? '8px' : '0' }}></div>
                      </div>
                      <div className="w-6 text-xs font-semibold text-gray-700 text-right">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-px h-40 bg-gray-100 mx-4"></div>
              <div className="flex flex-col gap-4">
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-800">3</div>
                  <div className="text-xs text-gray-500">problemas</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-800">3</div>
                  <div className="text-xs text-gray-500">ventas afectadas</div>
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
                <div className="text-2xl font-black text-gray-800">0,77% <span className="text-xs font-semibold text-green-600">+ 0,43 puntos</span></div>
                <div className="text-xs text-gray-400 mt-1">3 ventas</div>
                <div className="mt-4 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-16 h-16 -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#3B82F6" strokeWidth="10" strokeDasharray="150 101" strokeLinecap="round" />
                  </svg>
                  <div className="absolute ml-20 mt-0 space-y-1">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-blue-500"></span> En ventas concretadas</div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Con devolución</div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-blue-300"></span> Con cancelación</div>
                  </div>
                </div>
              </div>

              {/* Cancelaciones */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-2">
                  Cancelaciones <Info size={12} className="text-gray-400" />
                </div>
                <div className="text-2xl font-black text-gray-800">0% <span className="text-xs font-semibold text-gray-400">0 puntos</span></div>
                <div className="text-xs text-gray-400 mt-1">0 ventas</div>
                <div className="mt-4 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-16 h-16 -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                  </svg>
                  <div className="absolute ml-20 mt-0">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-gray-300"></span> Por vos</div>
                  </div>
                </div>
              </div>

              {/* Mediaciones */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-2">
                  Mediaciones <Info size={12} className="text-gray-400" />
                </div>
                <div className="text-2xl font-black text-gray-800">0% <span className="text-xs font-semibold text-green-600">+ 0,06 puntos</span></div>
                <div className="text-xs text-gray-400 mt-1">0 ventas</div>
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
                    Cambios <Info size={12} className="text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Ocultamos esta métrica porque no está afectando tu color actual de reputación.
                  </p>
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

      {/* Other tabs placeholder */}
      {activeTab !== 'negocio' && activeTab !== 'promociones' && activeTab !== 'costos' && activeTab !== 'atencion' && (
        <div className="bg-white rounded-xl border border-gray-200 p-20 text-center text-gray-400 italic">
          Panel de {tabs.find(t => t.id === activeTab)?.label} en preparación...
        </div>
      )}
    </div>
  );
}

