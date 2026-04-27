"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle, CheckCircle2, TrendingUp, HelpCircle, Package,
  FileText, Megaphone, Settings, CreditCard, ShieldAlert,
  Menu, Info, Eye, BarChart2, Star, Zap, ChevronDown, ChevronRight,
  Bell, ShoppingCart, User, Heart
} from "lucide-react";

// --- TIPOS ---

type SummaryData = {
  accountStatus: {
    hasRestrictions: boolean;
    restrictionCount: number;
    message: string;
    warnings: number;
  };
  reputation: {
    level: string;
    score: number;
    claimsPercent: string;
    cancellationsPercent: string;
    mediationsPercent: string;
    wrongShippingPercent: string;
    totalSales: number;
    successfulSales: number;
    canceledSales: number;
  };
  sales: {
    grossLast7Days: number;
    grossTotal: number;
    growthPercent: number;
    totalCompleted: number;
  };
  money: {
    available: number;
    toSettle: number;
    advanceAvailable: number;
  };
  pending: {
    shipmentsToday: number;
    shipmentsAvailable: boolean;
    postSale: number;
    claimsAvailable: boolean;
    publicationsToImprove: number;
    totalPublications: number;
    productsAvailable: boolean;
    questions: number;
    questionsAvailable: boolean;
  };
  logistics: {
    flex: { exposure: string; metric: string };
    turbo: { exposure: string; metric: string };
    full: { exposure: string; metric: string };
  };
  storage: {
    small: { used: number; total: number; percent: number };
    large: { used: number; total: number; percent: number };
  };
  advertising: {
    sales: number;
    salesGrowth: number;
    clicks: number;
    clicksGrowth: number;
    hasCampaigns: boolean;
  };
  page: {
    visits: number;
    visitsGrowth: number;
    followers: number;
    followersGrowth: number;
  };
  billing: {
    balanceDue: number;
    status: string;
    details?: {
      subscription: number;
      boosts: number;
      commissions: number;
    };
  };
  credits: {
    available: boolean;
    status: string;
    message: string;
  };
  turbo: {
    available: boolean;
    message: string;
  };
};

// --- COMPONENTES AUXILIARES ---

const MeliCard = ({ title, children, actionText, noPadding = false, className = "" }: {
  title?: string; children: React.ReactNode; actionText?: string; noPadding?: boolean; className?: string;
}) => (
  <div className={`bg-white rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] overflow-hidden flex flex-col ${className}`}>
    {title && (
      <div className="px-5 py-4 border-b border-[#e6e6e6] flex justify-between items-center">
        <h3 className="text-base font-semibold text-[#333333]">{title}</h3>
      </div>
    )}
    <div className={`flex-1 ${noPadding ? '' : 'p-5'}`}>
      {children}
    </div>
    {actionText && (
      <div className="px-5 py-4 border-t border-[#e6e6e6] mt-auto">
        <a href="#" className="text-[#3483fa] text-[13px] font-semibold hover:text-blue-700 transition-colors">
          {actionText}
        </a>
      </div>
    )}
  </div>
);

