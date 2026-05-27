"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar si ya esta instalada
    if (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostrar prompt despues de 30 segundos
      setTimeout(() => setShowPrompt(true), 30000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 lg:hidden">
      <div className="bg-card border border-border rounded-2xl shadow-lg p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
        <div className="w-10 h-10 bg-gradient-to-br from-[#0A1B5A] to-[#4A5B8C] rounded-xl flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">MJ</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Instala Madsjeez</p>
          <p className="text-xs text-muted-foreground">Accede mas rapido desde tu pantalla de inicio</p>
        </div>
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 bg-gradient-to-r from-[#0A1B5A] to-[#4A5B8C] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 shadow-sm"
        >
          <Download size={14} />
          Instalar
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0 rounded-lg hover:bg-muted"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
