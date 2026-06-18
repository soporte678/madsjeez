"use client";

import React, { useState, useCallback } from "react";
import {
  User,
  Bot,
  Wrench,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import type { ChatMessage, ToolCallDisplay } from "@/hooks/useJarvisChat";

// ============================================================
// Tipos
// ============================================================

export interface JarvisMessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onRetry?: (messageId: string) => void;
}

// ============================================================
// Helpers
// ============================================================

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 10) return "ahora";
  if (seconds < 60) return `hace ${seconds}s`;
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)}h`;
  return `hace ${Math.floor(seconds / 86400)}d`;
}

function getToolIcon(name: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    github: <span className="text-xs font-bold">GH</span>,
    railway: <span className="text-xs font-bold">RW</span>,
    supabase: <span className="text-xs font-bold">SB</span>,
    vercel: <span className="text-xs font-bold">VC</span>,
    docker: <span className="text-xs font-bold">DK</span>,
    default: <Wrench className="w-3 h-3" />,
  };

  const key = Object.keys(iconMap).find((k) =>
    name.toLowerCase().includes(k)
  );
  return iconMap[key || "default"];
}

function getToolColor(name: string): string {
  const colorMap: Record<string, string> = {
    github: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    railway: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    supabase: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    vercel: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    docker: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    default: "bg-[#EB5204]/20 text-[#EB5204] border-[#EB5204]/30",
  };

  const key = Object.keys(colorMap).find((k) =>
    name.toLowerCase().includes(k)
  );
  return colorMap[key || "default"];
}

function getStatusIcon(status: ToolCallDisplay["status"]): React.ReactNode {
  switch (status) {
    case "pending":
      return <Clock className="w-3 h-3 text-yellow-400 animate-pulse" />;
    case "running":
      return <Loader2 className="w-3 h-3 text-[#EB5204] animate-spin" />;
    case "completed":
      return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
    case "error":
      return <XCircle className="w-3 h-3 text-red-400" />;
  }
}

// ============================================================
// Renderizado de Markdown básico
// ============================================================

function MarkdownContent({ content }: { content: string }): React.ReactNode {
  if (!content) return null;

  // Escapar HTML
  const escaped = content
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Procesar línea por línea
  const lines = escaped.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let codeLang = "";
  let listItems: string[] = [];
  let inList = false;
  let listOrdered = false;

  const flushList = () => {
    if (listItems.length === 0) return;
    const ListTag = listOrdered ? "ol" : "ul";
    const className = listOrdered
      ? "list-decimal list-inside my-2 space-y-1 text-sm"
      : "list-disc list-inside my-2 space-y-1 text-sm";

    elements.push(
      <ListTag key={`list-${elements.length}`} className={className}>
        {listItems.map((item, i) => {
          // Procesar bold e italic dentro del item
          const processed = processInline(item);
          return (
            <li
              key={i}
              dangerouslySetInnerHTML={{ __html: processed }}
            />
          );
        })}
      </ListTag>
    );
    listItems = [];
    inList = false;
    listOrdered = false;
  };

  const flushCodeBlock = () => {
    if (!inCodeBlock) return;
    elements.push(
      <div
        key={`code-${elements.length}`}
        className="my-3 rounded-lg overflow-hidden border border-[#3d3d5c]"
      >
        {codeLang && (
          <div className="bg-[#1e1e2e] px-3 py-1.5 text-xs text-gray-400 font-mono border-b border-[#3d3d5c]">
            {codeLang}
          </div>
        )}
        <pre className="bg-[#1a1a2e] p-3 overflow-x-auto">
          <code className="text-xs font-mono text-emerald-300 whitespace-pre">
            {codeContent.trim()}
          </code>
        </pre>
      </div>
    );
    codeContent = "";
    codeLang = "";
    inCodeBlock = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Bloque de código (triple backtick)
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      continue;
    }

    // Línea vacía
    if (trimmed === "") {
      if (inList) {
        flushList();
      }
      continue;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3
          key={`h-${elements.length}`}
          className="text-lg font-bold text-white mt-4 mb-2"
        >
          {trimmed.slice(4)}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={`h-${elements.length}`}
          className="text-xl font-bold text-white mt-4 mb-2"
        >
          {trimmed.slice(3)}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1
          key={`h-${elements.length}`}
          className="text-2xl font-bold text-white mt-4 mb-2"
        >
          {trimmed.slice(2)}
        </h1>
      );
      continue;
    }

    // Listas desordenadas
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (inList && listOrdered) {
        flushList();
      }
      inList = true;
      listOrdered = false;
      listItems.push(trimmed.slice(2));
      continue;
    }

    // Listas ordenadas
    if (/^\d+\.\s/.test(trimmed)) {
      if (inList && !listOrdered) {
        flushList();
      }
      inList = true;
      listOrdered = true;
      listItems.push(trimmed.replace(/^\d+\.\s/, ""));
      continue;
    }

    // Línea separadora
    if (trimmed === "---" || trimmed === "***") {
      flushList();
      elements.push(
        <hr
          key={`hr-${elements.length}`}
          className="my-3 border-[#3d3d5c]"
        />
      );
      continue;
    }

    // Párrafo normal
    flushList();
    const processed = processInline(trimmed);
    elements.push(
      <p
        key={`p-${elements.length}`}
        className="text-sm leading-relaxed mb-1"
        dangerouslySetInnerHTML={{ __html: processed }}
      />
    );
  }

  // Flush pendientes
  if (inCodeBlock) flushCodeBlock();
  if (inList) flushList();

  return <>{elements}</>;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function processInline(text: string): string {
  // Escape HTML entities first to prevent XSS from AI-generated content
  let result = escapeHtml(text);

  // Bold + italic
  result = result.replace(
    /\*\*\*(.+?)\*\*\*/g,
    '<strong class="font-bold italic">$1</strong>'
  );

  // Bold
  result = result.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-bold text-white">$1</strong>'
  );

  // Italic
  result = result.replace(
    /\*(.+?)\*/g,
    '<em class="italic text-gray-300">$1</em>'
  );

  // Código inline
  result = result.replace(
    /`(.+?)`/g,
    '<code class="bg-[#1a1a2e] text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>'
  );

  // Links [texto](url) — validate protocol to prevent javascript: URIs
  result = result.replace(
    /\[(.+?)\]\((.+?)\)/g,
    (_, linkText, url) => {
      const safeUrl =
        url.startsWith("https://") || url.startsWith("http://") ? url : "#";
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-[#EB5204] hover:underline">${linkText}</a>`;
    }
  );

  return result;
}