const MeliListItem = ({ label, value, alert, alertType = 'red', isLast = false, actionText }: {
  label: string; value: string; alert?: boolean; alertType?: 'red' | 'green'; isLast?: boolean; actionText?: string;
}) => (
  <div className={`py-3 flex justify-between items-center ${isLast ? '' : 'border-b border-[#f5f5f5]'}`}>
    <div className="flex flex-col">
      <span className="text-[13px] text-[#333]">{label}</span>
      {actionText && <a href="#" className="text-[#3483fa] text-[13px] font-semibold mt-1">{actionText}</a>}
    </div>
    <div className="flex items-center gap-2">
      <span className="text-[13px] font-semibold text-[#333]">{value}</span>
      {alert && (
        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${alertType === 'red' ? 'bg-[#f23d4f]' : 'bg-[#00a650]'}`}>
          !
        </div>
      )}
    </div>
  </div>
);

// --- VISTA PRINCIPAL ---

export default function ResumenView() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3483fa]"></div>
      </div>
    );
  }

  if (!data) return null;

  const d = data;

  return (
    <div className="max-w-[1200px] w-full pb-12">
      <h1 className="text-2xl font-semibold text-[#333333] mb-6">Resumen</h1>

      {/* ALERTA SUPERIOR - ESTADO REAL DE CUENTA */}
      {d.accountStatus?.hasRestrictions ? (
        <div className="bg-white rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] mb-6 overflow-hidden">
          <div className="h-1 w-full bg-[#f23d4f]"></div>
          <div className="p-5 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-[#f23d4f] mt-0.5 flex-shrink-0" />
            <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1">Estado de la cuenta</p>
                <h3 className="text-base font-semibold text-[#333] flex items-center gap-2">
                  Restricciones activas <span className="w-4 h-4 rounded-full bg-[#f23d4f] text-white text-[10px] flex items-center justify-center font-bold">{d.accountStatus.restrictionCount}</span>
                </h3>
                <p className="text-[13px] text-[#666] mt-1">{d.accountStatus.message}</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <span className="text-lg font-semibold text-[#333] block">{d.accountStatus.restrictionCount} <span className="w-2 h-2 rounded-full bg-[#f23d4f] inline-block mb-1"></span></span>
                  <a href="#" className="text-[13px] text-[#3483fa] font-semibold">Ir a Restricciones</a>
                </div>
                <div className="text-center">
                  <span className="text-lg font-semibold text-[#333] block">{d.accountStatus.warnings}</span>
                  <a href="#" className="text-[13px] text-[#3483fa] font-semibold">Ir a Advertencias</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] mb-6 overflow-hidden">
          <div className="h-1 w-full bg-[#00a650]"></div>
          <div className="p-5 flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-[#00a650] mt-0.5 flex-shrink-0" />
            <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1">Estado de la cuenta</p>
                <h3 className="text-base font-semibold text-[#333] flex items-center gap-2">
                  Todo está bien <CheckCircle2 className="w-4 h-4 text-[#00a650]" />
                </h3>
                <p className="text-[13px] text-[#666] mt-1">{d.accountStatus?.message || 'Tu cuenta está en buen estado. No tenés restricciones ni advertencias.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TIRA DE MÉTRICAS SUPERIOR */}
      <div className="bg-white rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.12)] border border-[#e6e6e6] mb-6 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#e6e6e6]">

        <div className="flex-1 p-5">
          <p className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-2">Tu reputación</p>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[#333]">{d.reputation.level}</h3>
            <CheckCircle2 className="w-4 h-4 text-[#00a650] fill-[#00a650]/10" />
          </div>
          <p className="text-[12px] text-[#666] mt-1">Así te ven tus compradores</p>
        </div>

        <div className="flex-1 p-5">
          <p className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-2">Desempeño en tus logísticas esta semana</p>
          <div className="flex gap-4">
            <div>
              <div className="flex items-center gap-1 mb-1"><Zap className="w-3 h-3 text-[#00a650] fill-current"/><span className="text-[13px] font-semibold text-[#333]">Envíos Flex</span></div>
              <p className="text-[11px] text-[#666]">{d.logistics.flex.exposure}</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1"><Zap className="w-3 h-3 text-[#3483fa] fill-current"/><span className="text-[13px] font-semibold text-[#333]">Envíos Turbo</span></div>
              <p className="text-[11px] text-[#666]">{d.logistics.turbo.exposure}</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1"><Zap className="w-3 h-3 text-[#00a650] fill-current"/><span className="text-[13px] font-semibold text-[#333]">Envíos Full</span></div>
              <p className="text-[11px] text-[#666]">{d.logistics.full.exposure}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-5">
          <p className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-2">Ventas brutas</p>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[#333]">${d.sales.grossLast7Days.toLocaleString()}</h3>
            <span className="text-[12px] font-semibold text-[#00a650]">+{d.sales.growthPercent}%</span>
          </div>
          <p className="text-[12px] text-[#666] mt-1">Últimos 7 días</p>
        </div>

        <div className="flex-1 p-5">
          <p className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-2">Tu dinero disponible</p>
          <h3 className="text-base font-semibold text-[#333]">${d.money.available.toLocaleString()}</h3>
          {d.money.advanceAvailable > 0 && (
            <a href="#" className="text-[12px] text-[#3483fa] font-semibold mt-1 inline-block">Adelantar ${d.money.advanceAvailable.toLocaleString()}</a>
          )}
        </div>

      </div>

      {/* TABS */}
      <div className="flex items-center gap-6 mb-6 border-b border-[#ccc]">
        <button className="py-2 border-b-2 border-[#3483fa] text-[#3483fa] font-semibold text-[14px]">Resumen principal</button>
        <button className="py-2 border-b-2 border-transparent text-[#666] hover:text-[#333] font-semibold text-[14px]">Recomendaciones</button>
        <button className="py-2 border-b-2 border-transparent text-[#3483fa] font-semibold text-[14px] flex items-center gap-1">+ Crear vista</button>
      </div>

      {/* GRILLA DE 4 COLUMNAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* --- COLUMNA 1 --- */}
        <div className="space-y-4">
          <MeliCard title="Pendientes en tus publicaciones" className="h-auto">
            <MeliListItem label="Preguntas" value={!d.pending.questionsAvailable ? "Próximamente" : d.pending.questions > 0 ? `${d.pending.questions} sin responder` : "No tenés pendientes"} />
            <MeliListItem label="Publicaciones" value={!d.pending.productsAvailable ? "Próximamente" : `${d.pending.publicationsToImprove} por mejorar`} alert={d.pending.productsAvailable && d.pending.publicationsToImprove > 0} alertType="red" actionText={d.pending.productsAvailable && d.pending.publicationsToImprove > 0 ? "Ver más" : undefined} />
            <MeliListItem label="Productos" value={!d.pending.productsAvailable ? "Próximamente" : `${d.pending.totalPublications} activas`} />
            <MeliListItem label="Envíos de hoy" value={!d.pending.shipmentsAvailable ? "Próximamente" : d.pending.shipmentsToday > 0 ? `${d.pending.shipmentsToday} por despachar` : "Sin envíos pendientes"} alert={d.pending.shipmentsAvailable && d.pending.shipmentsToday > 0} alertType="red" />
            <MeliListItem label="Posventa" value={!d.pending.claimsAvailable ? "Próximamente" : d.pending.postSale > 0 ? `${d.pending.postSale} pendientes` : "No tenés pendientes"} isLast />
          </MeliCard>

          <MeliCard title="Uso de tus espacios en Full" actionText="Ir a métricas de Stock Full">
            <div className="mb-4">
              <div className="flex justify-between text-[13px] text-[#333] mb-1"><span>Pequeños y medianos</span><span className="font-semibold">{d.storage.small.percent}%</span></div>
              <div className="h-1.5 w-full bg-[#eee] rounded-full"><div className="h-full bg-[#3483fa] rounded-full transition-all" style={{width: `${d.storage.small.percent}%`}}></div></div>
              <p className="text-[11px] text-[#999] mt-1">{d.storage.small.used} u. de {d.storage.small.total} u.</p>
            </div>
            <div>
              <div className="flex justify-between text-[13px] text-[#333] mb-1"><span>Grandes y extragrandes</span><span className="font-semibold">{d.storage.large.percent}%</span></div>
              <div className="h-1.5 w-full bg-[#eee] rounded-full"><div className="h-full bg-[#3483fa] rounded-full transition-all" style={{width: `${d.storage.large.percent}%`}}></div></div>
              <p className="text-[11px] text-[#999] mt-1">{d.storage.large.used} u. de {d.storage.large.total} u.</p>
            </div>
          </MeliCard>

          <MeliCard title="Envíos Flex" actionText="Próximamente">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-[#999]" />
              <span className="text-[13px] text-[#999] font-semibold">No disponible</span>
            </div>
            <p className="text-[12px] text-[#666]">Esta funcionalidad estará disponible próximamente.</p>
          </MeliCard>

          <MeliCard title="Mi página">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-lg font-semibold text-[#333]">{d.page.visits}</h4>
                <span className="text-[11px] font-semibold text-[#00a650]">+{d.page.visitsGrowth}%</span>
                <p className="text-[12px] text-[#666]">Visitas</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-[#333]">{d.page.followers}</h4>
                <span className="text-[11px] font-semibold text-[#00a650]">+{d.page.followersGrowth}%</span>
                <p className="text-[12px] text-[#666]">Nuevos seguidores</p>
              </div>
            </div>
            <p className="text-[11px] text-[#999] mt-4">Últimos 30 días</p>
          </MeliCard>
        </div>

        {/* --- COLUMNA 2 --- */}
        <div className="space-y-4">
          <MeliCard title="Pendientes en tus ventas">
            <MeliListItem label="Envíos de hoy" value={d.pending.shipmentsToday > 0 ? `${d.pending.shipmentsToday} por despachar` : "Sin envíos pendientes"} actionText={d.pending.shipmentsToday > 0 ? "Ver más" : undefined} />
            <MeliListItem label="Posventa" value={d.pending.postSale > 0 ? `${d.pending.postSale} pendientes` : "No tenés pendientes"} isLast />
          </MeliCard>

          <MeliCard title="Métricas de negocio" actionText="Ir a métricas de negocio">
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="text-2xl font-light text-[#333]">${d.sales.grossLast7Days.toLocaleString()}</h3>
              <span className="text-[12px] font-semibold text-[#00a650]">+{d.sales.growthPercent}%</span>
            </div>
            <p className="text-[12px] text-[#666] mb-6">Ventas brutas en los últimos 7 días</p>

            {/* Gráfico simulado */}
            <div className="h-24 w-full relative border-b border-l border-[#eee] flex items-end">
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,30 Q20,35 40,20 T80,10 L100,15" fill="none" stroke="#a90b99" strokeWidth="2" />
                <path d="M0,30 Q20,35 40,20 T80,10 L100,15 L100,40 L0,40 Z" fill="rgba(169,11,153,0.1)" stroke="none" />
              </svg>
              <span className="text-[10px] text-[#999] absolute bottom-[-16px] left-0">7 días</span>
              <span className="text-[10px] text-[#999] absolute bottom-[-16px] right-0">Hoy</span>
            </div>
          </MeliCard>

          {/* TURBO - NO DISPONIBLE */}
          <MeliCard title="Envíos Turbo" actionText="Próximamente">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-[#999]" />
              <span className="text-[13px] text-[#999] font-semibold">No disponible</span>
            </div>
            <p className="text-[12px] text-[#666]">Esta funcionalidad estará disponible próximamente para vendedores con nivel Oro o superior.</p>
          </MeliCard>

          <MeliCard noPadding>
            <div className="p-4 bg-[#f0f4ff] border-b border-[#e6e6e6] flex items-center gap-2 text-[#3483fa] font-semibold text-[13px]">
              <Info className="w-4 h-4" /> Recomendaciones
            </div>
            <div className="p-5">
              <h4 className="text-[14px] font-semibold text-[#333] mb-2">Configurá ajustes automáticos de precio</h4>
              <p className="text-[13px] text-[#666] mb-4">Ahorrá tiempo y adaptate al mercado con precios más competitivos.</p>
              <a href="#" className="text-[13px] text-[#3483fa] font-semibold">Ir a Gestión de precios</a>

              <div className="mt-4 bg-[#f5f5f5] rounded p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-[#e6e6e6] flex items-center justify-center text-[10px] font-bold">+3</div>
                <span className="text-[12px] font-semibold text-[#333]">Varias publicaciones</span>
              </div>
            </div>
          </MeliCard>
        </div>

        {/* --- COLUMNA 3 --- */}
        <div className="space-y-4">
          <MeliCard title="Reputación" actionText="Ir a Reputación">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-semibold text-[#333]">{d.reputation.level}</h3>
              <CheckCircle2 className="w-5 h-5 text-[#00a650] fill-[#00a650]/10" />
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div><h4 className="text-sm font-semibold text-[#333]">{d.reputation.claimsPercent}%</h4><p className="text-[11px] text-[#666]">Reclamos</p></div>
              <div><h4 className="text-sm font-semibold text-[#333]">{d.reputation.cancellationsPercent}%</h4><p className="text-[11px] text-[#666]">Canceladas por vos</p></div>
              <div><h4 className="text-sm font-semibold text-[#333]">{d.reputation.mediationsPercent}%</h4><p className="text-[11px] text-[#666]">Mediaciones</p></div>
              <div><h4 className="text-sm font-semibold text-[#333]">{d.reputation.wrongShippingPercent}% <span className="w-2 h-2 rounded-full bg-[#f23d4f] inline-block mb-0.5"></span></h4><p className="text-[11px] text-[#666]">Envíos incorrectos</p></div>
            </div>
          </MeliCard>

          {/* CRÉDITOS - NO DISPONIBLE */}
          <MeliCard title="Créditos para tu negocio" actionText="Próximamente">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-[#999]" />
              <span className="text-[13px] text-[#999] font-semibold">No disponible</span>
            </div>
            <p className="text-[12px] text-[#666]">{d.credits?.message || 'Los créditos estarán disponibles próximamente para vendedores con historial establecido.'}</p>
          </MeliCard>

          <MeliCard title="Tu dinero" actionText="Ir a Mercado Pago">
            <div className="mb-4">
              <h3 className="text-xl font-light text-[#333]">${d.money.available.toLocaleString()}</h3>
              <p className="text-[12px] font-semibold text-[#333] mt-0.5">Disponible</p>
              <a href="#" className="text-[12px] text-[#3483fa] mt-1 inline-block">Transferir</a>
            </div>
            <div>
              <h3 className="text-xl font-light text-[#333]">${d.money.toSettle.toLocaleString()}</h3>
              <p className="text-[12px] font-semibold text-[#333] mt-0.5">Dinero a liquidar</p>
              {d.money.advanceAvailable > 0 && (
                <a href="#" className="text-[12px] text-[#3483fa] mt-1 inline-block">Adelantar ${d.money.advanceAvailable.toLocaleString()}</a>
              )}
            </div>
          </MeliCard>
        </div>

        {/* --- COLUMNA 4 --- */}
        <div className="space-y-4">
          <MeliCard title="Novedades" actionText="Ir a Novedades">
            <p className="text-[13px] text-[#666] leading-relaxed">Aún no tenés novedades. Aquí las podrás consultar cuando estén disponibles.</p>
          </MeliCard>

          <MeliCard title="Facturación" actionText="Ver detalles">
            <h3 className="text-2xl font-light text-[#333] mb-1">${d.billing.balanceDue.toLocaleString()}</h3>
            <p className="text-[12px] font-semibold text-[#333] mb-4">Saldo a pagar</p>
            {d.billing.status === 'overdue' ? (
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f23d4f] mt-1 flex-shrink-0"></span>
                <p className="text-[12px] text-[#333]">
                  <strong className="text-[#f23d4f]">Tenés facturas pendientes</strong><br/>
                  Incluye suscripción, boosts y comisiones por ventas.
                </p>
              </div>
            ) : d.billing.balanceDue > 0 ? (
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-[#facc15] mt-1 flex-shrink-0"></span>
                <p className="text-[12px] text-[#333]">
                  <strong className="text-[#b45309]">Próximo vencimiento</strong><br/>
                  Tu factura se generará automáticamente al final del mes.
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00a650] mt-0.5 flex-shrink-0" />
                <p className="text-[12px] text-[#333]">
                  <strong className="text-[#00a650]">Al día con tus pagos</strong><br/>
                  No tenés facturas pendientes.
                </p>
              </div>
            )}
            {d.billing.details && d.billing.details.subscription > 0 && (
              <div className="mt-3 pt-3 border-t border-[#f5f5f5]">
                <p className="text-[11px] text-[#666]">Suscripción: ${d.billing.details.subscription.toLocaleString()}/mes</p>
              </div>
            )}
          </MeliCard>

          <MeliCard title="Métricas de publicidad" actionText="Ir a Publicidad">
            {d.advertising?.hasCampaigns ? (
              <>
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-[#333]">{d.advertising.sales}</h3>
                    <span className="text-[10px] font-bold text-[#00a650] bg-[#e6f7ee] px-1.5 py-0.5 rounded">↑ {d.advertising.salesGrowth}%</span>
                  </div>
                  <p className="text-[12px] text-[#666]">Ventas por publicidad</p>
                </div>
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-[#333]">{d.advertising.clicks}</h3>
                    <span className="text-[10px] font-bold text-[#00a650] bg-[#e6f7ee] px-1.5 py-0.5 rounded">↑ {d.advertising.clicksGrowth}%</span>
                  </div>
                  <p className="text-[12px] text-[#666]">Clics recibidos</p>
                </div>

                <div className="bg-[#f5f5f5] p-4 rounded-md">
                  <p className="text-[11px] font-semibold text-[#3483fa] uppercase tracking-wider mb-1 flex items-center gap-1"><Star className="w-3 h-3 fill-current"/> Recomendación</p>
                  <p className="text-[13px] text-[#333] font-semibold mb-1 leading-tight">Potenciá estas publicaciones con Product Ads</p>
                  <p className="text-[12px] text-[#666] mb-3 leading-tight">Agregalas a una campaña activa y vendé todavía más.</p>
                  <a href="#" className="text-[13px] text-[#3483fa] font-semibold">Agregar a campaña</a>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-[#999]" />
                  <span className="text-[13px] text-[#999] font-semibold">Sin campañas activas</span>
                </div>
                <p className="text-[12px] text-[#666] mb-4">No tenés campañas de publicidad activas. Creá una campaña para potenciar tus ventas.</p>
                <div className="bg-[#f0f4ff] p-4 rounded-md">
                  <p className="text-[11px] font-semibold text-[#3483fa] uppercase tracking-wider mb-1 flex items-center gap-1"><Star className="w-3 h-3 fill-current"/> Recomendación</p>
                  <p className="text-[13px] text-[#333] font-semibold mb-1 leading-tight">Creá tu primera campaña de Product Ads</p>
                  <p className="text-[12px] text-[#666] mb-3 leading-tight">Llegá a más compradores y aumentá tus ventas.</p>
                  <a href="#" className="text-[13px] text-[#3483fa] font-semibold">Crear campaña</a>
                </div>
              </>
            )}
          </MeliCard>
        </div>

      </div>
    </div>
  );
}
