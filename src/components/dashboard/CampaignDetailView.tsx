"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Info,
  ChevronRight,
  ArrowLeft,
  HelpCircle,
  MoreHorizontal,
} from "lucide-react";

const metricCards = [
  { label: "Nuevos seguidores", value: "9", change: null, up: true },
  { label: "Visitas por publicidad", value: "12", change: null, up: true },
  { label: "Clics", value: "12", change: null, up: true },
  { label: "Impresiones", value: "2.645", change: null, up: true },
  { label: "Inversión", value: "$ 22.040", change: null, up: true },
  { label: "Costo por seguidor", value: "$ 2.449,8", change: null, up: true },
];

const chartData = [
  { day: "20 ENE", visits: 0, followers: 0, clicks: 0 },
  { day: "21 ENE", visits: 1, followers: 0, clicks: 1 },
  { day: "22 ENE", visits: 0, followers: 0, clicks: 0 },
  { day: "23 ENE", visits: 0, followers: 0, clicks: 0 },
  { day: "24 ENE", visits: 0, followers: 0, clicks: 0 },
  { day: "25 ENE", visits: 0, followers: 0, clicks: 0 },
  { day: "26 ENE", visits: 1, followers: 1, clicks: 1 },
];

export default function CampaignDetailView() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("id");
  const [period, setPeriod] = useState("Últimos 7 días");
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCampaign() {
      if (!campaignId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`/api/campaigns/${campaignId}`);
        if (!res.ok) throw new Error("Error al cargar campaña");
        const data = await res.json();
        setCampaign(data.campaign);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaign();
  }, [campaignId]);

  return (
    <div className="space-y-6 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-blue-600">
        <span className="hover:underline cursor-pointer">Publicidad</span>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="hover:underline cursor-pointer">Resumen</span>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-500">Campaña</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-semibold text-gray-800">Campaña</h1>
        <div className="flex items-center gap-3">
          <button className="text-xs text-blue-600 hover:underline">Necesito ayuda</button>
          <button className="text-xs text-blue-600 hover:underline">Ir a Mi página</button>
        </div>
      </div>

      {/* Campaign status bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Status */}
          <div className="flex items-center gap-3">
            <div className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">Activa</span>
              </div>
            </div>
          </div>

          {/* Daily budget */}
          <div className="flex items-center gap-2">
            <div>
              <p className="text-xs text-gray-500">Presupuesto diario</p>
              <p className="text-sm font-semibold text-gray-800">$ {campaign?.spentBudget?.toLocaleString() || "22.040"} <span className="text-blue-600 cursor-pointer">✎</span></p>
            </div>
            <Info size={14} className="text-gray-400" />
          </div>

          {/* Duration */}
          <div>
            <p className="text-xs text-gray-500">Duración</p>
            <p className="text-sm font-semibold text-gray-800">
              {campaign && campaign.startDate && campaign.endDate ? (
                Math.ceil((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24)) + " días"
              ) : "4 días"}
            </p>
          </div>

          {/* Coupon CTA */}
          <div className="flex items-center gap-3 justify-end">
            <div className="text-right">
              <p className="text-xs text-gray-500">Cupón nuevos seguidores</p>
              <p className="text-xs text-gray-700">¡Potenciá tu estrategia!</p>
            </div>
            <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Ir a crear
            </button>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">Métricas</h2>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>
            {period} <ChevronDown size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
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
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-4 mb-4 text-xs">
            <span className="text-gray-500">21 ene 2026</span>
          </div>

          <div className="flex items-end gap-1 h-48 px-4">
            {chartData.map((d, i) => {
              const maxVal = Math.max(...chartData.map(x => Math.max(x.visits, x.followers, x.clicks))) || 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-0.5" style={{ height: "140px" }}>
                    {/* Visits bar */}
                    <div
                      className="w-3 bg-blue-500 rounded-t-sm"
                      style={{ height: `${(d.visits / maxVal) * 100}%`, minHeight: d.visits > 0 ? "4px" : "0" }}
                    />
                    {/* Followers bar */}
                    <div
                      className="w-3 bg-purple-500 rounded-t-sm"
                      style={{ height: `${(d.followers / maxVal) * 100}%`, minHeight: d.followers > 0 ? "4px" : "0" }}
                    />
                    {/* Clicks bar */}
                    <div
                      className="w-3 bg-orange-500 rounded-t-sm"
                      style={{ height: `${(d.clicks / maxVal) * 100}%`, minHeight: d.clicks > 0 ? "4px" : "0" }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">{d.day}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm" /> Visitas por publicidad</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded-sm" /> Nuevos seguidores por publicidad</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded-sm" /> Clics</div>
          </div>
        </div>
      </div>

      {/* Ads table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
                <th className="text-left p-3 font-medium">Anuncios</th>
                <th className="text-left p-3 font-medium">Vista previa</th>
                <th className="text-left p-3 font-medium">Nuevos seguidores <Info size={12} className="inline text-gray-400" /></th>
                <th className="text-left p-3 font-medium">Visitas <Info size={12} className="inline text-gray-400" /></th>
                <th className="text-left p-3 font-medium">Impresiones <Info size={12} className="inline text-gray-400" /></th>
                <th className="text-left p-3 font-medium">Clics <Info size={12} className="inline text-gray-400" /></th>
                <th className="text-left p-3 font-medium">CTR <Info size={12} className="inline text-gray-400" /></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3">
                  <div className="text-gray-800 font-medium">Grupo de anuncios</div>
                  <div className="text-gray-500">Banner</div>
                </td>
                <td className="p-3">
                  <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center">
                    <img src="/placeholder.svg" alt="" className="w-full h-full object-cover rounded" />
                  </div>
                </td>
                <td className="p-3 text-gray-600">9</td>
                <td className="p-3 text-gray-600">12</td>
                <td className="p-3 text-gray-600">2.645</td>
                <td className="p-3 text-gray-600">12</td>
                <td className="p-3 text-gray-600">0,45 %</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-gray-100 text-center">
          <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 mx-auto">
            Más información <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Footer links */}
      <div className="text-center space-y-2 py-4">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-blue-600">
          <a href="#" className="hover:underline">Trabajá con nosotros</a>
          <a href="#" className="hover:underline">Términos y condiciones</a>
          <a href="#" className="hover:underline">Promociones</a>
          <a href="#" className="hover:underline">Cómo cuidamos tu privacidad</a>
          <a href="#" className="hover:underline">Accesibilidad</a>
          <a href="#" className="hover:underline">Información al usuario financiero</a>
          <a href="#" className="hover:underline">Ayuda</a>
          <a href="#" className="hover:underline">Defensa del Consumidor</a>
          <a href="#" className="hover:underline">Información sobre seguros</a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-blue-600">
          <a href="#" className="hover:underline">Libro de quejas online</a>
          <a href="#" className="hover:underline">Programa de Afiliados</a>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">
          Copyright © 1999-2026 MercadoLibre S.R.L.<br />
          Av. Caseros 3039, CP 1264, Parque Patricios, CABA
        </p>
      </div>
    </div>
  );
}
