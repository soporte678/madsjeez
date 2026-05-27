"use client";

import { useEffect } from "react";
import { InstallPrompt } from "./InstallPrompt";
import { BottomNav } from "./BottomNav";
import { IOSInstallBanner } from "./IOSInstallBanner";

function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] SW registrado:", registration.scope);

          // Escuchar actualizaciones del service worker
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // Nueva version disponible
                  window.dispatchEvent(new CustomEvent("sw-update-available"));
                }
              });
            }
          });
        })
        .catch((err) => {
          console.log("[PWA] SW registro fallo:", err);
        });
    });
  }
}

export function PWAProvider() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <>
      <InstallPrompt />
      <IOSInstallBanner />
      <BottomNav />
    </>
  );
}
