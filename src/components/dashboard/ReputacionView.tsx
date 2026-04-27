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

    // Si no se proporcionan datos, cargar desde la API
    if (!data) {
      fetchReputationData();
    }
  }, [data]);

  // Usar datos proporcionados o datos de la API
  const stats: ReputationStats = data || apiData || ({
    level: "VENDEDOR NUEVO",
    sales60Days: 0,
    salesWithShipping: 0,
    salesCompleted: 0,
    amountBilled: "0",
    claims: { percent: "0", count: 0, limit: "5%" },
    mediations: { percent: "0", count: 0, limit: "2%" },
    cancelled: { percent: "0", count: 0, limit: "3%" },
    wrongShipping: { percent: "0", count: 0, limit: "8%" },
  } satisfies ReputationStats);

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
        <a href="#" className="text-blue-500 font-medium hover:underline">
          Necesito ayuda
        </a>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-10 overflow-hidden">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-emerald-500 font-bold mb-4">
            <Star size={20} fill="currentColor" />
            <span className="text-lg truncate">{stats.level}</span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-1 mt-6 mb-2 bg-gray-100">
            <div className="bg-red-200 flex-1" />
            <div className="bg-orange-200 flex-1" />
            <div className="bg-yellow-200 flex-1" />
            <div className="bg-lime-200 flex-1" />
            <div className="bg-emerald-500 flex-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]" />
          </div>
          <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
            Así te ven tus compradores. <Info size={12} />
          </div>
        </div>

        <div className="flex-[1.5] lg:border-l lg:border-gray-100 lg:pl-10 min-w-0">
          <div className="flex items-center gap-1 text-[13px] font-semibold text-gray-800 mb-6 flex-wrap">
            Medimos tus ventas de los últimos 60 días
            <span className="text-gray-400 font-normal ml-1">Desde el 25 de feb 2026</span>
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

      <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg flex items-start gap-3 relative overflow-hidden">
        <AlertCircle size={20} className="text-orange-500 shrink-0 mt-0.5" />
        <div className="text-[13px] text-gray-700 pr-8 leading-relaxed">
          <span className="font-bold">Estás cerca de dejar de ser MadsLíder Platinum.</span> Revisá las variables que
          están por pasar los límites permitidos y mejoralas para evitarlo.
        </div>
        <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600" type="button">
          <X size={16} />
        </button>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-4 text-lg px-1">Variables sobre tus ventas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <VariableCard
            title="Reclamos"
            percent={`${stats.claims.percent}%`}
            subtitle={`Son ${stats.claims.count} de tus ventas`}
            limit={`Cerca del ${stats.claims.limit} permitido`}
            footer="Mejorá tu desempeño para evitar que afecte tu nivel."
            status="warning"
          />
          <VariableCard
            title="Mediaciones"
            percent={`${stats.mediations.percent}%`}
            subtitle={`Es ${stats.mediations.count} de tus ventas`}
            limit={`Por debajo del ${stats.mediations.limit} permitido`}
            footer="¡Seguí así!"
            status="success"
          />
          <VariableCard
            title="Canceladas"
            percent={`${stats.cancelled.percent}%`}
            subtitle={`Son ${stats.cancelled.count} de tus ventas`}
            limit={`Por debajo del ${stats.cancelled.limit} permitido`}
            footer="¡Bien hecho!"
            status="success"
          />
          <VariableCard
            title="Envíos incorrectos"
            percent={`${stats.wrongShipping.percent}%`}
            subtitle={`Son ${stats.wrongShipping.count} de tus ventas`}
            limit={`Por debajo del ${stats.wrongShipping.limit} permitido`}
            footer="¡Bien hecho!"
            status="success"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4 text-lg px-1">Tu desempeño</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center text-emerald-500 font-bold text-sm shrink-0">
                7/7
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-gray-800 truncate">¡Estás en el nivel más alto!</h4>
                <p className="text-sm text-gray-500 truncate sm:whitespace-normal">
                  Mantené tu desempeño para continuar siendo uno de los mejores.
                </p>
              </div>
            </div>

            <button
              className="w-full p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 px-6 hover:bg-gray-100 transition-colors"
              type="button"
            >
              <span className="text-sm text-blue-600 font-semibold">Ocultar requisitos alcanzados</span>
              <ChevronDown size={18} className="text-gray-400 rotate-180" />
            </button>

            <div className="p-6 flex flex-col gap-5">
              <DesempenoCheck label="Facturado en ventas concretadas" checked />
              <DesempenoCheck label="Ventas concretadas" checked />
              <DesempenoCheck label="Reclamos" checked />
              <DesempenoCheck label="Mediaciones" checked />
              <DesempenoCheck label="Canceladas por vos" checked />
              <DesempenoCheck label="Envíos incorrectos" checked />
              <DesempenoCheck label="Antigüedad en Madsjeez" checked />
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
              <span className="text-emerald-500 font-bold flex items-center gap-1.5 shrink-0">
                Excelente <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </span>
            </div>
            <button
              className="w-full text-left text-[13px] text-blue-600 font-semibold hover:underline flex justify-between items-center group"
              type="button"
            >
              Revisar envíos correctos
              <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <h3 className="font-semibold text-gray-800 mb-4 text-base flex items-center gap-1">
              Productos con problemas <Info size={14} className="text-gray-400" />
            </h3>
            <div className="flex justify-between text-[11px] font-bold text-gray-400 border-b border-gray-100 pb-2 mb-4 uppercase">
              <span>Producto</span>
              <span>Total</span>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <ProblemItem name="Kit Juntas Y Bombin Carburador..." count={1} />
              <ProblemItem name="Motor Completo Desmalezadora 2t..." count={1} />
              <ProblemItem name="Kit Pistón, Perno Y Aros..." count={1} />
            </div>

            <button
              className="w-full text-left text-[13px] text-blue-600 font-semibold hover:underline flex justify-between items-center group"
              type="button"
            >
              Analizar en Métricas
              <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
            </button>
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
