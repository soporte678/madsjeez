"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ============================================================
// Tipos
// ============================================================

export interface ToolCallDisplay {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "error";
  result?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  timestamp: number;
  toolCalls?: ToolCallDisplay[];
  isError?: boolean;
}

export interface UseJarvisChatReturn {
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  isStreaming: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  isListening: boolean;
  toggleVoice: () => void;
  error: string | null;
  retryMessage: (messageId: string) => void;
  widgetState: "closed" | "open" | "minimized" | "expanded";
  setWidgetState: (s: "closed" | "open" | "minimized" | "expanded") => void;
  isVoiceEnabled: boolean;
  stopStreaming: () => void;
}

// ============================================================
// Constantes
// ============================================================

const STORAGE_KEY = "jarvis-chat-history";
const MAX_MESSAGES = 100;
const RATE_LIMIT_MS = 500;
const STREAMING_TIMEOUT_MS = 30000;

const SUGGESTIONS = [
  "¿Cuántas ventas hoy?",
  "Estado del servidor",
  "Últimos commits",
  "Productos sin stock",
  "Deployar a producción",
];

// ============================================================
// Helpers
// ============================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ChatMessage[];
      return parsed.filter(
        (m): m is ChatMessage =>
          typeof m.id === "string" &&
          typeof m.role === "string" &&
          typeof m.content === "string" &&
          typeof m.timestamp === "number"
      );
    }
  } catch {
    // Ignorar errores de parseo
  }
  return [];
}

function saveMessages(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignorar errores de escritura (quota exceeded, etc.)
  }
}

function stripMarkdown(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .trim();
}

// ============================================================
// Hook principal
// ============================================================

