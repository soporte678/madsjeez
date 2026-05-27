"use client";

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  KeyboardEvent,
} from "react";
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Loader2,
  AlertCircle,
  X,
  MessageSquare,
  Minus,
  Square,
  ChevronUp,
  Circle,
} from "lucide-react";
import { useJarvisChat } from "@/hooks/useJarvisChat";
import { JarvisMessage } from "./JarvisMessage";
import { JarvisTypingIndicator } from "./JarvisTypingIndicator";
import { JarvisQuickActions } from "./JarvisQuickActions";

// ============================================================
// Tipos
// ============================================================

type WidgetState = "closed" | "open" | "minimized" | "expanded";

interface JarvisChatWidgetProps {
  initialState?: WidgetState;
  className?: string;
}

// ============================================================
// Componente: StatusDot — Indicador de estado con animación
// ============================================================

function StatusDot({
  status,
}: {
  status: "online" | "processing" | "error" | "offline";
}): React.ReactNode {
  const config = {
    online: {
      color: "bg-emerald-400",
      animation: "animate-pulse",
      label: "En línea",
    },
    processing: {
      color: "bg-amber-400",
      animation: "animate-pulse",
      label: "Procesando",
    },
    error: {
      color: "bg-red-400",
      animation: "",
      label: "Error",
    },
    offline: {
      color: "bg-gray-400",
      animation: "",
      label: "Desconectado",
    },
  };

  const c = config[status];

  return (
    <span className="flex items-center gap-1.5" title={c.label}>
      <span
        className={`relative flex h-2.5 w-2.5 ${c.animation}`}
        aria-label={c.label}
        role="status"
      >
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.color} opacity-75`}
        />
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${c.color}`}
        />
      </span>
      <span className="text-[10px] text-gray-400 capitalize">{c.label}</span>
    </span>
  );
}

// ============================================================
// Componente: FloatingButton — Botón flotante
// ============================================================

function FloatingButton({
  onClick,
  status,
  messageCount,
}: {
  onClick: () => void;
  status: WidgetState;
  messageCount: number;
}): React.ReactNode {
  const isOpen = status === "open" || status === "expanded";

  return (
    <button
      onClick={onClick}
      className={`fixed z-50 flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 ease-out group ${
        isOpen
          ? "bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 bg-[#2d2d44] hover:bg-[#3d3d5c] border border-[#4d4d6c]"
          : "bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#EB5204] to-[#c4450a] hover:from-[#ff6a1f] hover:to-[#EB5204] hover:scale-110 active:scale-95"
      }`}
      aria-label={isOpen ? "Cerrar JARVIS" : "Abrir JARVIS"}
      aria-expanded={isOpen}
      style={{
        boxShadow: isOpen
          ? "0 4px 20px rgba(0,0,0,0.3)"
          : "0 8px 32px rgba(235, 82, 4, 0.35), 0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-gray-300" />
      ) : (
        <>
          <Bot className="w-7 h-7 text-white" />
          {/* Badge de mensajes no leídos */}
          {messageCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 border-2 border-[#1a1a2e] animate-in fade-in zoom-in duration-200">
              {messageCount}
            </span>
          )}
        </>
      )}
    </button>
  );
}

// ============================================================
// Componente: ChatHeader — Header del chat
// ============================================================

