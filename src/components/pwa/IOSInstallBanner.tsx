"use client";

import { useState, useEffect } from "react";
import { X, Share2 } from "lucide-react";

export function IOSInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Solo iOS Safari que no esta instalada
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as unknown as Record<string, unknown>).standalone === true;
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    if (isIOS && !isStandalone && isSafari) {
      const dismissed = localStorage.getItem("ios-install-dismissed");
      const count = parseInt(localStorage.getItem("ios-install-count") || "0", 10);
      if (!dismissed && count < 3) {
        localStorage.setItem("ios-install-count", String(count + 1));
        setTimeout(() => setShow(true), 5000);
      }
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("ios-install-dismissed", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 lg:hidden">
      <div className="bg-card border border-border rounded-2xl shadow-lg p-4 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground mb-1">
              Agrega Madsjeez a tu pantalla de inicio
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Toca{" "}
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-muted border border-border mx-0.5 align-text-bottom">
                <Share2 size={11} />
              </span>{" "}
              y selecciona <span className="font-medium text-foreground">&quot;Agregar a pantalla de inicio&quot;</span>
            </p>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0 rounded-lg hover:bg-muted"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