export function useJarvisChat(): UseJarvisChatReturn {
  // ── Estado de mensajes ──
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Estado del widget ──
  const [widgetState, setWidgetState] = useState<
    "closed" | "open" | "minimized" | "expanded"
  >("closed");

  // ── Voz ──
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // ── Referencias para streaming ──
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSendTimeRef = useRef<number>(0);
  const streamingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ==========================================================
  // Carga inicial desde localStorage
  // ==========================================================

  useEffect(() => {
    const stored = loadMessages();
    if (stored.length > 0) {
      setMessages(stored);
    }
  }, []);

  // ==========================================================
  // Persistencia en localStorage
  // ==========================================================

  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  // ==========================================================
  // SpeechRecognition
  // ==========================================================

  const initSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError("Tu navegador no soporta reconocimiento de voz");
      return null;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "es-ES";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setInput((prev) => {
          const next = prev ? `${prev} ${finalTranscript}` : finalTranscript;
          return next.trim();
        });
      }

      if (interimTranscript) {
        setInput((prev) => {
          const base = prev.split(" [escuchando...]")[0];
          return `${base} ${interimTranscript} [escuchando...]`;
        });
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") {
        setError(`Error de voz: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInput((prev) => prev.replace(/ \[escuchando\.\.\.\]/g, "").trim());
    };

    return recognition;
  }, []);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      // Detener
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    // Iniciar
    const recognition = initSpeechRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    setIsListening(true);
    setError(null);

    try {
      recognition.start();
    } catch {
      setError("No se pudo iniciar el micrófono");
      setIsListening(false);
    }
  }, [isListening, initSpeechRecognition]);

  // ==========================================================
  // TTS (Text-to-Speech) opcional
  // ==========================================================

  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    if (!window.speechSynthesis) return;

    // Cancelar cualquier lectura previa
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(stripMarkdown(text));
    utterance.lang = "es-ES";
    utterance.rate = 1.1;
    utterance.pitch = 1;

    // Buscar voz española
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(
      (v) => v.lang.startsWith("es") && v.name.includes("Google")
    ) || voices.find((v) => v.lang.startsWith("es"));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, []);

  // ==========================================================
  // Envío de mensaje (streaming SSE)
  // ==========================================================

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Rate limiting del lado cliente
      const now = Date.now();
      if (now - lastSendTimeRef.current < RATE_LIMIT_MS) {
        setError("Espera un momento antes de enviar otro mensaje...");
        return;
      }
      lastSendTimeRef.current = now;

      // Cancelar streaming previo
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setError(null);

      // Crear mensaje del usuario
      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      // Crear mensaje placeholder del asistente
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput("");
      setIsLoading(true);
      setIsStreaming(true);

      // Timeout de seguridad para streaming
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
      streamingTimeoutRef.current = setTimeout(() => {
        setIsStreaming(false);
        setIsLoading(false);
        setError("El streaming tardó demasiado. Intenta de nuevo.");
      }, STREAMING_TIMEOUT_MS);

      try {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        // Obtener historial reciente (ultimos 20 mensajes) para contexto
        const recentHistory = [...messages.slice(-19), userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/jarvis/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: recentHistory,
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          const errorText = await res.text().catch(() => "Error desconocido");
          throw new Error(`Error ${res.status}: ${errorText}`);
        }

        const contentType = res.headers.get("content-type") || "";

        // ── Modo streaming (SSE) ──
        if (contentType.includes("text/event-stream")) {
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let fullContent = "";

          if (!reader) {
            throw new Error("No se pudo leer el stream");
          }

          let buffer = "";
          const processBuffer = () => {
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;

              // Evento SSE: data: {...}
              if (trimmedLine.startsWith("data: ")) {
                const data = trimmedLine.slice(6);

                if (data === "[DONE]") {
                  setIsStreaming(false);
                  setIsLoading(false);
                  if (streamingTimeoutRef.current) {
                    clearTimeout(streamingTimeoutRef.current);
                    streamingTimeoutRef.current = null;
                  }
                  continue;
                }

                try {
                  const parsed = JSON.parse(data) as {
                    content?: string;
                    tool_call?: {
                      id: string;
                      name: string;
                      args: Record<string, unknown>;
                      status?: string;
                    };
                    error?: string;
                  };

                  if (parsed.content) {
                    fullContent += parsed.content;
                    setMessages((prev) => {
                      const updated = [...prev];
                      const lastMsg = updated[updated.length - 1];
                      if (lastMsg && lastMsg.role === "assistant") {
                        lastMsg.content = fullContent;
                      }
                      return updated;
                    });
                  }

                  if (parsed.tool_call) {
                    const tc: ToolCallDisplay = {
                      id: parsed.tool_call.id,
                      name: parsed.tool_call.name,
                      args: parsed.tool_call.args,
                      status:
                        (parsed.tool_call.status as
                          | "pending"
                          | "running"
                          | "completed"
                          | "error") || "running",
                    };
                    setMessages((prev) => {
                      const updated = [...prev];
                      const lastMsg = updated[updated.length - 1];
                      if (lastMsg && lastMsg.role === "assistant") {
                        lastMsg.toolCalls = [...(lastMsg.toolCalls || []), tc];
                      }
                      return updated;
                    });
                  }

                  if (parsed.error) {
                    throw new Error(parsed.error);
                  }
                } catch {
                  // Si no es JSON válido, tratar como texto plano
                  fullContent += data;
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg && lastMsg.role === "assistant") {
                      lastMsg.content = fullContent;
                    }
                    return updated;
                  });
                }
              }
            }
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            processBuffer();
          }

          // Procesar resto del buffer
          if (buffer.trim()) {
            const lines = buffer.split("\n");
            for (const line of lines) {
              if (line.trim().startsWith("data: ")) {
                const data = line.trim().slice(6);
                if (data && data !== "[DONE]") {
                  fullContent += data;
                }
              }
            }
            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === "assistant") {
                lastMsg.content = fullContent;
              }
              return updated;
            });
          }

          // TTS si está habilitado
          if (isVoiceEnabled && fullContent) {
            speakText(fullContent);
          }
        }
        // ── Modo JSON (respuesta completa) ──
        else {
          const data = (await res.json()) as {
            content?: string;
            error?: string;
            toolCalls?: Array<{
              id: string;
              name: string;
              arguments: Record<string, unknown>;
            }>;
          };

          if (data.error) {
            throw new Error(data.error);
          }

          // Convertir toolCalls del API al formato interno
          const toolCallsDisplay: ToolCallDisplay[] | undefined = data.toolCalls?.map(
            (tc) => ({
              id: tc.id,
              name: tc.name,
              args: tc.arguments,
              status: "completed" as const,
            })
          );

          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              lastMsg.content = data.content || "";
              lastMsg.toolCalls = toolCallsDisplay;
            }
            return updated;
          });

          if (isVoiceEnabled && data.content) {
            speakText(data.content);
          }
        }

        setIsStreaming(false);
        setIsLoading(false);

        if (streamingTimeoutRef.current) {
          clearTimeout(streamingTimeoutRef.current);
          streamingTimeoutRef.current = null;
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error desconocido";

        // No mostrar error si fue abortado intencionalmente
        if (message.includes("aborted")) {
          setIsStreaming(false);
          setIsLoading(false);
          return;
        }

        setError(message);
        setIsStreaming(false);
        setIsLoading(false);

        // Marcar el último mensaje como error
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            lastMsg.content = `⚠️ Error: ${message}`;
            lastMsg.isError = true;
          }
          return updated;
        });

        if (streamingTimeoutRef.current) {
          clearTimeout(streamingTimeoutRef.current);
          streamingTimeoutRef.current = null;
        }
      }
    },
    [messages, isVoiceEnabled, speakText]
  );

  // ==========================================================
  // Detener streaming
  // ==========================================================

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsLoading(false);
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
      streamingTimeoutRef.current = null;
    }
  }, []);

  // ==========================================================
  // Limpiar chat
  // ==========================================================

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setInput("");
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // ==========================================================
  // Reintentar mensaje
  // ==========================================================

  const retryMessage = useCallback(
    (messageId: string) => {
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.id === messageId);
        if (index === -1) return prev;

        // Encontrar el mensaje del usuario anterior
        const userMsg = prev[index - 1];
        if (!userMsg || userMsg.role !== "user") return prev;

        // Eliminar mensajes desde el error en adelante
        const trimmed = prev.slice(0, index);

        // Reenviar
        void sendMessage(userMsg.content);

        return trimmed;
      });
    },
    [sendMessage]
  );

  // ==========================================================
  // Cleanup al desmontar
  // ==========================================================

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ==========================================================
  // Exponer sugerencias estáticas
  // ==========================================================

  // Para usar en componentes: SUGGESTIONS se importa directamente

  return {
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
  };
}

// Re-exportar sugerencias para uso en componentes
export { SUGGESTIONS };