function ChatHeader({
  status,
  onMinimize,
  onExpand,
  onClose,
  isExpanded,
}: {
  status: "online" | "processing" | "error";
  onMinimize: () => void;
  onExpand: () => void;
  onClose: () => void;
  isExpanded: boolean;
}): React.ReactNode {
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-[#1a1a2e] to-[#16162b] border-b border-[#2d2d44]">
      {/* Izquierda: avatar + info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EB5204] to-[#c4450a] flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          {/* Online indicator on avatar */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1a1a2e]" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white tracking-wide">
            JARVIS
          </span>
          <StatusDot status={status} />
        </div>
      </div>

      {/* Derecha: controles */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onMinimize}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Minimizar"
          title="Minimizar"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={onExpand}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label={isExpanded ? "Reducir" : "Expandir"}
          title={isExpanded ? "Reducir" : "Expandir"}
        >
          {isExpanded ? (
            <Square className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          aria-label="Cerrar"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Componente: ChatInput — Input de texto
// ============================================================

function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
  isListening,
  onToggleVoice,
  placeholder = "Pídele algo a JARVIS...",
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  isLoading: boolean;
  isListening: boolean;
  onToggleVoice: () => void;
  placeholder?: string;
  disabled?: boolean;
}): React.ReactNode {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isLoading && value.trim()) {
          onSend();
        }
      }
    },
    [isLoading, value, onSend]
  );

  const handleSend = useCallback(() => {
    if (!isLoading && value.trim()) {
      onSend();
    }
  }, [isLoading, value, onSend]);

  return (
    <div className="flex-shrink-0 border-t border-[#2d2d44] bg-[#13132a]/90 backdrop-blur-md px-3 py-3">
      <div className="flex items-end gap-2">
        {/* Botón de micrófono */}
        <button
          onClick={onToggleVoice}
          disabled={disabled}
          className={`flex-shrink-0 p-2.5 rounded-xl transition-all duration-200 ${
            isListening
              ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30"
              : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
          } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
          aria-label={isListening ? "Detener micrófono" : "Activar micrófono"}
          title={isListening ? "Escuchando..." : "Usar micrófono"}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Escuchando..." : placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className="w-full bg-[#1a1a2e] border border-[#2d2d44] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#EB5204]/50 focus:ring-1 focus:ring-[#EB5204]/20 resize-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Escribe tu mensaje"
            aria-multiline="true"
          />
          {/* Hint de atajo */}
          <span className="absolute right-2 bottom-2 text-[9px] text-gray-600 hidden sm:block pointer-events-none">
            ↵ Enter
          </span>
        </div>

        {/* Botón enviar */}
        <button
          onClick={handleSend}
          disabled={isLoading || !value.trim()}
          className={`flex-shrink-0 p-2.5 rounded-xl transition-all duration-200 ${
            isLoading || !value.trim()
              ? "bg-[#2d2d44] text-gray-500 cursor-not-allowed"
              : "bg-[#EB5204] text-white hover:bg-[#ff6a1f] active:scale-95 shadow-lg shadow-[#EB5204]/25"
          }`}
          aria-label="Enviar mensaje"
          title="Enviar (Enter)"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Componente: ChatFooter — Footer
// ============================================================

function ChatFooter(): React.ReactNode {
  return (
    <div className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#13132a]/60 border-t border-[#2d2d44]/50">
      <Circle className="w-1.5 h-1.5 text-[#EB5204]" aria-hidden="true" />
      <span className="text-[10px] text-gray-500 tracking-wide">
        Powered by JARVIS
      </span>
    </div>
  );
}

// ============================================================
// Componente: ErrorBanner — Banner de error
// ============================================================

function ErrorBanner({
  message,
  onDismiss,
  onRetry,
}: {
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
}): React.ReactNode {
  return (
    <div
      className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border-b border-red-500/20"
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
      <p className="flex-1 text-xs text-red-300 truncate">{message}</p>
      <div className="flex items-center gap-1">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-[10px] text-red-400 hover:text-red-300 underline underline-offset-2"
          >
            Reintentar
          </button>
        )}
        <button
          onClick={onDismiss}
          className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          aria-label="Cerrar error"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Componente: MinimizedBar — Barra minimizada
// ============================================================

function MinimizedBar({
  onRestore,
  onClose,
}: {
  onRestore: () => void;
  onClose: () => void;
}): React.ReactNode {
  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-[#1a1a2e] to-[#16162b] border border-[#2d2d44] rounded-2xl shadow-2xl px-4 py-3 cursor-pointer hover:border-[#EB5204]/30 transition-all duration-200"
      onClick={onRestore}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRestore();
        }
      }}
      aria-label="Restaurar chat de JARVIS"
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EB5204] to-[#c4450a] flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <span className="text-sm font-medium text-white">JARVIS</span>
      <StatusDot status="online" />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="ml-2 p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================================
// Componente principal: JarvisChatWidget
// ============================================================

export const JarvisChatWidget: React.FC<JarvisChatWidgetProps> = ({
  initialState = "closed",
  className = "",
}) => {
  const {
    messages,
    input,
    setInput,
    isLoading,
    isStreaming,
    sendMessage,
    clearChat,
    isListening,
    toggleVoice,
    error,
    retryMessage,
    widgetState,
    setWidgetState,
    isVoiceEnabled,
    stopStreaming,
  } = useJarvisChat();

  // Referencia para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Estado local del widget (sync con hook)
  useEffect(() => {
    setWidgetState(initialState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialState]);

  // ── Scroll automático ──
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, isLoading, isStreaming]);

  // ── Status visual ──
  const getStatus = useCallback(
    (): "online" | "processing" | "error" => {
      if (error) return "error";
      if (isLoading || isStreaming) return "processing";
      return "online";
    },
    [error, isLoading, isStreaming]
  );

  // ── Handlers de estado ──
  const handleOpen = useCallback(() => {
    setWidgetState("open");
  }, [setWidgetState]);

  const handleClose = useCallback(() => {
    setWidgetState("closed");
  }, [setWidgetState]);

  const handleMinimize = useCallback(() => {
    setWidgetState("minimized");
  }, [setWidgetState]);

  const handleExpand = useCallback(() => {
    setWidgetState((prev) => (prev === "expanded" ? "open" : "expanded"));
  }, [setWidgetState]);

  const handleToggle = useCallback(() => {
    if (widgetState === "closed") {
      setWidgetState("open");
    } else {
      setWidgetState("closed");
    }
  }, [widgetState, setWidgetState]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    await sendMessage(input);
  }, [input, sendMessage]);

  const handleSuggestion = useCallback(
    async (text: string) => {
      await sendMessage(text);
    },
    [sendMessage]
  );

  const handleRetry = useCallback(
    (messageId: string) => {
      retryMessage(messageId);
    },
    [retryMessage]
  );

  // ── Estado cerrado: solo botón flotante ──
  if (widgetState === "closed") {
    return (
      <FloatingButton
        onClick={handleOpen}
        status={widgetState}
        messageCount={messages.length}
      />
    );
  }

  // ── Estado minimizado: barra compacta ──
  if (widgetState === "minimized") {
    return (
      <>
        <MinimizedBar onRestore={handleOpen} onClose={handleClose} />
        <FloatingButton
          onClick={handleOpen}
          status={widgetState}
          messageCount={messages.length}
        />
      </>
    );
  }

  // ── Estado open / expanded ──
  const isExpanded = widgetState === "expanded";

  return (
    <>
      {/* Overlay oscuro en modo expandido */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          onClick={handleMinimize}
          aria-hidden="true"
        />
      )}

      {/* Panel del chat */}
      <div
        className={`fixed z-50 flex flex-col bg-[#13132a] border border-[#2d2d44] shadow-2xl transition-all duration-300 ease-out overflow-hidden ${
          isExpanded
            ? "inset-4 sm:inset-6 rounded-2xl"
            : "bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[min(680px,calc(100vh-2rem))] rounded-2xl"
        } ${className}`}
        role="dialog"
        aria-label="Chat con JARVIS"
        aria-live="polite"
        style={{
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* ── Header ── */}
        <ChatHeader
          status={getStatus()}
          onMinimize={handleMinimize}
          onExpand={handleExpand}
          onClose={handleClose}
          isExpanded={isExpanded}
        />

        {/* ── Barra de acciones rápidas ── */}
        <JarvisQuickActions
          onSuggestion={handleSuggestion}
          onClear={clearChat}
          onExpand={handleExpand}
          onClose={handleClose}
          onMinimize={handleMinimize}
          isExpanded={isExpanded}
          isVoiceEnabled={isVoiceEnabled}
          onToggleVoice={toggleVoice}
          hasMessages={messages.length > 0}
        />

        {/* ── Banner de error ── */}
        {error && (
          <ErrorBanner
            message={error}
            onDismiss={() => {
              /* error se limpia al enviar nuevo mensaje */
            }}
            onRetry={() => {
              const lastMsg = messages[messages.length - 1];
              if (lastMsg?.isError) {
                handleRetry(lastMsg.id);
              }
            }}
          />
        )}

        {/* ── Área de mensajes ── */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2d2d44] scrollbar-track-transparent"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#2d2d44 transparent",
          }}
          role="log"
          aria-live="polite"
          aria-label="Mensajes de la conversación"
        >
          {/* Empty state cuando no hay mensajes */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EB5204]/20 to-[#EB5204]/5 border border-[#EB5204]/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-[#EB5204]" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                Inicia una conversación
              </h3>
              <p className="text-xs text-gray-400 max-w-[240px] leading-relaxed">
                Escribe un mensaje o usa el micrófono para hablar con JARVIS.
                Prueba con las sugerencias de arriba.
              </p>
            </div>
          )}

          {/* Lista de mensajes */}
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <JarvisMessage
                message={msg}
                isStreaming={
                  isStreaming && index === messages.length - 1 &&
                  msg.role === "assistant"
                }
                onRetry={handleRetry}
              />
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && !isStreaming && (
            <div className="animate-in fade-in duration-300">
              <JarvisTypingIndicator text="JARVIS está pensando" />
            </div>
          )}

          {/* Botón de detener streaming */}
          {isStreaming && (
            <div className="flex justify-center py-3">
              <button
                onClick={stopStreaming}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2d2d44] hover:bg-[#3d3d5c] border border-[#4d4d6c] text-xs text-gray-300 transition-all duration-200 hover:scale-105"
                aria-label="Detener generación"
              >
                <Circle className="w-2.5 h-2.5 text-red-400 fill-red-400" />
                Detener generación
              </button>
            </div>
          )}

          {/* Anchor para scroll */}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* ── Input ── */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          isLoading={isLoading}
          isListening={isListening}
          onToggleVoice={toggleVoice}
          placeholder="Pídele algo a JARVIS..."
          disabled={isLoading && !isStreaming}
        />

        {/* ── Footer ── */}
        <ChatFooter />
      </div>

      {/* Botón flotante (visible en open/expanded para cerrar) */}
      {(widgetState === "open" || widgetState === "expanded") && (
        <FloatingButton
          onClick={handleToggle}
          status={widgetState}
          messageCount={0}
        />
      )}
    </>
  );
};

export default JarvisChatWidget;
