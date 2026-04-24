import { cn } from "@/lib/utils";
import type { ReputationColor } from "@/types";

interface ReputationBadgeProps {
  color: ReputationColor;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const colorConfig = {
  red: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    label: "Rojo",
    description: "Alto riesgo",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
    label: "Naranja",
    description: "Riesgo moderado",
  },
  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-200",
    dot: "bg-yellow-500",
    label: "Amarillo",
    description: "Regular",
  },
  light_green: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
    label: "Verde",
    description: "Bueno",
  },
  dark_green: {
    bg: "bg-green-200",
    text: "text-green-800",
    border: "border-green-300",
    dot: "bg-green-700",
    label: "Verde Oscuro",
    description: "Excelente",
  },
};

const sizeConfig = {
  sm: {
    container: "px-2 py-0.5 text-xs",
    dot: "w-1.5 h-1.5",
  },
  md: {
    container: "px-2.5 py-1 text-sm",
    dot: "w-2 h-2",
  },
  lg: {
    container: "px-3 py-1.5 text-base",
    dot: "w-2.5 h-2.5",
  },
};

export function ReputationBadge({
  color,
  size = "md",
  showLabel = true,
  className,
}: ReputationBadgeProps) {
  const config = colorConfig[color];
  const sizeClasses = sizeConfig[size];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.bg,
        config.text,
        config.border,
        sizeClasses.container,
        className
      )}
      title={`Reputación: ${config.label} - ${config.description}`}
    >
      <span className={cn("rounded-full", config.dot, sizeClasses.dot)} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}

// Componente para mostrar la reputación con más detalle
interface ReputationDetailProps {
  color: ReputationColor;
  totalSales: number;
  positiveReviews: number;
  negativeReviews: number;
  claimsPercentage: number;
  delaysPercentage: number;
  className?: string;
}

export function ReputationDetail({
  color,
  totalSales,
  positiveReviews,
  negativeReviews,
  claimsPercentage,
  delaysPercentage,
  className,
}: ReputationDetailProps) {
  const config = colorConfig[color];
  const totalReviews = positiveReviews + negativeReviews;
  const positivePercentage = totalReviews > 0 
    ? Math.round((positiveReviews / totalReviews) * 100) 
    : 0;

  return (
    <div className={cn("bg-white rounded-lg border p-4", className)}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            config.bg
          )}
        >
          <span className={cn("text-2xl", config.dot.replace("bg-", "text-"))}>
            ●
          </span>
        </div>
        <div>
          <h3 className={cn("font-bold text-lg", config.text)}>
            {config.label}
          </h3>
          <p className="text-sm text-gray-500">{config.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Ventas totales</p>
          <p className="font-semibold text-lg">{totalSales.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500">Opiniones positivas</p>
          <p className="font-semibold text-lg text-green-600">
            {positivePercentage}%
          </p>
        </div>
        <div>
          <p className="text-gray-500">Reclamos</p>
          <p
            className={cn(
              "font-semibold",
              claimsPercentage > 5 ? "text-red-600" : "text-green-600"
            )}
          >
            {claimsPercentage.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-gray-500">Demoras</p>
          <p
            className={cn(
              "font-semibold",
              delaysPercentage > 10 ? "text-red-600" : "text-green-600"
            )}
          >
            {delaysPercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        <p>La reputación se calcula automáticamente según tu desempeño en ventas.</p>
      </div>
    </div>
  );
}

// Componente para mostrar el tooltip de reputación
export function ReputationTooltip() {
  return (
    <div className="bg-white rounded-lg shadow-lg border p-4 max-w-sm">
      <h4 className="font-semibold mb-3">Sistema de Reputación</h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-700"></span>
          <span><strong>Verde Oscuro:</strong> Excelente (menos de 0.5% reclamos)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span><strong>Verde:</strong> Bueno (menos de 1% reclamos)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
          <span><strong>Amarillo:</strong> Regular (1-3% reclamos)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
          <span><strong>Naranja:</strong> Riesgo moderado (3-5%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span><strong>Rojo:</strong> Alto riesgo (más de 5% reclamos)</span>
        </div>
      </div>
    </div>
  );
}
