import React, { useEffect, useState } from "react";
import {
  Star,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  TrendingUp,
  Search,
  X,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";

type ReputationStats = {
  level: string;
  color?: string;
  score?: number;
  sales60Days: number;
  salesWithShipping: number;
  salesCompleted: number;
  amountBilled: string;
  claims: { percent: string; count: number; limit: string };
  mediations: { percent: string; count: number; limit: string };
  cancelled: { percent: string; count: number; limit: string };
  wrongShipping: { percent: string; count: number; limit: string };
  daysAsSeller?: number;
  sellerSince?: string;
};

// Tabla de niveles Madslider con requisitos
const LEVELS = [
  { name: "VENDEDOR NUEVO", color: "gray", minSales: 0, minRevenue: 0, order: 1 },
  { name: "BRONCE", color: "orange", minSales: 5, minRevenue: 25000, order: 2 },
  { name: "PLATA", color: "yellow", minSales: 25, minRevenue: 150000, order: 3 },
  { name: "ORO", color: "emerald", minSales: 100, minRevenue: 750000, order: 4 },
  { name: "PLATINUM", color: "blue", minSales: 300, minRevenue: 2500000, order: 5 },
  { name: "MadsLíder Platinum", color: "darkEmerald", minSales: 750, minRevenue: 8000000, order: 6 },
];

const COLOR_CLASSES: Record<string, { text: string; bg: string; border: string; bar: string }> = {
  gray: { text: "text-gray-500", bg: "bg-gray-500", border: "border-gray-500", bar: "bg-gray-400" },
  orange: { text: "text-orange-500", bg: "bg-orange-500", border: "border-orange-500", bar: "bg-orange-400" },
  yellow: { text: "text-yellow-500", bg: "bg-yellow-500", border: "border-yellow-500", bar: "bg-yellow-400" },
  emerald: { text: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-500", bar: "bg-emerald-400" },
  blue: { text: "text-blue-500", bg: "bg-blue-500", border: "border-blue-500", bar: "bg-blue-400" },
  darkEmerald: { text: "text-emerald-700", bg: "bg-emerald-700", border: "border-emerald-700", bar: "bg-emerald-600" },
};

export default function ReputacionView({ data }: { data?: ReputationStats }) {
  const [apiData, setApiData] = useState<ReputationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReputationData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/reputation');
        if (!response.ok) {
          throw new Error('Error al cargar datos de reputación');
        }
        const data = await response.json();
        setApiData(data);
      } catch (err) {
        console.error('Error fetching reputation data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (!data) {
      fetchReputationData();
    }
  }, [data]);

  const stats: ReputationStats = data || apiData || ({
    level: "VENDEDOR NUEVO",
    sales60Days: 0,
    salesWithShipping: 0,
    salesCompleted: 0,
    amountBilled: "0",
    claims: { percent: "0", count: 0, limit: "8%" },
    mediations: { percent: "0", count: 0, limit: "4%" },
    cancelled: { percent: "0", count: 0, limit: "5%" },
    wrongShipping: { percent: "0", count: 0, limit: "10%" },
    daysAsSeller: 0,
  } satisfies ReputationStats);

  // Determinar nivel actual
  const currentLevel = LEVELS.find(l => l.name === stats.level) || LEVELS[0];
  const currentColor = COLOR_CLASSES[currentLevel.color] || COLOR_CLASSES.gray;
  const nextLevel = LEVELS[currentLevel.order]; // Siguiente nivel

  // Calcular requisitos faltantes para siguiente nivel
  const getNextLevelRequirements = () => {
    if (!nextLevel) return null;
    const completedSales = stats.salesCompleted;
    const needs = [];
    if (completedSales < nextLevel.minSales) {
      needs.push(`${nextLevel.minSales - completedSales} ventas más`);
    }
    return needs.length > 0 ? needs : null;
  };

  const nextRequirements = getNextLevelRequirements();

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando datos de reputación...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <span className="ml-2 text-red-600">{error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 overflow-hidden">
      <div className="flex justify-between items-center text-[13px] px-1">
        <div className="flex items-center gap-1 text-gray-500">
          <span>Ventas</span>
          <ChevronRight size={14} />
          <span className="font-semibold text-gray-800">Reputación</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="#" className="text-blue-500 font-medium hover:underline">
            Necesito ayuda
          </a>
          <a 
            href="/admin/setup-reputation" 
            className="text-blue-500 font-medium hover:underline text-xs bg-blue-50 px-2 py-1 rounded"
          >
            Ver todos los niveles
          </a>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-10 overflow-hidden">
        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-2 font-bold mb-4 ${currentColor.text}`}>
            <Star size={20} fill="currentColor" />
            <span className="text-lg truncate">{stats.level}</span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-1 mt-6 mb-2 bg-gray-100">
            {LEVELS.map((level) => {
              const levelColor = COLOR_CLASSES[level.color];
              const isCurrent = level.order <= currentLevel.order;
              return (
                <div 
                  key={level.name}
                  className={`flex-1 ${isCurrent ? levelColor.bar : 'bg-gray-200'}`}
                  title={level.name}
                />
              );
            })}
          </div>
          <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
            Así te ven tus compradores. <Info size={12} />
          </div>
        </div>

        <div className="flex-[1.5] lg:border-l lg:border-gray-100 lg:pl-10 min-w-0">
          <div className="flex items-center gap-1 text-[13px] font-semibold text-gray-800 mb-6 flex-wrap">
            Medimos tus ventas de los últimos 60 días
            <Info size={14} className="text-blue-500 ml-1 cursor-pointer shrink-0" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-2 text-center">
            <MetricBlock label="Ventas" value={stats.sales60Days} />
            <MetricBlock label="Con Envíos" value={stats.salesWithShipping} />
            <MetricBlock label="Concretadas" value={stats.salesCompleted} />
            <MetricBlock label="Facturado" value={`$ ${stats.amountBilled}`} isCurrency />
          </div>
        </div>
      </div>

      {nextLevel && nextRequirements && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3 relative overflow-hidden">
          <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-[13px] text-gray-700 pr-8 leading-relaxed">
            <span className="font-bold">Para llegar a {nextLevel.name}</span> necesitás: {nextRequirements.join(', ')}.
            <a href="#" className="text-blue-600 hover:underline ml-1">Ver detalles</a>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-800 mb-4 text-lg px-1">Variables sobre tus ventas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <VariableCard
            title="Reclamos"
            percent={`${stats.claims.percent}%`}
            subtitle={`Son ${stats.claims.count} de tus ventas`}
            limit={`Límite: ${stats.claims.limit}`}
            footer="Mantené tus reclamos bajo control."
            status={parseFloat(stats.claims.percent.replace(',', '.')) > parseFloat(stats.claims.limit) ? "warning" : "success"}
          />
          <VariableCard
            title="Mediaciones"
            percent={`${stats.mediations.percent}%`}
            subtitle={`Es ${stats.mediations.count} de tus ventas`}
            limit={`Límite: ${stats.mediations.limit}`}
            footer="¡Seguí así!"
            status="success"
          />
          <VariableCard
            title="Canceladas"
            percent={`${stats.cancelled.percent}%`}
            subtitle={`Son ${stats.cancelled.count} de tus ventas`}
            limit={`Límite: ${stats.cancelled.limit}`}
            footer="¡Bien hecho!"
            status={parseFloat(stats.cancelled.percent.replace(',', '.')) > parseFloat(stats.cancelled.limit) ? "warning" : "success"}
          />
          <VariableCard
            title="Envíos incorrectos"
            percent={`${stats.wrongShipping.percent}%`}
            subtitle={`Son ${stats.wrongShipping.count} de tus ventas`}
            limit={`Límite: ${stats.wrongShipping.limit}`}
            footer="¡Bien hecho!"
            status={parseFloat(stats.wrongShipping.percent.replace(',', '.')) > parseFloat(stats.wrongShipping.limit) ? "warning" : "success"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4 text-lg px-1">Tu desempeño</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full border-4 ${currentColor.border} flex items-center justify-center ${currentColor.text} font-bold text-sm shrink-0`}>
                {currentLevel.order}/{LEVELS.length}
              </div>
              <div className="min-w-0">
                {nextLevel ? (
                  <>
                    <h4 className="font-bold text-gray-800 truncate">
                      Tu próximo objetivo: {nextLevel.name}
                    </h4>
                    <p className="text-sm text-gray-500 truncate sm:whitespace-normal">
                      Necesitás {nextLevel.minSales} ventas concretadas para llegar al siguiente nivel.
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-bold text-gray-800 truncate">¡Llegaste al nivel más alto!</h4>
                    <p className="text-sm text-gray-500 truncate sm:whitespace-normal">
                      Mantené tu desempeño para continuar siendo uno de los mejores.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {LEVELS.map((level) => {
                const isUnlocked = level.order <= currentLevel.order;
                const levelColors = COLOR_CLASSES[level.color];
                return (
                  <div key={level.name} className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {isUnlocked ? (
                        <div className={`w-5 h-5 rounded-full ${levelColors.bg} flex items-center justify-center`}>
                          <CheckCircle2 size={14} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                          <Lock size={12} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[13px] font-medium truncate ${isUnlocked ? "text-gray-800" : "text-gray-400"}`}>
                        {level.name}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {level.minSales}+ ventas
                      </span>
                    </div>
                    {isUnlocked && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${levelColors.bg} text-white`}>
                        Alcanzado
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <h3 className="font-semibold text-gray-800 mb-4 text-base">Exposición de publicaciones</h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">Se calcula en base a tus envíos correctos.</p>
            <div className="flex justify-between text-[11px] font-bold text-gray-400 border-b border-gray-100 pb-2 mb-4 uppercase">
              <span>Logística</span>
              <span>Exposición</span>
            </div>
            <div className="flex justify-between items-center text-[13px] mb-6">
              <span className="text-gray-700 font-medium">Envíos Express</span>
              <span className={`font-bold flex items-center gap-1.5 shrink-0 ${currentColor.text}`}>
                {stats.salesWithShipping > 0 ? 'Excelente' : 'Nuevo'} 
                <span className={`w-2 h-2 rounded-full ${currentColor.bg}`} />
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <h3 className="font-semibold text-gray-800 mb-4 text-base flex items-center gap-1">
              Tabla de niveles <Info size={14} className="text-gray-400" />
            </h3>
            <div className="flex flex-col gap-3 mb-4">
              {LEVELS.map((level) => {
                const isCurrent = level.name === stats.level;
                const levelColors = COLOR_CLASSES[level.color];
                return (
                  <div 
                    key={level.name} 
                    className={`flex items-center justify-between p-2 rounded ${isCurrent ? 'bg-gray-50 border border-gray-200' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${levelColors.bg}`} />
                      <span className={`text-sm ${isCurrent ? 'font-bold' : 'text-gray-600'}`}>
                        {level.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {level.minSales}+ ventas
                    </span>
                  </div>
                );
              })}
            </div>
            <a
              href="/admin/setup-reputation"
              className="w-full text-left text-[13px] text-blue-600 font-semibold hover:underline flex justify-between items-center group"
            >
              Ver requisitos completos
              <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBlock({
  label,
  value,
  isCurrency = false,
}: {
  label: string;
  value: string | number;
  isCurrency?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-base sm:text-lg font-black text-gray-800 leading-tight truncate">{value}</span>
      <span
        className={`text-[10px] uppercase font-bold text-gray-400 leading-3 ${
          isCurrency ? "max-w-[90px] mx-auto" : ""
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function VariableCard({
  title,
  percent,
  subtitle,
  limit,
  footer,
  status,
}: {
  title: string;
  percent: string;
  subtitle: string;
  limit: string;
  footer: string;
  status: "warning" | "success";
}) {
  const isWarning = status === "warning";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col h-full hover:border-blue-200 transition-colors cursor-default overflow-hidden">
      <div className="flex items-center gap-1 font-bold text-gray-800 text-[14px] mb-5">
        <span className="truncate">{title}</span> <Info size={14} className="text-blue-500 cursor-pointer shrink-0" />
      </div>
      <div
        className={`text-2xl sm:text-3xl font-black mb-1 flex items-center gap-2 ${
          isWarning ? "text-orange-500" : "text-gray-800"
        }`}
      >
        <TrendingUp
          size={24}
          className={isWarning ? "text-orange-400 shrink-0" : "text-emerald-500 shrink-0"}
        />
        <span className="truncate">{percent}</span>
      </div>
      <div className="text-[12px] text-gray-500 font-medium mb-1 line-clamp-1">{subtitle}</div>
      <div
        className={`text-[10px] font-bold px-2 py-0.5 rounded w-max mb-6 truncate max-w-full ${
          isWarning ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"
        }`}
      >
        {limit}
      </div>
      <div className="mt-auto pt-4 border-t border-gray-50">
        <p className="text-[12px] text-gray-500 italic mb-4 line-clamp-2">{footer}</p>
        <div className="flex flex-col gap-2">
          <button className="text-blue-600 text-[13px] font-semibold text-left hover:underline" type="button">
            Analizar en Métricas
          </button>
          <button className="text-blue-600 text-[13px] font-semibold text-left hover:underline" type="button">
            Descargar ventas
          </button>
        </div>
      </div>
    </div>
  );
}

function DesempenoCheck({
  label,
  checked,
}: {
  label: string;
  checked: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0">
        <div
          className={`w-5 h-5 rounded-full border-2 ${
            checked ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
          }`}
        >
          {checked && <CheckCircle2 size={16} className="text-white absolute -left-px -top-px" />}
        </div>
      </div>
      <span className={`text-[13px] font-medium truncate ${checked ? "text-gray-800" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}

function ProblemItem({ name, count }: { name: string; count: number }) {
  return (
    <div className="flex justify-between items-center gap-4 group cursor-pointer overflow-hidden">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 bg-gray-100 rounded shrink-0 flex items-center justify-center text-gray-400">
          <Search size={14} />
        </div>
        <span className="text-xs text-gray-700 truncate group-hover:text-blue-600 transition-colors">{name}</span>
      </div>
      <span className="text-xs font-bold text-gray-800 shrink-0">{count}</span>
    </div>
  );
}
