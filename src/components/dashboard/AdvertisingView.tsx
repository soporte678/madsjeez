"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Info,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  X,
  CheckCircle2,
  Search,
  BarChart3,
  Loader2,
  MoreHorizontal,
} from "lucide-react";

type Tab = "campañas" | "anuncios" | "recomendaciones" | "reportes";
type CampaignGoal = "ventas" | "busquedas" | "seguidores" | null;

const metricCards = [
  { label: "Invertido", value: "$ 1.265.548,15", change: "+3.2%", up: true },
  { label: "Exposición", value: "$ 2.825.441,71", change: "+1.1%", up: true },
  { label: "Ventas", value: "60", change: "+5.2%", up: true },
  { label: "Suscripciones", value: "15", change: "+5.2%", up: true },
  { label: "Visitas", value: "—", change: "—", up: true },
];

const objetivos = [
  {
    id: "product-ads",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "Aumentar tus ventas",
    subtitle: "Ir a Product Ads",
    status: "15 campañas activas",
    metrics: [
      { label: "Inversión", value: "$ 1.265.548,15", change: "+3.2%", up: true },
      { label: "Ingresos", value: "$ 2.825.441,71", change: "+1.1%", up: true },
      { label: "Órdenes", value: "60", change: "+5.2%", up: true },
    ],
    cta: "Crear campaña de Product Ads",
    hasChart: true,
  },
  {
    id: "seguidores",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Aumentar los seguidores de tu página",
    subtitle: "Ir a mi campaña",
    status: "Campaña activa",
    metrics: [
      { label: "Inversión", value: "$ 38.093,78", change: "+0.0%", up: true },
      { label: "Nuevos seguidores", value: "18", change: "+∞%", up: true },
      { label: "Visitas", value: "98", change: "+3.2%", up: true },
    ],
    cta: null,
    hasChart: false,
  },
  {
    id: "brand-ads",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
    title: "Posicionar tu marca en búsquedas",
    subtitle: "Ir a Brand Ads",
    status: null,
    metrics: [
      { label: "Inversión", value: "—", change: null, up: true },
      { label: "Ingresos", value: "—", change: null, up: true },
      { label: "Visitas", value: "—", change: null, up: true },
    ],
    cta: "Crear campaña de Brand Ads",
    hasChart: false,
  },
];

const anunciosData = [
  {
    id: 1,
    title: "Desmalezadora 52cc Arnes Original Envio Gratis",
    campaign: "Campaña 01",
    status: "Activa",
    impressions: "2.212",
    clicks: "0,3%",
    sales: "72",
    cost: "$ 52.52",
    image: "/placeholder.svg",
  },
  {
    id: 2,
    title: "Cuchilla Para Desmalezadora 3 Puntas Lusqtoff Niwa Gamma",
    campaign: "Campaña 01",
    status: "Activa",
    impressions: "all Vue",
    clicks: "0,0%",
    sales: "60",
    cost: "$ 8,05",
    image: "/placeholder.svg",
  },
  {
    id: 3,
    title: "Tapa De Arranque Motosierras + Tapa Fre...",
    campaign: "Campaña 01",
    status: "Activa",
    impressions: "797,7K",
    clicks: "1,8%",
    sales: "85",
    cost: "$ 5,11",
    image: "/placeholder.svg",
  },
  {
    id: 4,
    title: "Cadena Para Motosierra 3/8 050 Espada 40cm 16 57 Eslabones",
    campaign: "Campaña 02",
    status: "Activa",
    impressions: "50,1K",
    clicks: "1,1%",
    sales: "77",
    cost: "$ 10,03",
    image: "/placeholder.svg",
  },
  {
    id: 5,
    title: "Cabezal Porta Tanza Carretel Desmalezadora Motoguadaña Bajo Negro",
    campaign: "Campaña 01",
    status: "Activa",
    impressions: "50,1K",
    clicks: "1%",
    sales: "87",
    cost: "$ 6,60",
    image: "/placeholder.svg",
  },
];

