/**
 * JARVIS Streaming Hook — React hook for real-time SSE consumption
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Token buffering for smooth rendering
 * - AbortController cleanup on unmount
 * - Connection state tracking (connecting, streaming, done, error)
 * - Retry with jitter on transient failures
 * - Built-in debouncing for rapid prompt changes
 *
 * Usage:
 * ```tsx
 * const { tokens, isStreaming, error, startStream, stopStream } = useJarvisStream();
 *
 * // Start streaming
 * startStream({ prompt: "Resumen de ventas hoy" });
 *
 * // Render
 * <div>{tokens.join("")}</div>
 * ```
 */

import { useState, useCallback, useRef, useEffect } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface StreamOptions {
  prompt: string;
  command?: string;
  scope?: string;
  detail?: string;
  system?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export type ConnectionState =
  | "idle"
  | "connecting"
  | "streaming"
  | "done"
  | "error"
  | "cached";

export interface StreamMetrics {
  firstTokenMs: number | null;
  totalLatencyMs: number | null;
  provider: string | null;
  cacheHit: boolean;
}

export interface UseJarvisStreamResult {
  /** Accumulated tokens */
  tokens: string[];
  /** Full text (tokens joined) */
  text: string;
  /** Current connection state */
  state: ConnectionState;
  /** Error message if state === 'error' */
  error: string | null;
  /** Performance metrics */
  metrics: StreamMetrics;
  /** Start a new stream */
  startStream: (opts: StreamOptions) => void;
  /** Stop the current stream */
  stopStream: () => void;
  /** Reset state */
  reset: () => void;
  /** Whether currently streaming */
  isStreaming: boolean;
  /** Whether there's a cached result */
  isCached: boolean;
}

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30_000;
const RECONNECT_MAX_ATTEMPTS = 3;
const DEBOUNCE_MS = 150;

/* ------------------------------------------------------------------ */
/* Hook                                                               */
/* ------------------------------------------------------------------ */

export function useJarvisStream(): UseJarvisStreamResult {
  const [tokens, setTokens] = useState<string[]>([]);
  const [state, setState] = useState<ConnectionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<StreamMetrics>({
    firstTokenMs: null,
    totalLatencyMs: null,
    provider: null,
    cacheHit: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectAttemptRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const firstTokenTimeRef = useRef<number | null>(null);

  /* -- Cleanup on unmount -- */
  useEffect(() => {
    return () => {
      stopStreamInternal();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  /* -- Stop stream internal -- */
  const stopStreamInternal = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /* -- Stop stream (public) -- */
  const stopStream = useCallback(() => {
    stopStreamInternal();
    setState("idle");
  }, [stopStreamInternal]);

  /* -- Reset -- */
  const reset = useCallback(() => {
    stopStreamInternal();
    setTokens([]);
    setState("idle");
    setError(null);
    setMetrics({
      firstTokenMs: null,
      totalLatencyMs: null,
      provider: null,
      cacheHit: false,
    });
    reconnectAttemptRef.current = 0;
  }, [stopStreamInternal]);

  /* -- Start stream -- */
  const startStream = useCallback(
    (opts: StreamOptions) => {
      // Debounce rapid changes
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(() => {
        startStreamNow(opts);
      }, DEBOUNCE_MS);
    },
    []
  );

  const startStreamNow = useCallback((opts: StreamOptions) => {
    // Cancel any existing stream
    stopStreamInternal();
    reconnectAttemptRef.current = 0;

    // Reset state
    setTokens([]);
    setError(null);
    setState("connecting");
    startTimeRef.current = Date.now();
    firstTokenTimeRef.current = null;

    // Build URL
    const url = new URL("/api/jarvis/stream", window.location.origin);
    url.searchParams.set("prompt", opts.prompt);
    if (opts.command) url.searchParams.set("command", opts.command);
    if (opts.scope) url.searchParams.set("scope", opts.scope);
    if (opts.detail) url.searchParams.set("detail", opts.detail);
    if (opts.system) url.searchParams.set("system", opts.system);
    if (opts.model) url.searchParams.set("model", opts.model);
    if (opts.temperature !== undefined)
      url.searchParams.set("temperature", String(opts.temperature));
    if (opts.maxTokens) url.searchParams.set("maxTokens", String(opts.maxTokens));
    if (opts.jsonMode) url.searchParams.set("jsonMode", "true");

    // Create abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Start fetch
    fetch(url.toString(), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process SSE events
            const events = buffer.split("\n\n");
            buffer = events.pop() ?? "";

            for (const event of events) {
              processSSEEvent(event);
            }
          }

          // Process remaining buffer
          if (buffer.trim()) {
            processSSEEvent(buffer);
          }
        } finally {
          reader.releaseLock();
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return; // User cancelled

        setError(err instanceof Error ? err.message : "Connection failed");
        setState("error");

        // Attempt reconnection
        attemptReconnect(opts);
      });
  }, []);

  /* -- Process SSE event -- */
  const processSSEEvent = useCallback((eventText: string) => {
    const lines = eventText.trim().split("\n");
    let event = "message";
    let data = "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        event = line.slice(7);
      } else if (line.startsWith("data: ")) {
        data = line.slice(6);
      }
    }

    switch (event) {
      case "connected": {
        try {
          const parsed = JSON.parse(data);
          setMetrics((prev) => ({ ...prev, cacheHit: parsed.cacheHit }));
          if (parsed.cacheHit) {
            setState("cached");
          }
        } catch {
          // Ignore parse errors
        }
        break;
      }

      case "token": {
        try {
          const parsed = JSON.parse(data);
          const token = parsed.token ?? "";

          if (token) {
            // Record first token time
            if (firstTokenTimeRef.current === null) {
              firstTokenTimeRef.current = Date.now() - startTimeRef.current;
              setMetrics((prev) => ({
                ...prev,
                firstTokenMs: firstTokenTimeRef.current,
              }));
              setState("streaming");
            }

            setTokens((prev) => [...prev, token]);
          }
        } catch {
          // Raw token (fallback)
          setTokens((prev) => [...prev, data]);
        }
        break;
      }

      case "done": {
        try {
          const parsed = JSON.parse(data);
          setMetrics((prev) => ({
            ...prev,
            totalLatencyMs: Date.now() - startTimeRef.current,
            provider: parsed.provider ?? prev.provider,
            cacheHit: parsed.cached ?? prev.cacheHit,
          }));
        } catch {
          // Ignore
        }
        setState("done");
        reconnectAttemptRef.current = 0;
        break;
      }

      case "error": {
        try {
          const parsed = JSON.parse(data);
          setError(parsed.error ?? "Unknown error");
        } catch {
          setError(data);
        }
        setState("error");
        break;
      }

      case "heartbeat":
        // Ignore heartbeats
        break;

      default:
        break;
    }
  }, []);

  /* -- Reconnection logic -- */
  const attemptReconnect = useCallback((opts: StreamOptions) => {
    if (reconnectAttemptRef.current >= RECONNECT_MAX_ATTEMPTS) {
      setError("Max reconnection attempts reached");
      return;
    }

    reconnectAttemptRef.current++;
    const delay = Math.min(
      RECONNECT_BASE_DELAY * 2 ** reconnectAttemptRef.current +
        Math.random() * 1000,
      RECONNECT_MAX_DELAY
    );

    setTimeout(() => {
      if (abortControllerRef.current === null) return; // Already stopped
      startStreamNow(opts);
    }, delay);
  }, []);

  return {
    tokens,
    text: tokens.join(""),
    state,
    error,
    metrics,
    startStream,
    stopStream,
    reset,
    isStreaming: state === "streaming" || state === "connecting",
    isCached: state === "cached",
  };
}

/* ------------------------------------------------------------------ */
/* Convenience: Jarvis Stream Component helper                          */
/* ------------------------------------------------------------------ */

/**
 * Pre-built prompt starters for common queries.
 * Use these to get the most out of predictive prefetching.
 */
export const JARVIS_PROMPT_TEMPLATES = {
  /** Ventas de hoy vs ayer */
  salesToday: () => "Compará las ventas de hoy con ayer. Dame números y tendencias.",
  /** Stock alerts */
  stockAlerts: () => "Listá los productos con stock bajo que necesitan reposición.",
  /** Health check */
  healthCheck: () => "Estado del sistema. Todo funciona correctamente?",
  /** Marketplace audit */
  marketplaceAudit: (scope?: string) =>
    `Auditá el marketplace${scope ? ` en ${scope}` : ""}. Detectá errores y oportunidades.`,
  /** General query */
  query: (question: string) => question,
} as const;
