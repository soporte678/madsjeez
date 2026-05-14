import { Badge } from "@/components/ui/badge";

type ReputationColor = "red" | "orange" | "yellow" | "light_green" | "dark_green";

interface ReputationBadgeProps {
  color: ReputationColor | string | null;
  showLabel?: boolean;
}

const colorConfig: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
  red: {
    bg: "bg-amber-100",
    text: "text-amber-900",
    label: "Rojo",
    emoji: "🔴",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    label: "Naranja",
    emoji: "🟠",
  },
  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    label: "Amarillo",
    emoji: "🟡",
  },
  light_green: {
    bg: "bg-green-100",
    text: "text-green-700",
    label: "Verde Claro",
    emoji: "🟢",
  },
  dark_green: {
    bg: "bg-green-200",
    text: "text-green-800",
    label: "Verde Oscuro",
    emoji: "🟢",
  },
};

export function ReputationBadge({ color, showLabel = true }: ReputationBadgeProps) {
  if (!color) {
    return (
      <Badge variant="secondary" className="text-xs">
        Sin reputación
      </Badge>
    );
  }

  const config = colorConfig[color] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: color,
    emoji: "⚪",
  };

  return (
    <Badge
      variant="secondary"
      className={`${config.bg} ${config.text} text-xs font-medium`}
    >
      <span className="mr-1">{config.emoji}</span>
      {showLabel && config.label}
    </Badge>
  );
}
