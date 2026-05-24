"use client";

import { useCallback, useRef, useState } from "react";

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function browserSpeechHint(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/Firefox\//.test(ua)) {
    return "Firefox no soporta Web Speech API. Usá Chrome o Edge.";
  }
  if (!getSpeechRecognition()) {
    return "Este navegador no tiene reconocimiento de voz. Usá Chrome o Edge.";
  }
  return "Micrófono no disponible.";
}

export function useAtlasSpeech(options: { onFinalTranscript: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [micReady, setMicReady] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalRef = useRef("");
  const listeningRef = useRef(false);
  const onFinalRef = useRef(options.onFinalTranscript);
  onFinalRef.current = options.onFinalTranscript;

  const SpeechRecognition = getSpeechRecognition();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const supported =
    Boolean(SpeechRecognition) &&
    (/Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua) || /Edg\//.test(ua));

  const ensureMic = useCallback(async () => {
    if (micReady) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicReady(true);
      return true;
    } catch {
      setError("Permiso de micrófono denegado.");
      return false;
    }
  }, [micReady]);

  const stop = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const start = useCallback(async () => {
    if (!SpeechRecognition || listeningRef.current) return false;
    setError("");
    setInterim("");
    if (!(await ensureMic())) return false;

    finalRef.current = "";
    const recognition = new SpeechRecognition();
    recognition.lang = "es-AR";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      listeningRef.current = true;
      setListening(true);
    };

    recognition.onresult = (ev) => {
      let chunk = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finalRef.current += t + " ";
        else chunk += t;
      }
      setInterim((finalRef.current + chunk).trim());
    };

    recognition.onerror = (ev) => {
      if (ev.error !== "aborted") setError(`Mic: ${ev.error}`);
    };

    recognition.onend = () => {
      listeningRef.current = false;
      setListening(false);
      recognitionRef.current = null;
      const text = finalRef.current.trim();
      finalRef.current = "";
      setInterim("");
      if (text) onFinalRef.current(text);
    };

    try {
      recognition.start();
      return true;
    } catch {
      return false;
    }
  }, [SpeechRecognition, ensureMic]);

  return {
    supported,
    supportHint: browserSpeechHint(),
    listening,
    interim,
    error,
    start,
    stop,
  };
}
