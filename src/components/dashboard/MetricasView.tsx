"use client";

import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, FunnelChart, Funnel, LabelList, Cell
} from 'recharts';
import {
  Info, Download, Filter, ChevronDown, ChevronRight, ChevronLeft,
  Eye, TrendingUp, TrendingDown, Minus, Search, FileText
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
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']} />
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

      {/* Other tabs placeholder */}
      {activeTab !== 'negocio' && (
        <div className="bg-white rounded-xl border border-gray-200 p-20 text-center text-gray-400 italic">
          Panel de {tabs.find(t => t.id === activeTab)?.label} en preparación...
        </div>
      )}
    </div>
  );
}

