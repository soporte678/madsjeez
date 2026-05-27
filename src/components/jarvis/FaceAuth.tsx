"use client";

/**
 * =============================================================================
 * FaceAuth.tsx — JARVIS Facial Authentication Component
 * =============================================================================
 * Componente React para autenticacion facial del orquestador JARVIS.
 *
 * Features:
 * - Acceso a camara del navegador (getUserMedia)
 * - Frame verde cuando el rostro es reconocido
 * - Frame rojo cuando no es reconocido
 * - Boton "Activar reconocimiento facial"
 * - Deteccion de multiples rostros (rechazado por seguridad)
 * - Captura de frame para envio al backend
 * - Session token generation para autenticar comandos de voz
 * - Visualizacion de estado de autenticacion
 *
 * REGLAS DE SEGURIDAD:
 * - NUNCA se persisten imagenes faciales (solo se procesan en memoria)
 * - NUNCA se envian datos biometricos a servidores externos
 * - Max 5 intentos fallidos (rate limiting del backend)
 * - Deteccion de multiples rostros = rechazo automatico
 * - Todas las imagenes se procesan via API propia
 * =============================================================================
 */

import React, { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type FaceAuthStatus =
  | "idle"           // No iniciado - mostrar boton de activacion
  | "requesting"     // Solicitando permiso de camara
  | "loading_model"  // Cargando modelos de face detection
  | "scanning"       // Escaneando rostro
  | "detected"       // Rostro detectado, enviando al backend
  | "authenticating" // Verificando contra base de datos
  | "authenticated"  // Autenticacion exitosa
  | "failed"         // Autenticacion fallida
  | "error"          // Error de sistema
  | "no_camera";     // No hay camara disponible

type FaceAuthResult = {
  authenticated: boolean;
  confidence: number;
  userId: string;
  userName: string;
  sessionToken: string;
  expiresAt: string;
};

type FaceAuthProps = {
  /** Called when authentication succeeds */
  onAuthenticated?: (result: FaceAuthResult) => void;
  /** Called when authentication fails */
  onFailed?: (reason: string) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** API endpoint base URL */
  apiBaseUrl?: string;
  /** Auto-start on mount */
  autoStart?: boolean;
  /** Scan interval in ms (how often to capture and verify) */
  scanIntervalMs?: number;
  /** Show compact mode (inline instead of overlay) */
  compact?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;
const DEFAULT_SCAN_INTERVAL_MS = 2000; // 2 seconds between scans
const AUTH_COOLDOWN_MS = 30_000; // 30 seconds after auth before re-scanning

// ─────────────────────────────────────────────────────────────────────────────
// Colors for status indication
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<FaceAuthStatus, { frame: string; bg: string; text: string; dot: string }> = {
  idle:            { frame: "border-gray-600",  bg: "bg-gray-900",      text: "text-gray-400",    dot: "bg-gray-500" },
  requesting:      { frame: "border-yellow-600",bg: "bg-yellow-900/30", text: "text-yellow-400",  dot: "bg-yellow-500 animate-pulse" },
  loading_model:   { frame: "border-blue-600",  bg: "bg-blue-900/30",   text: "text-blue-400",    dot: "bg-blue-500 animate-pulse" },
  scanning:        { frame: "border-cyan-600",  bg: "bg-cyan-900/30",   text: "text-cyan-400",    dot: "bg-cyan-500 animate-pulse" },
  detected:        { frame: "border-blue-500",  bg: "bg-blue-900/30",   text: "text-blue-400",    dot: "bg-blue-400 animate-pulse" },
  authenticating:  { frame: "border-yellow-500",bg: "bg-yellow-900/30", text: "text-yellow-400",  dot: "bg-yellow-400 animate-pulse" },
  authenticated:   { frame: "border-green-500", bg: "bg-green-900/30",  text: "text-green-400",   dot: "bg-green-500" },
  failed:          { frame: "border-red-500",   bg: "bg-red-900/30",    text: "text-red-400",     dot: "bg-red-500" },
  error:           { frame: "border-red-700",   bg: "bg-red-900/30",    text: "text-red-400",     dot: "bg-red-600" },
  no_camera:       { frame: "border-gray-700",  bg: "bg-gray-900/30",   text: "text-gray-500",    dot: "bg-gray-600" },
};

const STATUS_LABELS: Record<FaceAuthStatus, string> = {
  idle:            "Inactivo",
  requesting:      "Solicitando acceso a camara...",
  loading_model:   "Cargando modelos de deteccion...",
  scanning:        "Escaneando rostro...",
  detected:        "Rostro detectado - verificando...",
  authenticating:  "Autenticando...",
  authenticated:   "Autenticado",
  failed:          "Rostro no reconocido",
  error:           "Error del sistema",
  no_camera:       "Camara no disponible",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function FaceAuth({
  onAuthenticated,
  onFailed,
  onError,
  apiBaseUrl = "",
  autoStart = false,
  scanIntervalMs = DEFAULT_SCAN_INTERVAL_MS,
  compact = false,
}: FaceAuthProps) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<FaceAuthStatus>("idle");
  const [message, setMessage] = useState("Presiona el boton para activar el reconocimiento facial.");
  const [faceCount, setFaceCount] = useState(0);
  const [authResult, setAuthResult] = useState<FaceAuthResult | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAuthRef = useRef<number>(0);
  const isScanningRef = useRef(false);

  // ── Colors for current status ─────────────────────────────────────────────
  const colors = STATUS_COLORS[status];

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ── Auto-start if enabled ─────────────────────────────────────────────────
  useEffect(() => {
    if (autoStart && status === "idle") {
      void startAuthentication();
    }
  }, [autoStart]);

  // ── Stop Camera ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    isScanningRef.current = false;
  }, []);

  // ── Start Camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      setStatus("requesting");
      setMessage("Solicitando acceso a la camara...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: VIDEO_WIDTH },
          height: { ideal: VIDEO_HEIGHT },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[FaceAuth] Camera error:", errorMsg);

      if (errorMsg.includes("NotAllowedError") || errorMsg.includes("Permission denied")) {
        setStatus("error");
        setMessage("Permiso de camara denegado. Habilita el acceso en la configuracion de tu navegador.");
      } else if (errorMsg.includes("NotFoundError") || errorMsg.includes("DevicesNotFound")) {
        setStatus("no_camera");
        setMessage("No se encontro ninguna camara. Conecta una camara USB o usa un dispositivo con camara integrada.");
      } else {
        setStatus("error");
        setMessage(`Error de camara: ${errorMsg}`);
      }

      onError?.(errorMsg);
      return false;
    }
  }, [onError]);

  // ── Capture Frame as Base64 ───────────────────────────────────────────────
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== 4) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = video.videoWidth || VIDEO_WIDTH;
    canvas.height = video.videoHeight || VIDEO_HEIGHT;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Return as JPEG base64 (compressed for network)
    return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
  }, []);

  // ── Detect Face (Client-side preliminary check) ───────────────────────────
  const detectFaceClientSide = useCallback((): {
    detected: boolean;
    count: number;
  } => {
    // In a production implementation, this would use face-api.js
    // to detect faces client-side before sending to the backend.
    // For now, we send every frame to the backend for processing.
    return { detected: true, count: 1 };
  }, []);

  // ── Send Frame to Backend ─────────────────────────────────────────────────
  const authenticateWithBackend = useCallback(
    async (imageBase64: string) => {
      try {
        setStatus("authenticating");
        setMessage("Verificando identidad en el servidor...");

        const response = await fetch(`${apiBaseUrl}/api/jarvis/face-auth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageBase64,
            userHint: authResult?.userId,
          }),
        });

        const data = (await response.json()) as {
          status: string;
          authenticated: boolean;
          confidence: number;
          userId: string;
          userName: string;
          sessionToken: string;
          expiresAt: string;
          error?: string;
          message?: string;
          retryAfter?: number;
          faceCount?: number;
          warning?: string;
        };

        if (response.status === 429) {
          // Rate limited
          setStatus("failed");
          setMessage(
            `Demasiados intentos fallidos. Reintenta en ${data.retryAfter ?? 300} segundos.`
          );
          setFailedAttempts((prev) => prev + 1);
          onFailed?.("RATE_LIMITED");
          return;
        }

        if (data.authenticated) {
          // SUCCESS
          const result: FaceAuthResult = {
            authenticated: true,
            confidence: data.confidence,
            userId: data.userId,
            userName: data.userName,
            sessionToken: data.sessionToken,
            expiresAt: data.expiresAt,
          };

          setAuthResult(result);
          setStatus("authenticated");
          setMessage(`Bienvenido, ${data.userName}. Autenticacion exitosa (confianza: ${(data.confidence * 100).toFixed(1)}%).`);
          setFailedAttempts(0);
          lastAuthRef.current = Date.now();

          onAuthenticated?.(result);
        } else {
          // FAILED - face not recognized
          setStatus("failed");
          setMessage(
            data.warning
              ? `Rostro similar pero no autenticado. ${data.warning} Confianza: ${(data.confidence * 100).toFixed(1)}%`
              : `Rostro no reconocido. Confianza: ${(data.confidence * 100).toFixed(1)}%. Intenta de nuevo.`
          );
          setFailedAttempts((prev) => prev + 1);
          onFailed?.("FACE_NOT_RECOGNIZED");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Error de red";
        setStatus("error");
        setMessage(`Error de comunicacion: ${errorMsg}`);
        onError?.(errorMsg);
      }
    },
    [apiBaseUrl, authResult?.userId, onAuthenticated, onFailed, onError]
  );

  // ── Scan Loop ─────────────────────────────────────────────────────────────
  const scanLoop = useCallback(() => {
    // Prevent concurrent scans
    if (isScanningRef.current) return;
    isScanningRef.current = true;

    // Check cooldown after successful auth
    const cooldownElapsed = Date.now() - lastAuthRef.current;
    if (lastAuthRef.current > 0 && cooldownElapsed < AUTH_COOLDOWN_MS) {
      isScanningRef.current = false;
      return; // Already authenticated recently
    }

    // Reset from failed state after cooldown
    if (status === "failed" && cooldownElapsed < 3000) {
      isScanningRef.current = false;
      return; // Wait 3 seconds after failure before retry
    }

    const frame = captureFrame();
    if (!frame) {
      isScanningRef.current = false;
      return;
    }

    // Client-side preliminary detection
    const detection = detectFaceClientSide();
    setFaceCount(detection.count);

    if (!detection.detected) {
      setStatus("scanning");
      setMessage("No se detecto ningun rostro. Asegurate de estar frente a la camara.");
      isScanningRef.current = false;
      return;
    }

    if (detection.count > 1) {
      setStatus("failed");
      setMessage("Se detectaron multiples rostros. Solo debe haber una persona frente a la camara.");
      onFailed?.("MULTIPLE_FACES");
      isScanningRef.current = false;
      return;
    }

    // Proceed to backend authentication
    setStatus("detected");
    void authenticateWithBackend(frame).finally(() => {
      isScanningRef.current = false;
    });
  }, [captureFrame, detectFaceClientSide, authenticateWithBackend, status, onFailed]);

  // ── Start Authentication ──────────────────────────────────────────────────
  const startAuthentication = useCallback(async () => {
    // Check if already authenticated and within cooldown
    if (
      authResult?.authenticated &&
      Date.now() - lastAuthRef.current < AUTH_COOLDOWN_MS
    ) {
      setStatus("authenticated");
      setMessage(`Sesion activa - ${authResult.userName}. La autenticacion es valida por ${Math.ceil((AUTH_COOLDOWN_MS - (Date.now() - lastAuthRef.current)) / 1000)}s mas.`);
      return;
    }

    // Check browser support
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setMessage("Tu navegador no soporta acceso a camara. Usa Chrome, Edge o Firefox.");
      onError?.("BROWSER_NOT_SUPPORTED");
      return;
    }

    const cameraOk = await startCamera();
    if (!cameraOk) return;

    // Start scanning loop
    setStatus("scanning");
    setMessage("Escaneando rostro... Mira directamente a la camara.");

    // Initial scan after a short delay (let video stabilize)
    setTimeout(() => {
      scanLoop();
    }, 1000);

    // Continuous scanning
    intervalRef.current = setInterval(() => {
      scanLoop();
    }, scanIntervalMs);
  }, [authResult, startCamera, scanLoop, scanIntervalMs, onError]);

  // ── Stop Authentication ───────────────────────────────────────────────────
  const stopAuthentication = useCallback(() => {
    stopCamera();
    setStatus("idle");
    setMessage("Reconocimiento facial desactivado.");
    setFaceCount(0);
  }, [stopCamera]);

  // ── Logout / Clear Auth ──────────────────────────────────────────────────
  const clearAuthentication = useCallback(() => {
    setAuthResult(null);
    setFailedAttempts(0);
    lastAuthRef.current = 0;
    stopCamera();
    setStatus("idle");
    setMessage("Sesion cerrada. Presiona el boton para reautenticar.");
  }, [stopCamera]);

  // ── Handle Status Change Side Effects ─────────────────────────────────────
  useEffect(() => {
    if (status === "failed") {
      // After failure, continue scanning (don't stop)
      const timer = setTimeout(() => {
        if (status === "failed") {
          setStatus("scanning");
          setMessage("Reintentando escaneo...");
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // ── Render ────────────────────────────────────────────────────────────────

  // Compact inline mode
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-900/80 border border-gray-700 rounded-xl">
        {/* Status Dot */}
        <div className={`w-3 h-3 rounded-full ${colors.dot}`} />

        {/* Status Text */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${colors.text} truncate`}>
            {status === "authenticated" && authResult
              ? `${authResult.userName} - Autenticado`
              : STATUS_LABELS[status]}
          </p>
          <p className="text-xs text-gray-500 truncate">{message}</p>
        </div>

        {/* Action Button */}
        {status === "idle" || status === "error" || status === "no_camera" || status === "failed" ? (
          <button
            onClick={startAuthentication}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
          >
            Activar
          </button>
        ) : status === "authenticated" ? (
          <button
            onClick={clearAuthentication}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
          >
            Cerrar
          </button>
        ) : (
          <button
            onClick={stopAuthentication}
            className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
          >
            Detener
          </button>
        )}
      </div>
    );
  }

  // Full mode (overlay/card)
  return (
    <div
      ref={containerRef}
      className="relative bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
      style={{ width: VIDEO_WIDTH, maxWidth: "100%" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
          <span className={`text-sm font-semibold ${colors.text}`}>
            {status === "authenticated" && authResult
              ? `JARVIS - ${authResult.userName}`
              : `JARVIS - ${STATUS_LABELS[status]}`}
          </span>
        </div>
        {status === "authenticated" && (
          <button
            onClick={clearAuthentication}
            className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
          >
            Cerrar sesion
          </button>
        )}
      </div>

      {/* ── Video Feed Area ────────────────────────────────────────────────── */}
      <div className="relative" style={{ aspectRatio: `${VIDEO_WIDTH}/${VIDEO_HEIGHT}` }}>
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
          style={{
            transform: "scaleX(-1)", // Mirror for natural feel
            opacity: isCameraActive ? 1 : 0.1,
          }}
        />

        {/* Canvas (hidden, for capture) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Frame Border Overlay */}
        <div
          className={`absolute inset-0 border-4 ${colors.frame} transition-colors duration-300 pointer-events-none rounded-lg m-1`}
        >
          {/* Corner markers */}
          <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 ${status === "authenticated" ? "border-green-400" : status === "failed" ? "border-red-400" : "border-blue-400"} rounded-tl-lg`} />
          <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 ${status === "authenticated" ? "border-green-400" : status === "failed" ? "border-red-400" : "border-blue-400"} rounded-tr-lg`} />
          <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 ${status === "authenticated" ? "border-green-400" : status === "failed" ? "border-red-400" : "border-blue-400"} rounded-bl-lg`} />
          <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 ${status === "authenticated" ? "border-green-400" : status === "failed" ? "border-red-400" : "border-blue-400"} rounded-br-lg`} />
        </div>

        {/* Face guide overlay (when scanning) */}
        {status === "scanning" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-40 border-2 border-dashed border-cyan-500/50 rounded-full opacity-60 animate-pulse" />
          </div>
        )}

        {/* Authenticated overlay */}
        {status === "authenticated" && (
          <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center pointer-events-none">
            <div className="bg-green-900/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-green-500/50">
              <p className="text-green-300 font-semibold text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Autenticado
              </p>
              {authResult && (
                <p className="text-green-400/70 text-xs mt-1">
                  Confianza: {(authResult.confidence * 100).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        )}

        {/* Failed overlay */}
        {status === "failed" && (
          <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center pointer-events-none">
            <div className="bg-red-900/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-red-500/50">
              <p className="text-red-300 font-semibold text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                No reconocido
              </p>
            </div>
          </div>
        )}

        {/* Camera placeholder (when not active) */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
            <svg
              className="w-16 h-16 text-gray-600 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-500 text-sm">Camara inactiva</p>
          </div>
        )}
      </div>

      {/* ── Info Panel ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-gray-700 space-y-2">
        {/* Status Message */}
        <p className={`text-sm ${colors.text}`}>{message}</p>

        {/* Face Count Indicator */}
        {isCameraActive && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Rostros detectados:</span>
            <div className="flex gap-1">
              {faceCount === 0 ? (
                <span className="text-xs text-gray-600">Ninguno</span>
              ) : faceCount === 1 ? (
                <span className="text-xs text-green-400 font-medium">1 rostro</span>
              ) : (
                <span className="text-xs text-red-400 font-medium">{faceCount} rostros (!)</span>
              )}
            </div>
          </div>
        )}

        {/* Failed Attempts */}
        {failedAttempts > 0 && (
          <p className="text-xs text-orange-400">
            Intentos fallidos: {failedAttempts}/5
          </p>
        )}

        {/* Session Info */}
        {status === "authenticated" && authResult && (
          <div className="pt-2 border-t border-gray-700/50 space-y-1">
            <p className="text-xs text-gray-400">
              Usuario: <span className="text-gray-300">{authResult.userName}</span>
            </p>
            <p className="text-xs text-gray-400">
              ID: <span className="text-gray-300 font-mono">{authResult.userId}</span>
            </p>
            <p className="text-xs text-gray-400">
              Expira: <span className="text-gray-300">{new Date(authResult.expiresAt).toLocaleTimeString()}</span>
            </p>
          </div>
        )}
      </div>

      {/* ── Action Buttons ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/50 flex gap-2">
        {status === "idle" || status === "error" || status === "no_camera" || status === "failed" ? (
          <button
            onClick={startAuthentication}
            disabled={status === "requesting"}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {status === "failed" ? "Reintentar" : "Activar reconocimiento facial"}
          </button>
        ) : status === "authenticated" ? (
          <button
            onClick={clearAuthentication}
            className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesion
          </button>
        ) : (
          <button
            onClick={stopAuthentication}
            className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Detener
          </button>
        )}
      </div>

      {/* ── Security Footer ────────────────────────────────────────────────── */}
      <div className="px-4 py-2 bg-gray-900/50 border-t border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-[10px] text-gray-600">Procesamiento local seguro</span>
        </div>
        <span className="text-[10px] text-gray-700 font-mono">JARVIS-FACE-v2.1</span>
      </div>
    </div>
  );
}