export default function AdvertisingView() {
  const [tab, setTab] = useState<Tab>("campañas");
  const [period, setPeriod] = useState("Últimos 30 días");
  const [compare, setCompare] = useState("Período anterior");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaignGoal, setCampaignGoal] = useState<CampaignGoal>("ventas");
  const [reportType, setReportType] = useState("general");
  const [reportPeriod, setReportPeriod] = useState("ultimos30");
  const [reportGroup, setReportGroup] = useState("diaria");
  const [searchAd, setSearchAd] = useState("");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  // Fetch campañas reales del vendedor
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [campaignsRes, productsRes] = await Promise.all([
          fetch("/api/campaigns"),
          fetch("/api/products/my"),
        ]);
        if (!campaignsRes.ok || !productsRes.ok) {
          throw new Error("Error al cargar datos");
        }
        const campaignsData = await campaignsRes.json();
        const productsData = await productsRes.json();
        setCampaigns(campaignsData.campaigns || []);
        setProducts(productsData.products || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Crear campaña real vía API
  async function handleCreateCampaign() {
    if (!campaignGoal) return;
    setCreating(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Campaña ${campaignGoal}`,
          description: `Campaña para ${campaignGoal}`,
          type: "COUPON",
          status: "ACTIVE",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          discountType: "percentage",
          discountValue: 10,
          maxBudget: 100000,
          productIds: products.slice(0, 5).map((p) => p.id),
        }),
      });
      if (!res.ok) throw new Error("Error al crear campaña");
      const data = await res.json();
      setCampaigns((prev) => [data.campaign, ...prev]);
      setShowCreateModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6 w-full relative">
      {/* === MODAL CREAR CAMPAÑA === */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-[720px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">¿Qué objetivo querés lograr con esta campaña?</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <button
                onClick={() => setCampaignGoal("ventas")}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                  campaignGoal === "ventas" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  campaignGoal === "ventas" ? "border-blue-500 bg-blue-500" : "border-gray-300"
                }`}>
                  {campaignGoal === "ventas" && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="text-sm font-semibold text-blue-600">Incrementar tus ventas</div>
              </button>

              <div className="row-span-3 bg-gray-50 rounded-xl border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-800 mb-2">Incrementar tus ventas con Product Ads</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Lográ una mejor posición para tus productos en los resultados de búsqueda y otras páginas.
                </p>
                <div className="text-xs text-gray-700 mb-1 font-medium">Métricas clave:</div>
                <ul className="text-xs text-gray-500 space-y-1 mb-4">
                  <li className="flex items-center gap-1"><Info size={12} /> Ventas</li>
                  <li className="flex items-center gap-1"><Info size={12} /> ROAS</li>
                  <li className="flex items-center gap-1"><Info size={12} /> Clics a la página del producto</li>
                </ul>
                <div className="flex items-center gap-2 mt-4">
                  <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-blue-600 font-medium hover:underline">Cancelar</button>
                  <button
                    onClick={handleCreateCampaign}
                    disabled={creating}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? "Creando..." : "Continuar"}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setCampaignGoal("busquedas")}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                  campaignGoal === "busquedas" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  campaignGoal === "busquedas" ? "border-blue-500 bg-blue-500" : "border-gray-300"
                }`}>
                  {campaignGoal === "busquedas" && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="text-sm font-semibold text-gray-700">Posicionar tu marca en búsquedas</div>
              </button>

              <button
                onClick={() => setCampaignGoal("seguidores")}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                  campaignGoal === "seguidores" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  campaignGoal === "seguidores" ? "border-blue-500 bg-blue-500" : "border-gray-300"
                }`}>
                  {campaignGoal === "seguidores" && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="text-sm font-semibold text-gray-700">Atraer seguidores a tu página</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-gray-800">Publicidad</h1>
          <p className="text-xs text-blue-600 mt-0.5">Ir a nueva publicidad</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Crear campaña
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        {[
          { id: "campañas" as Tab, label: "Campañas" },
          { id: "anuncios" as Tab, label: "Anuncios" },
          { id: "recomendaciones" as Tab, label: "Recomendaciones" },
          { id: "reportes" as Tab, label: "Reportes" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* === TAB: CAMPAÑAS === */}
      {tab === "campañas" && (
        <>
          {/* Pendientes */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium">Pendientes para hoy</span>
            <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-semibold">
              0
            </span>
            <span className="text-gray-400 text-xs">No tenés alertas de hoy</span>
          </div>

          {/* Presupuesto */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Mi presupuesto</p>
                <p className="text-sm font-semibold text-gray-800">Publicidad en Mercado Libre Flex + $29.779,05 diario</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-xs">💡</span>
              </div>
              <p className="text-xs text-gray-500 max-w-xs">
                Activá el presupuesto diario recomendado para obtener más ventas y aprovechar al máximo tus campañas.
              </p>
            </div>
          </div>

          {/* Métricas generales */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">Métricas generales</h2>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>
                  {period} <ChevronDown size={14} />
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50">
                  Comparando con: {compare} <ChevronDown size={14} />
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50">
                  Período anterior <ChevronDown size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {metricCards.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-xs text-gray-500">{card.label}</span>
                    <Info size={12} className="text-gray-400" />
                  </div>
                  <div className="text-lg font-bold text-gray-800">{card.value}</div>
                  {card.change !== "—" && (
                    <div
                      className={`text-xs flex items-center gap-0.5 mt-1 ${
                        card.up ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      {card.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {card.change}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Gráfico de barras simulado */}
            <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
              <div className="h-40 flex items-end justify-between px-2 gap-1">
                {[40,55,35,70,50,65,45,60,85,55,70,50,75,60,80,45,55,90,65,75,50,85,60,70].map((h,i) => (
                  <div key={i} className="flex-1 bg-blue-200 hover:bg-blue-300 transition-colors rounded-t-sm" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 rounded-sm" /> Clics en Product Ads</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-400 rounded-sm" /> Ventas de Product Ads</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-400 rounded-sm" /> Visitas</div>
              </div>
            </div>
          </div>

          {/* Tabla de campañas */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 p-3 border-b border-gray-100">
              <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50">Ver resumen</button>
              <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50">Filtrar</button>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-gray-500">Campañas: 15</span>
                <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">Crear campaña</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
                    <th className="text-left p-3 font-medium"><input type="checkbox" className="rounded border-gray-300" /></th>
                    <th className="text-left p-3 font-medium">Título</th>
                    <th className="text-left p-3 font-medium">Campaña</th>
                    <th className="text-left p-3 font-medium">Servicios</th>
                    <th className="text-left p-3 font-medium">Promedio Aprovisionamiento</th>
                    <th className="text-left p-3 font-medium">ROAS</th>
                    <th className="text-left p-3 font-medium">Ventas por Product Ads</th>
                    <th className="text-left p-3 font-medium">Costo</th>
                    <th className="p-3 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <img src="/placeholder.svg" alt="" className="w-full h-full object-cover rounded" />
                          </div>
                          <span className="text-gray-800 font-medium">Campaña {String(i+1).padStart(2,'0')}</span>
                        </div>
                      </td>
                      <td className="p-3"><span className="text-blue-600 font-medium">Product Ads</span></td>
                      <td className="p-3 text-gray-600">Sustantivo</td>
                      <td className="p-3 text-gray-600">$ {(1800 + i*200).toLocaleString()}</td>
                      <td className="p-3 text-gray-600">8x</td>
                      <td className="p-3 text-gray-600">{120 + i*15}</td>
                      <td className="p-3 text-gray-600">$ {(4500 + i*300).toLocaleString()}</td>
                      <td className="p-3"><button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-center gap-1 p-3 border-t border-gray-100">
              {[1,2,3,'...',8,9,10].map((p,i) => (
                <button key={i} className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center ${p === 1 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
              ))}
              <button className="text-xs text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-lg">Siguiente »</button>
            </div>
          </div>
        </>
      )}

      {/* === TAB: ANUNCIOS === */}
      {tab === "anuncios" && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50">Ver resumen</button>
              <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50">Filtrar</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Anuncios: 15</span>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
              >
                Crear campaña
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
                    <th className="text-left p-3 font-medium"><input type="checkbox" className="rounded border-gray-300" /></th>
                    <th className="text-left p-3 font-medium">Título</th>
                    <th className="text-left p-3 font-medium">Campaña</th>
                    <th className="text-left p-3 font-medium">Estado</th>
                    <th className="text-left p-3 font-medium">Impresiones</th>
                    <th className="text-left p-3 font-medium">Clics</th>
                    <th className="text-left p-3 font-medium">Ventas por Product Ads</th>
                    <th className="text-left p-3 font-medium">Costo</th>
                    <th className="p-3 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {anunciosData.map((ad) => (
                    <tr key={ad.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                            <img src={ad.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-gray-800 font-medium max-w-[200px] truncate">{ad.title}</span>
                        </div>
                      </td>
                      <td className="p-3"><span className="text-blue-600 font-medium">{ad.campaign}</span></td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">{ad.status}</span></td>
                      <td className="p-3 text-gray-600">{ad.impressions}</td>
                      <td className="p-3 text-gray-600">{ad.clicks}</td>
                      <td className="p-3 text-gray-600">{ad.sales}</td>
                      <td className="p-3 text-gray-600">{ad.cost}</td>
                      <td className="p-3"><button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* === TAB: RECOMENDACIONES === */}
      {tab === "recomendaciones" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Recomendaciones para tu cuenta</h2>
            <p className="text-xs text-gray-500 mb-4">Mirá las campañas y acciones que te recomendamos para tu negocio.</p>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <BarChart3 size={28} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Asistente para tu cuenta</p>
              <p className="text-xs text-gray-500 mb-3">Te ayudamos a identificar oportunidades para optimizar tus campañas y maximizar tus ventas.</p>
              <button className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">Ver recomendaciones</button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Recomendaciones por campaña</h2>
            <p className="text-xs text-gray-500 mb-4">Conocé acciones para optimizar tus campañas y mejorar tus resultados.</p>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
              <Loader2 size={24} className="text-gray-400 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-gray-600">Aún no tenés campañas con recomendaciones</p>
              <p className="text-xs text-gray-400 mt-1">Creá una campaña para recibir recomendaciones personalizadas.</p>
            </div>
          </div>
        </div>
      )}

      {/* === TAB: REPORTES === */}
      {tab === "reportes" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-semibold text-gray-800">Creá un reporte publicitario en formato excel</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Tipo de reporte</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="campañas">Campañas</option>
                  <option value="anuncios">Anuncios</option>
                  <option value="palabras-clave">Palabras clave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Período</label>
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ultimos30">Últimos 30 días</option>
                    <option value="ultimos7">Últimos 7 días</option>
                    <option value="mes">Este mes</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Agrupación de datos</label>
                  <select
                    value={reportGroup}
                    onChange={(e) => setReportGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="diaria">Diaria</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  Podés generar hasta 10.000 filas por reporte. <span className="text-blue-600 cursor-pointer hover:underline">Más info</span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <button className="flex items-center gap-2 w-full text-left text-sm text-gray-700 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <ChevronDown size={16} className="text-gray-400" />
                ¿Querés enviar una copia del reporte a otros colaboradores?
              </button>
            </div>

            <div className="flex justify-end">
              <button className="px-4 py-2 bg-gray-200 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed">
                Crear reporte
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">¿Qué es un reporte publicitario?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Es un archivo Excel que te permite analizar el rendimiento de tus campañas de publicidad. Podés ver métricas como impresiones, clics, ventas, inversión y más.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">¿Qué debe saber al crear un reporte?</h3>
              <ul className="text-xs text-gray-500 space-y-2 leading-relaxed">
                <li>Podés generar un máximo de 10.000 filas por reporte. Si superás este límite, te sugerimos filtrar por campaña o período.</li>
                <li>Los reportes incluyen datos históricos de hasta 2 años.</li>
              </ul>
              <a href="#" className="text-xs text-blue-600 hover:underline mt-2 inline-block">Saber más</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
