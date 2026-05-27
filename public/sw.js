/**
 * MADSJEEZ PWA - Service Worker
 * Maneja push notifications y caching basico
 */

const CACHE_NAME = "madsjeez-v1";

// Instalacion: precachear recursos esenciales
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/icons/icon-192x192.png",
        "/icons/icon-512x512.png",
      ]);
    })
  );
  self.skipWaiting();
});

// Activacion: limpiar caches antiguas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const title = data.title || "Madsjeez";
    const options = {
      body: data.body || "Tenes una nueva notificacion",
      icon: data.icon || "/icons/icon-192x192.png",
      badge: data.badge || "/icons/icon-72x72.png",
      tag: data.tag || `madsjeez-${Date.now()}`,
      data: data.data || { url: "/dashboard" },
      requireInteraction: data.requireInteraction ?? true,
      actions: data.actions || [
        { action: "open", title: "Ver" },
        { action: "close", title: "Cerrar" },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    // Fallback si el payload no es JSON valido
    event.waitUntil(
      self.registration.showNotification("Madsjeez", {
        body: event.data.text(),
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
      })
    );
  }
});

// ============================================
// CLICK EN NOTIFICACION
// ============================================

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const { action } = event;
  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || "/dashboard";

  // Accion "close": solo cerrar
  if (action === "close") {
    return;
  }

  // Accion "open" o click en la notificacion: abrir/focus la app
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Buscar si ya hay una ventana abierta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            // Navegar a la URL objetivo
            client.navigate(targetUrl);
            return;
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        self.clients.openWindow(targetUrl);
      })
  );
});

// ============================================
// FETCH (caching basico)
// ============================================

self.addEventListener("fetch", (event) => {
  // Estrategia: network-first para APIs, cache-first para assets estaticos
  if (event.request.url.includes("/api/")) {
    return; // No cachear APIs
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cachear respuestas exitosas de GET
        if (
          response.ok &&
          event.request.method === "GET" &&
          (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2)$/) ||
            event.request.destination === "image" ||
            event.request.destination === "style" ||
            event.request.destination === "script")
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback a cache si hay error de red
        return caches.match(event.request).then((cached) => {
          return cached || new Response("Offline", { status: 503 });
        });
      })
  );
});
