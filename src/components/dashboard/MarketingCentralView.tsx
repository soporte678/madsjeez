"use client";

import React from "react";
import {
  Zap,
  Tag,
  Percent,
  Package,
  Megaphone,
  Video,
  Laptop,
  Mail,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  Diamond,
  Sparkles,
  Info,
} from "lucide-react";

const aumentaVentasTools = [
  {
    icon: <Zap size={24} className="text-gray-600" />,
    title: "Oferta relámpago",
    subtitle: "Participá en una promoción que dura 6 horas",
    tag: "AUMENTÁ TUS VENTAS",
  },
  {
    icon: <Tag size={24} className="text-gray-600" />,
    title: "Oferta compartida",
    subtitle: "Mercado Libre cubre parte del descuento",
    tag: "AUMENTÁ TUS VENTAS",
  },
  {
    icon: <Percent size={24} className="text-gray-600" />,
    title: "Descuento por porcentaje",
    subtitle: "Te sugerimos un porcentaje para que tu descuento sea atractivo",
    tag: "AUMENTÁ TUS VENTAS",
  },
  {
    icon: <Package size={24} className="text-gray-600" />,
    title: "Descuento por cantidad",
    subtitle: "Descuento si compran 2 o más unidades",
    tag: "AUMENTÁ TUS VENTAS",
  },
  {
    icon: <Megaphone size={24} className="text-gray-600" />,
    title: "Promocioná tus productos",
    subtitle: "Tus publicaciones destacadas en las búsquedas",
    tag: "AUMENTÁ TUS VENTAS",
  },
  {
    icon: <Video size={24} className="text-gray-600" />,
    title: "Clips",
    subtitle: "Videos cortos para vender más",
    tag: "AUMENTÁ TUS VENTAS",
  },
];

const exclusivasTools = [
  {
    icon: <Laptop size={24} className="text-gray-600" />,
    title: "Mi página",
    subtitle: "Tu espacio dentro de Mercado Libre",
    tag: "MEJORÁ ENGAGEMENT",
  },
  {
    icon: <Zap size={24} className="text-gray-600" />,
    title: "Oferta relámpago",
    subtitle: "Ofrecé un descuento por tiempo limitado para tus visitantes",
    tag: "AUMENTÁ TUS VENTAS",
  },
  {
    icon: <Mail size={24} className="text-gray-600" />,
    title: "Canal de difusión",
    subtitle: "Comunicaciones con historias sobre tus ofertas y novedades",
    tag: "AUMENTÁ TUS VENTAS",
  },
  {
    icon: <TrendingUp size={24} className="text-gray-600" />,
    title: "Destacá tu marca por encima de los resultados",
    subtitle: "Mejor posición en las búsquedas",
    tag: "AUMENTÁ TUS VENTAS",
  },
  {
    icon: <Megaphone size={24} className="text-gray-600" />,
    title: "Promocioná Mi página",
    subtitle: "Anuncio para aumentar seguidores",
    tag: "AUMENTÁ TUS VISITAS",
  },
];

const metricasLinks = [
  { label: "Métricas de negocio", href: "#" },
  { label: "Métricas de promociones", href: "#" },
  { label: "Métricas de publicidad", href: "#" },
  { label: "Métricas de mis seguidores", href: "#" },
];

const recomendaciones = [
  {
    title: "¡Vendé más en T1 HOTSALE MAYO 2026!",
    subtitle: "Participá en uno de los mayores eventos comerciales del año.",
    cta: "Participar",
    product: {
      image: "/placeholder.svg",
      name: "Cabezal Porta Tanza Carretel Desmalezadora Motoguadaña Bajo Negro",
    },
  },
  {
    title: "¡Vendé más en DESCUENTOS 5.5!",
    subtitle: "Participá en uno de los mayores eventos comerciales del año.",
    cta: "Participar",
    product: {
      image: "/placeholder.svg",
      name: "Cabezal Porta Tanza Carretel Desmalezadora Motoguadaña Bajo Negro",
    },
  },
];

export default function MarketingCentralView() {
  return (
    <div className="space-y-8 w-full">
      <h1 className="text-[26px] font-semibold text-gray-800">Central de marketing</h1>

      {/* Aumentá tus ventas grid */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aumentaVentasTools.map((tool, idx) => (
            <button
              key={idx}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-md transition-shadow group relative"
            >
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {tool.tag}
                </span>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="text-sm font-semibold text-gray-800">{tool.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{tool.subtitle}</p>
                </div>
                <ArrowRight
                  size={18}
                  className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 mt-1"
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Exclusivas para Mi página */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Exclusivas para Mi página</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exclusivasTools.map((tool, idx) => (
            <button
              key={idx}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-md transition-shadow group relative"
            >
              <div className="absolute top-3 right-3">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    tool.tag === "MEJORÁ ENGAGEMENT"
                      ? "text-purple-600 bg-purple-50"
                      : tool.tag === "AUMENTÁ TUS VISITAS"
                      ? "text-pink-600 bg-pink-50"
                      : "text-blue-600 bg-blue-50"
                  }`}
                >
                  {tool.tag}
                </span>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="text-sm font-semibold text-gray-800">{tool.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{tool.subtitle}</p>
                </div>
                <ArrowRight
                  size={18}
                  className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 mt-1"
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Métricas de negocio + Recomendaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Métricas card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-800">Métricas de negocio</h2>
            <span className="text-xs text-gray-400">Últimos 7 días</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Ventas brutas</p>
              <p className="text-lg font-bold text-gray-800">$ 1.729.964</p>
              <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                <TrendingUp size={12} /> 37%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Cantidad de ventas</p>
              <p className="text-lg font-bold text-gray-800">59</p>
              <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                <TrendingUp size={12} /> 21,3%
              </p>
            </div>
          </div>

          <div className="space-y-0">
            {metricasLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="flex items-center justify-between py-3 border-t border-gray-100 text-sm text-gray-700 hover:text-blue-600 transition-colors"
              >
                <span>{link.label}</span>
                <ChevronRight size={16} className="text-gray-400" />
              </a>
            ))}
          </div>
        </div>

        {/* Recomendaciones */}
        {recomendaciones.map((rec, idx) => (
          <div key={idx} className="bg-blue-50 rounded-xl border border-blue-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Diamond size={14} className="text-blue-500" />
              <span className="text-xs font-semibold text-blue-600">Recomendaciones</span>
              <button className="ml-auto text-gray-400 hover:text-gray-600">
                <Info size={14} />
              </button>
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">{rec.title}</h3>
            <p className="text-xs text-gray-600 mb-3">{rec.subtitle}</p>
            <button className="text-sm font-semibold text-blue-600 hover:underline mb-4">
              {rec.cta}
            </button>
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-blue-100">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={rec.product.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-gray-700 flex-1 leading-snug">{rec.product.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
