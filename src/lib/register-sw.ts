import { logger } from "./logger";

// Registro del Service Worker para MADSJEEZ PWA
// Se debe llamar desde un Client Component en el layout raiz
// Ejemplo de uso en layout.tsx:
//   import { registerServiceWorker } from "@/lib/register-sw";
//   useEffect(() => { registerServiceWorker(); }, []);

/**
 * Registra el Service Worker del PWA.
 * Detecta automaticamente nuevas versiones y notifica via CustomEvent.
 *
 * El evento "sw-update-available" se dispara cuando hay una nueva
 * version del Service Worker lista para activar. El UI puede escuchar
 * este evento para mostrar un toast/banner de "Actualizar app".
 *
 * @example
 * ```tsx
 * // En un componente cliente del layout:
 * useEffect(() => {
 *   registerServiceWorker();
 * }, []);
 * ```
 */
export function registerServiceWorker(): void {
  // Evitar ejecucion en SSR
  if (typeof window === "undefined") return;

  // Verificar soporte de Service Workers
  if (!("serviceWorker" in navigator)) {
    console.warn("[MADSJEEZ PWA] Service Workers no soportados en este navegador.");
    return;
  }

  // Registrar despues de que la pagina haya cargado completamente
  // para no competir por ancho de banda con el contenido critico
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        logger.info("[MADSJEEZ PWA] Service Worker registrado:", registration.scope);

        // ──────────────────────────────────────────────
        // DETECCION DE NUEVAS VERSIONES
        // Cuando el Service Worker se actualiza, se dispara
        // el evento para que el UI pueda notificar al usuario
        // ──────────────────────────────────────────────
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            // "installed" + controller existente = nueva version lista
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              logger.info(
                "[MADSJEEZ PWA] Nueva version disponible. " +
                  "Recarga la pagina para actualizar."
              );

              // Disparar evento global para que el UI lo capture
              window.dispatchEvent(
                new CustomEvent("sw-update-available", {
                  detail: { registration },
                })
              );
            }
          });
        });
      })
      .catch((error) => {
        console.error(
          "[MADSJEEZ PWA] Error registrando Service Worker:",
          error
        );
      });
  });
}

/**
 * Fuerza la activacion inmediata de un Service Worker en espera.
 * Util cuando el usuario hace click en "Actualizar ahora".
 */
export async function skipWaitingAndReload(): Promise<void> {
  if (typeof window === "undefined") return;

  const registration = await navigator.serviceWorker.ready;
  const waitingWorker = registration.waiting;

  if (waitingWorker) {
    // Enviar mensaje al SW para que active skipWaiting
    waitingWorker.postMessage({ type: "SKIP_WAITING" });

    // Recargar cuando el nuevo SW tome control
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }
}

/**
 * Desregistra todos los Service Workers activos.
 * Util para debugging o para usuarios que quieran resetear el cache.
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (typeof window === "undefined") return;

  if (!("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      const result = await registration.unregister();
      if (result) {
        logger.info("[MADSJEEZ PWA] Service Worker desregistrado:", registration.scope);
      }
    }

    // Limpiar todos los caches
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      logger.info("[MADSJEEZ PWA] Todos los caches limpiados:", cacheNames);
    }
  } catch (error) {
    console.error("[MADSJEEZ PWA] Error desregistrando Service Worker:", error);
  }
}

/**
 * Obtiene informacion sobre el estado actual del Service Worker
 * y los caches. Util para debugging o panel de diagnostico.
 */
export async function getServiceWorkerStatus(): Promise<{
  registered: boolean;
  controller: string | null;
  caches: string[];
  updateAvailable: boolean;
}> {
  if (typeof window === "undefined") {
    return {
      registered: false,
      controller: null,
      caches: [],
      updateAvailable: false,
    };
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  const cacheNames = "caches" in window ? await caches.keys() : [];

  return {
    registered: registrations.length > 0,
    controller: navigator.serviceWorker.controller?.scriptURL || null,
    caches: cacheNames,
    updateAvailable: registrations.some((r) => r.waiting !== null),
  };
}
