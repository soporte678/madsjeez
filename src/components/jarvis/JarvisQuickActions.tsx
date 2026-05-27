"use client";

import React, { useState } from "react";
import {
  Trash2,
  Maximize2,
  Minimize2,
  X,
  Mic,
  MicOff,
  Sparkles,
  TrendingUp,
  Server,
  GitCommit,
  Package,
  Rocket,
  Zap,
} from "lucide-react";

// ============================================================
// Tipos
// ============================================================

export interface JarvisQuickActionsProps {
  onSuggestion: (text: string) => void;
  onClear: () => void;
  onExpand: () => void;
  onClose: () => void;
  onMinimize: () => void;
  isExpanded: boolean;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
  hasMessages: boolean;
}

interface SuggestionChip {
  id: string;
  label: string;
  icon: React.ReactNode;
  query: string;
  color: string;
}

// ============================================================
// Datos
// ============================================================

const SUGGESTIONS: SuggestionChip[] = [
  {
    id: "sales-today",
    label: "¿Cuántas ventas hoy?",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    query: "¿Cuántas ventas hemos tenido hoy?",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25",
  },
  {
    id: "server-status",
    label: "Estado del servidor",
    icon: <Server className="w-3.5 h-3.5" />,
    query: "¿Cuál es el estado actual del servidor?",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/25 hover:bg-blue-500/25",
  },
  {
    id: "recent-commits",
    label: "Últimos commits",
    icon: <GitCommit className="w-3.5 h-3.5" />,
    query: "Muéstrame los últimos commits del repositorio",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/25 hover:bg-purple-500/25",
  },
  {
    id: "out-of-stock",
    label: "Productos sin stock",
    icon: <Package className="w-3.5 h-3.5" />,
    query: "¿Qué productos están sin stock?",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/25",
  },
  {
    id: "deploy",
    label: "Deployar a producción",
    icon: <Rocket className="w-3.5 h-3.5" />,
    query: "Quiero deployar a producción",
    color: "bg-rose-500/15 text-rose-400 border-rose-500/25 hover:bg-rose-500/25",
  },
];

// ============================================================
// Componente: SuggestionChip
// ============================================================

function SuggestionChipButton({
  chip,
  onClick,
}: {
  chip: SuggestionChip;
  onClick: () => void;
}): React.ReactNode {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${chip.color}`}
      aria-label={`Sugerencia: ${chip.label}`}
    >
      {chip.icon}
      <span>{chip.label}</span>
    </button>
  );
}

// ============================================================
// Componente: Toolbar de acciones
// ============================================================

function ActionToolbar({
  onClear,
  onExpand,
  onClose,
  onMinimize,
  isExpanded,
  isVoiceEnabled,
  onToggleVoice,
  hasMessages,
}: Pick<
  JarvisQuickActionsProps,
  | "onClear"
  | "onExpand"
  | "onClose"
  | "onMinimize"
  | "isExpanded"
  | "isVoiceEnabled"
  | "onToggleVoice"
  | "hasMessages"
>): React.ReactNode {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleClear = () => {
    if (!showConfirmClear) {
      setShowConfirmClear(true);
      setTimeout(() => setShowConfirmClear(false), 3000);
      return;
    }
    onClear();
    setShowConfirmClear(false);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2d2d44] bg-[#13132a]/80 backdrop-blur-sm">
      {/* Izquierda: acciones del chat */}
      <div className="flex items-center gap-1">
        {hasMessages && (
          <button
            onClick={handleClear}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 ${
              showConfirmClear
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
            }`}
            aria-label={
              showConfirmClear
                ? "Confirmar limpiar chat"
                : "Limpiar conversación"
            }
            title="Limpiar conversación"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {showConfirmClear ? "¿Confirmar?" : "Limpiar"}
            </span>
          </button>
        )}

        <button
          onClick={onToggleVoice}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 border ${
            isVoiceEnabled
              ? "bg-[#EB5204]/20 text-[#EB5204] border-[#EB5204]/30"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border-transparent"
          }`}
          aria-label={
            isVoiceEnabled
              ? "Desactivar entrada de voz"
              : "Activar entrada de voz"
          }
          title={isVoiceEnabled ? "Voz activada" : "Voz desactivada"}
        >
          {isVoiceEnabled ? (
            <Mic className="w-3.5 h-3.5" />
          ) : (
            <MicOff className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {isVoiceEnabled ? "Voz ON" : "Voz"}
          </span>
        </button>
      </div>

      {/* Derecha: control de ventana */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onMinimize}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
          aria-label="Minimizar chat"
          title="Minimizar"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onExpand}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
          aria-label={isExpanded ? "Reducir chat" : "Expandir chat"}
          title={isExpanded ? "Reducir" : "Expandir"}
        >
          {isExpanded ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          aria-label="Cerrar chat"
          title="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Componente: WelcomeBanner
// ============================================================

function WelcomeBanner({
  onSuggestion,
}: {
  onSuggestion: (text: string) => void;
}): React.ReactNode {
  return (
    <div className="px-4 py-5 flex-shrink-0">
      {/* Saludo */}
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-[#EB5204]" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-white">
          ¡Hola! Soy JARVIS
        </h2>
      </div>
      <p className="text-xs text-gray-400 mb-4 leading-relaxed">
        Tu asistente inteligente del marketplace. Puedo ayudarte con ventas,
        servidores, código y mucho más.
      </p>

      {/* Sugerencias */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((chip) => (
          <SuggestionChipButton
            key={chip.id}
            chip={chip}
            onClick={() => onSuggestion(chip.query)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Componente principal: JarvisQuickActions
// ============================================================

export const JarvisQuickActions: React.FC<JarvisQuickActionsProps> & {
  Welcome: typeof WelcomeBanner;
  Toolbar: typeof ActionToolbar;
} = ({
  onSuggestion,
  onClear,
  onExpand,
  onClose,
  onMinimize,
  isExpanded,
  isVoiceEnabled,
  onToggleVoice,
  hasMessages,
}) => {
  return (
    <div className="flex-shrink-0">
      <ActionToolbar
        onClear={onClear}
        onExpand={onExpand}
        onClose={onClose}
        onMinimize={onMinimize}
        isExpanded={isExpanded}
        isVoiceEnabled={isVoiceEnabled}
        onToggleVoice={onToggleVoice}
        hasMessages={hasMessages}
      />
      {!hasMessages && <WelcomeBanner onSuggestion={onSuggestion} />}
    </div>
  );
};

// Sub-componentes exportados
JarvisQuickActions.Welcome = WelcomeBanner;
JarvisQuickActions.Toolbar = ActionToolbar;

export default JarvisQuickActions;
