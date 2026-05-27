"use client";

/**
 * =============================================================================
 * VoiceActivator.tsx — JARVIS Voice Activation Widget
 * =============================================================================
 * Componente React para activacion por voz del orquestador JARVIS.
 *
 * Features:
 * - Boton flotante con microfono
 * - Indicador visual de escucha (ondas animadas)
 * - Feedback visual del comando reconocido
 * - Solo se activa despues de autenticacion facial
 * - Speech-to-Text via Web Speech API (local) o backend Whisper
 * - Visualizacion de audio en tiempo real (AudioAnalyser)
 * - Animacion de ondas sonoras durante la escucha
 *
 * REGLAS DE SEGURIDAD:
 * - NUNCA se ejecuta un comando sin autenticacion facial previa
 * - NUNCA se envian datos a servidores externos
 * - Comandos peligrosos requieren confirmacion verbal
 * - Logs de TODOS los comandos ejecutados
 * =============================================================================
 */

import React, { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type VoiceState =
  | "idle"          // Esperando - boton visible
  | "checking_auth" // Verificando autenticacion facial
  | "listening"     // Escuchando audio
  | "processing"    // Procesando STT + intent
  | "confirming"    // Esperando confirmacion para comando peligroso
  | "executing"     // Ejecutando comando en el backend
  | "success"       // Comando ejecutado correctamente
  | "error";        // Error en algun paso

type VoiceCommandResult = {
  command: string;
  intent: string;
  action: string;
  confidence: number;
  entities?: Record<string, unknown>;
  result?: string;
  security?: {
    faceAuthenticated: boolean;
    voiceAuthenticated: boolean;
    dangerousCommand?: boolean;
    confirmationToken?: string;
  };
};

type VoiceActivatorProps = {
  /** Session token from FaceAuth component */
  faceSessionToken: string | null;
  /** Whether face authentication is active */
  faceAuthenticated: boolean;
  /** Called when a command is successfully executed */
  onCommandExecuted?: (result: VoiceCommandResult) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Custom position on screen */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Custom size */
  size?: "sm" | "md" | "lg";
  /** API endpoint base URL */
  apiBaseUrl?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const WAVE_COUNT = 5;
const LISTENING_TIMEOUT_MS = 10_000;   // 10 seconds max listening
const PROCESSING_TIMEOUT_MS = 15_000;   // 15 seconds max processing
const SUCCESS_DISPLAY_MS = 4_000;       // Show success for 4 seconds
const ERROR_DISPLAY_MS = 5_000;         // Show error for 5 seconds

// ─────────────────────────────────────────────────────────────────────────────
// Web Speech API Types
// ─────────────────────────────────────────────────────────────────────────────

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function VoiceActivator({
  faceSessionToken,
  faceAuthenticated,
  onCommandExecuted,
  onError,
  position = "bottom-right",
  size = "md",
  apiBaseUrl = "",
}: VoiceActivatorProps) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [result, setResult] = useState<VoiceCommandResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<VoiceState>("idle");

  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = voiceState;
  }, [voiceState]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // ── Audio Visualizer ──────────────────────────────────────────────────────
  const startAudioVisualizer = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const update = () => {
        if (stateRef.current !== "listening") return;
        analyser.getByteFrequencyData(dataArray);

        // Calculate average level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength / 255;
        setAudioLevel(avg);

        rafRef.current = requestAnimationFrame(update);
      };

      rafRef.current = requestAnimationFrame(update);
    } catch {
      // Visualizer is optional - continue without it
      console.warn("[VoiceActivator] Audio visualizer not available");
    }
  }, []);

  // ── Speech Recognition (Web Speech API) ──────────────────────────────────
  const startListening = useCallback(() => {
    // SECURITY: Check face auth first
    if (!faceAuthenticated || !faceSessionToken) {
      setVoiceState("error");
      setErrorMessage("Autenticacion facial requerida. Activa el reconocimiento facial primero.");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setVoiceState("idle"), ERROR_DISPLAY_MS);
      return;
    }

    // Check browser support
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceState("error");
      setErrorMessage("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setVoiceState("idle"), ERROR_DISPLAY_MS);
      return;
    }

    setVoiceState("listening");
    setTranscript("");
    setFeedback("Escuchando...");
    setResult(null);
    setErrorMessage("");
    setIsExpanded(true);

    // Start audio visualizer
    void startAudioVisualizer();

    // Create recognition instance
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "es-AR";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setFeedback("Escuchando... Habla ahora");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (interimTranscript) {
        setTranscript(interimTranscript);
        setFeedback(`Escuchando: "${interimTranscript}"`);
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        setVoiceState("processing");
        setFeedback(`Procesando: "${finalTranscript}"...`);
        void processCommand(finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("[VoiceActivator] Speech recognition error:", event.error, event.message);
      if (event.error === "no-speech") {
        setVoiceState("error");
        setErrorMessage("No detecte voz. Intenta hablar mas cerca del microfono.");
      } else if (event.error === "audio-capture") {
        setVoiceState("error");
        setErrorMessage("No se pudo acceder al microfono. Verifica los permisos.");
      } else if (event.error === "not-allowed") {
        setVoiceState("error");
        setErrorMessage("Permiso de microfono denegado. Habilita el acceso en la configuracion del navegador.");
      } else {
        setVoiceState("error");
        setErrorMessage(`Error de reconocimiento: ${event.error}`);
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setVoiceState("idle"), ERROR_DISPLAY_MS);
      cleanup();
    };

    recognition.onend = () => {
      // Only transition if still in listening state (no final result received)
      if (stateRef.current === "listening") {
        setVoiceState("idle");
        setFeedback("");
        setIsExpanded(false);
        cleanup();
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.error("[VoiceActivator] Failed to start recognition:", err);
      setVoiceState("error");
      setErrorMessage("No se pudo iniciar el reconocimiento de voz.");
      cleanup();
      return;
    }

    // Auto-stop after timeout
    timeoutRef.current = setTimeout(() => {
      if (stateRef.current === "listening") {
        try { recognition.stop(); } catch { /* ignore */ }
        setVoiceState("idle");
        setFeedback("");
        setIsExpanded(false);
        cleanup();
      }
    }, LISTENING_TIMEOUT_MS);
  }, [faceAuthenticated, faceSessionToken, cleanup, startAudioVisualizer]);

  // ── Stop Listening ────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    cleanup();
    setVoiceState("idle");
    setFeedback("");
    setIsExpanded(false);
  }, [cleanup]);

  // ── Process Command (Backend) ─────────────────────────────────────────────
  const processCommand = useCallback(
    async (commandText: string) => {
      cleanup();
      setVoiceState("processing");
      setFeedback("Analizando comando...");

      try {
        // Step 1: Send to voice endpoint for STT validation + intent parsing
        const voiceResponse = await fetch(`${apiBaseUrl}/api/jarvis/voice`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            command: commandText,
            faceSessionToken,
          }),
        });

        if (!voiceResponse.ok) {
          const errorData = await voiceResponse.json().catch(() => ({}));

          // Check if face auth is required
          if (errorData.error === "FACE_AUTH_REQUIRED" || voiceResponse.status === 403) {
            setVoiceState("error");
            setErrorMessage("Autenticacion facial requerida. Activa el reconocimiento facial.");
            onError?.("FACE_AUTH_REQUIRED");
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setVoiceState("idle"), ERROR_DISPLAY_MS);
            return;
          }

          throw new Error(errorData.message || `Error ${voiceResponse.status}`);
        }

        const voiceData = (await voiceResponse.json()) as {
          status: string;
          command: string;
          intent: string;
          action: string;
          entities: Record<string, unknown>;
          confidence: number;
        };

        // Check if confirmation is required
        if (voiceData.status === "confirmation_required") {
          setVoiceState("confirming");
          setFeedback(`Comando "${voiceData.intent}" requiere confirmacion. Repite para confirmar.`);
          setResult({
            command: commandText,
            intent: voiceData.intent,
            action: voiceData.action,
            confidence: voiceData.confidence,
            entities: voiceData.entities,
          });
          return;
        }

        // Step 2: Execute command
        await executeVoiceCommand(commandText, voiceData.action, voiceData.entities);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error procesando comando";
        console.error("[VoiceActivator] Process error:", message);
        setVoiceState("error");
        setErrorMessage(message);
        onError?.(message);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setVoiceState("idle"), ERROR_DISPLAY_MS);
      }
    },
    [faceSessionToken, apiBaseUrl, cleanup, onError]
  );

  // ── Execute Voice Command ─────────────────────────────────────────────────
  const executeVoiceCommand = useCallback(
    async (
      commandText: string,
      action: string,
      entities: Record<string, unknown>,
      confirmationToken?: string
    ) => {
      setVoiceState("executing");
      setFeedback("Ejecutando comando...");

      try {
        const response = await fetch(`${apiBaseUrl}/api/jarvis/command`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            command: commandText,
            voiceAuthenticated: true,
            faceAuthenticated: true,
            faceSessionToken,
            entities,
            confirmationToken,
            source: "voice",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error ${response.status}`);
        }

        const data = (await response.json()) as {
          status: string;
          result: string;
          action: string;
          data: Record<string, unknown>;
          security?: Record<string, unknown>;
        };

        // Check if confirmation is now required after execution attempt
        if (data.status === "confirmation_required") {
          setVoiceState("confirming");
          setFeedback(data.result);
          setResult({
            command: commandText,
            intent: action,
            action,
            confidence: 1,
            entities,
            security: data.security as VoiceCommandResult["security"],
          });
          return;
        }

        const cmdResult: VoiceCommandResult = {
          command: commandText,
          intent: action,
          action: data.action,
          confidence: 1,
          entities,
          result: data.result,
          security: data.security as VoiceCommandResult["security"],
        };

        setResult(cmdResult);
        setVoiceState("success");
        setFeedback(data.result || "Comando ejecutado correctamente.");
        onCommandExecuted?.(cmdResult);

        // Auto-reset after success
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setVoiceState("idle");
          setFeedback("");
          setIsExpanded(false);
        }, SUCCESS_DISPLAY_MS);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error ejecutando comando";
        console.error("[VoiceActivator] Execute error:", message);
        setVoiceState("error");
        setErrorMessage(message);
        onError?.(message);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setVoiceState("idle"), ERROR_DISPLAY_MS);
      }
    },
    [faceSessionToken, apiBaseUrl, onCommandExecuted, onError]
  );

  // ── Confirm Dangerous Command ─────────────────────────────────────────────
  const confirmCommand = useCallback(() => {
    if (!result) return;
    const token = result.security?.confirmationToken;
    void executeVoiceCommand(
      result.command,
      result.action,
      result.entities ?? {},
      token
    );
  }, [result, executeVoiceCommand]);

  // ── Cancel Command ────────────────────────────────────────────────────────
  const cancelCommand = useCallback(() => {
    setVoiceState("idle");
    setFeedback("");
    setResult(null);
    setIsExpanded(false);
    cleanup();
  }, [cleanup]);

  // ── Position Classes ──────────────────────────────────────────────────────
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  const sizeClasses = {
    sm: { button: "w-12 h-12", icon: 20, panel: "w-72" },
    md: { button: "w-16 h-16", icon: 24, panel: "w-80" },
    lg: { button: "w-20 h-20", icon: 28, panel: "w-96" },
  };

  const s = sizeClasses[size];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 flex flex-col items-end gap-3`}
    >
      {/* ── Feedback Panel ───────────────────────────────────────────────── */}
      {isExpanded && (
        <div
          className={`${s.panel} bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-2xl p-4 mb-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4`}
        >
          {/* Status Header */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                voiceState === "listening"
                  ? "bg-red-500 animate-pulse"
                  : voiceState === "processing" || voiceState === "executing"
                    ? "bg-yellow-400 animate-pulse"
                    : voiceState === "success"
                      ? "bg-green-500"
                      : voiceState === "error"
                        ? "bg-red-600"
                        : voiceState === "confirming"
                          ? "bg-orange-400 animate-pulse"
                          : "bg-gray-500"
              }`}
            />
            <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">
              {voiceState === "listening" && "ESCUCHANDO"}
              {voiceState === "processing" && "PROCESANDO"}
              {voiceState === "executing" && "EJECUTANDO"}
              {voiceState === "success" && "EXITO"}
              {voiceState === "error" && "ERROR"}
              {voiceState === "confirming" && "CONFIRMACION REQUERIDA"}
              {voiceState === "idle" && "JARVIS"}
            </span>
            <button
              onClick={cancelCommand}
              className="ml-auto text-gray-500 hover:text-white transition-colors text-sm"
              aria-label="Cerrar"
            >
              &#x2715;
            </button>
          </div>

          {/* Audio Wave Visualizer (listening state) */}
          {voiceState === "listening" && (
            <div className="flex items-center justify-center gap-1 h-12 mb-3">
              {Array.from({ length: WAVE_COUNT }).map((_, i) => {
                const delay = i * 0.1;
                const height = voiceState === "listening"
                  ? `${Math.max(20, 20 + audioLevel * 60 + Math.sin(Date.now() / 200 + i) * 15)}%`
                  : "20%";
                return (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full transition-all duration-75"
                    style={{
                      height,
                      animationDelay: `${delay}s`,
                      animation: voiceState === "listening"
                        ? `voiceWave 0.8s ease-in-out ${delay}s infinite alternate`
                        : "none",
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="mb-3 p-3 bg-gray-800/80 rounded-xl border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Comando reconocido:</p>
              <p className="text-sm text-white font-medium italic">&ldquo;{transcript}&rdquo;</p>
            </div>
          )}

          {/* Feedback Message */}
          {feedback && (
            <p className="text-sm text-gray-300 leading-relaxed">{feedback}</p>
          )}

          {/* Error Message */}
          {voiceState === "error" && errorMessage && (
            <div className="mt-3 p-3 bg-red-900/40 border border-red-700/50 rounded-xl">
              <p className="text-xs text-red-300 mb-1">Error:</p>
              <p className="text-sm text-red-200">{errorMessage}</p>
            </div>
          )}

          {/* Success Result */}
          {voiceState === "success" && result?.result && (
            <div className="mt-3 p-3 bg-green-900/40 border border-green-700/50 rounded-xl">
              <p className="text-xs text-green-300 mb-1">Resultado:</p>
              <p className="text-sm text-green-200">{result.result}</p>
              {result.entities && Object.keys(result.entities).length > 0 && (
                <div className="mt-2 pt-2 border-t border-green-800/50">
                  <p className="text-xs text-green-400 mb-1">Detalles:</p>
                  {Object.entries(result.entities)
                    .filter(([, v]) => v !== undefined)
                    .map(([k, v]) => (
                      <p key={k} className="text-xs text-green-300">
                        {k}: {String(v)}
                      </p>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Confirmation Required */}
          {voiceState === "confirming" && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="p-3 bg-orange-900/40 border border-orange-700/50 rounded-xl">
                <p className="text-xs text-orange-300 mb-1">Accion requiere confirmacion:</p>
                <p className="text-sm text-orange-200">
                  Este comando modifica datos. Confirma para continuar.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={confirmCommand}
                  className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Confirmar
                </button>
                <button
                  onClick={cancelCommand}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Security Badge */}
          <div className="mt-3 pt-2 border-t border-gray-800 flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                faceAuthenticated ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-[10px] text-gray-500">
              {faceAuthenticated
                ? "Autenticacion facial activa"
                : "Autenticacion facial requerida"}
            </span>
          </div>
        </div>
      )}

      {/* ── Floating Button ──────────────────────────────────────────────── */}
      <button
        onClick={
          voiceState === "idle" || voiceState === "error"
            ? startListening
            : stopListening
        }
        disabled={
          voiceState === "processing" ||
          voiceState === "executing" ||
          voiceState === "confirming"
        }
        className={`
          ${s.button} rounded-full flex items-center justify-center
          transition-all duration-300 shadow-2xl
          ${
            voiceState === "listening"
              ? "bg-red-600 hover:bg-red-500 animate-pulse shadow-red-500/40"
              : voiceState === "processing" || voiceState === "executing"
                ? "bg-yellow-600 cursor-wait shadow-yellow-500/40"
                : voiceState === "success"
                  ? "bg-green-600 hover:bg-green-500 shadow-green-500/40"
                  : voiceState === "error"
                    ? "bg-red-700 hover:bg-red-600 shadow-red-600/40"
                    : voiceState === "confirming"
                      ? "bg-orange-600 cursor-default shadow-orange-500/40"
                      : faceAuthenticated
                        ? "bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/40 hover:scale-110"
                        : "bg-gray-600 cursor-not-allowed shadow-gray-500/40"
          }
          ${voiceState === "idle" && faceAuthenticated ? "hover:shadow-xl" : ""}
        `}
        title={
          !faceAuthenticated
            ? "Autenticacion facial requerida"
            : voiceState === "listening"
              ? "Detener"
              : voiceState === "idle"
                ? "Activar JARVIS (manten presionado)"
                : "JARVIS"
        }
        aria-label={
          voiceState === "listening" ? "Detener escucha" : "Activar JARVIS"
        }
      >
        {/* Microphone Icon */}
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          {voiceState === "listening" ? (
            // Stop icon when listening
            <>
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </>
          ) : voiceState === "processing" || voiceState === "executing" ? (
            // Loading spinner
            <>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 12 12"
                  to="360 12 12"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </>
          ) : voiceState === "success" ? (
            // Checkmark
            <>
              <path d="M20 6L9 17l-5-5" />
            </>
          ) : voiceState === "error" ? (
            // X icon
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            // Microphone icon
            <>
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </>
          )}
        </svg>
      </button>

      {/* ── Pulse Ring Animation (listening) ───────────────────────────── */}
      {voiceState === "listening" && (
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 rounded-full bg-red-500/30 animate-ping"
            style={{ animationDuration: "1.5s" }}
          />
        </div>
      )}
    </div>
  );
}