// ============================================================
// ToolCallBadge — Badge individual de tool call
// ============================================================

function ToolCallBadge({
  toolCall,
}: {
  toolCall: ToolCallDisplay;
}): React.ReactNode {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`my-1.5 rounded-lg border overflow-hidden transition-all duration-200 ${getToolColor(toolCall.name)}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon(toolCall.status)}
          <span className="font-medium text-xs">{toolCall.name}</span>
          <span className="text-[10px] opacity-60 uppercase tracking-wider">
            {toolCall.status}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {getToolIcon(toolCall.name)}
          {expanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-2 border-t border-white/10">
          <div className="mt-2">
            <span className="text-[10px] uppercase tracking-wider opacity-50">
              Args:
            </span>
            <pre className="mt-1 bg-black/30 rounded p-2 text-[10px] font-mono overflow-x-auto">
              {JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>
          {toolCall.result && (
            <div className="mt-2">
              <span className="text-[10px] uppercase tracking-wider opacity-50">
                Result:
              </span>
              <pre className="mt-1 bg-black/30 rounded p-2 text-[10px] font-mono overflow-x-auto text-emerald-300">
                {toolCall.result.length > 300
                  ? `${toolCall.result.slice(0, 300)}...`
                  : toolCall.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Componente principal: JarvisMessage
// ============================================================

export const JarvisMessage: React.FC<JarvisMessageProps> = ({
  message,
  isStreaming = false,
  onRetry,
}) => {
  const { role, content, timestamp, toolCalls, isError, id } = message;
  const [showTimestamp, setShowTimestamp] = useState(false);

  const isUser = role === "user";
  const isAssistant = role === "assistant";

  const handleRetry = useCallback(() => {
    onRetry?.(id);
  }, [id, onRetry]);

  // ── Mensaje de usuario ──
  if (isUser) {
    return (
      <div
        className="flex items-end justify-end gap-3 px-2 py-3 group"
        role="article"
        aria-label="Mensaje del usuario"
      >
        {/* Burbuja */}
        <div className="relative max-w-[80%]">
          <div className="bg-[#EB5204] text-white rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm">
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {content}
            </p>
          </div>
          {/* Timestamp (visible en hover) */}
          <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-gray-500">
              {formatTimeAgo(timestamp)}
            </span>
          </div>
        </div>

        {/* Avatar usuario */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#EB5204] to-[#c4450a] flex items-center justify-center shadow-md"
          aria-hidden="true"
        >
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    );
  }

  // ── Mensaje del asistente ──
  return (
    <div
      className="flex items-start gap-3 px-2 py-3 group"
      role="article"
      aria-label={isError ? "Error del asistente" : "Mensaje de JARVIS"}
    >
      {/* Avatar JARVIS */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
          isError
            ? "bg-red-500/20 border border-red-500/30"
            : "bg-[#EB5204]/20 border border-[#EB5204]/30"
        }`}
        aria-hidden="true"
      >
        {isError ? (
          <AlertTriangle className="w-4 h-4 text-red-400" />
        ) : (
          <Bot className="w-4 h-4 text-[#EB5204]" />
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 max-w-[80%]">
        {/* Burbuja */}
        <div
          className={`rounded-2xl rounded-tl-md px-4 py-3 border ${
            isError
              ? "bg-red-500/10 border-red-500/20"
              : "bg-[#2d2d44] border-[#3d3d5c]/50"
          }`}
        >
          {content ? (
            <div
              className={`text-sm leading-relaxed ${
                isError ? "text-red-300" : "text-gray-100"
              }`}
            >
              <MarkdownContent content={content} />
            </div>
          ) : (
            <div className="flex items-center gap-2 py-1">
              <Loader2 className="w-3.5 h-3.5 text-[#EB5204] animate-spin" />
              <span className="text-xs text-gray-400">
                Generando respuesta...
              </span>
            </div>
          )}

          {/* Streaming cursor */}
          {isStreaming && !isError && (
            <span className="inline-block w-1.5 h-4 bg-[#EB5204] animate-pulse ml-0.5 align-middle" />
          )}
        </div>

        {/* Tool calls */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {toolCalls.map((tc) => (
              <ToolCallBadge key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Footer: timestamp + retry */}
        <div className="flex items-center gap-3 mt-1.5 px-1">
          <button
            onClick={() => setShowTimestamp(!showTimestamp)}
            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showTimestamp
              ? new Date(timestamp).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : formatTimeAgo(timestamp)}
          </button>

          {isError && onRetry && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 text-[10px] text-[#EB5204] hover:text-[#ff6a1f] transition-colors"
              aria-label="Reintentar mensaje"
            >
              <RotateCcw className="w-3 h-3" />
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JarvisMessage;
