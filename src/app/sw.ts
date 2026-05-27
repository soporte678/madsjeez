// Service Worker para MADSJEEZ PWA
// Usa Serwist/Workbox para caching estrategico de assets, APIs y paginas
// Estrategias:
//   - Precache: documentos y assets del build (CacheFirst con fallback a network)
//   - Imagenes de productos (Supabase): CacheFirst - 30 dias, 200 entries
//   - APIs de productos/categorias: StaleWhileRevalidate - 5 minutos, 100 entries
//   - Imagenes externas (Unsplash, etc.): CacheFirst - 7 dias, 50 entries
//   - Fallback offline: pagina /offline cuando no hay conexion

import { defaultCache } from "@serwist/next/browser";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// Tipos para precache - el manifest se inyecta automaticamente en build time
// por el plugin de Serwist/Next.js PWA
declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  // Entries precacheadas automaticamente por Serwist en build time
  // Incluye todos los chunks de JS, CSS, y assets estaticos
  precacheEntries: self.__SW_MANIFEST,

  // Activacion inmediata sin esperar a que se cierren tabs antiguas
  skipWaiting: true,

  // Toma control de todos los clientes inmediatamente
  clientsClaim: true,

  // Habilita navigation preload para mejorar performance de navegacion
  navigationPreload: true,

  runtimeCaching: [
    // Cache por defecto de Serwist (JS, CSS, documentos, imagenes locales, fuentes)
    ...defaultCache,

    // ──────────────────────────────────────────────
    // CACHE DE IMAGENES DE PRODUCTOS (Supabase Storage)
    // Estrategia: CacheFirst
    //   - Intenta servir desde cache primero
    //   - Si no esta en cache, fetch a Supabase y guarda en cache
    //   - Ideal para imagenes que no cambian frecuentemente
    // ──────────────────────────────────────────────
    {
      matcher: ({ url }: { url: URL }) =>
        url.hostname.includes("supabase.co") &&
        (
          url.pathname.includes("/storage/") ||
          url.pathname.endsWith(".jpg") ||
          url.pathname.endsWith(".jpeg") ||
          url.pathname.endsWith(".png") ||
          url.pathname.endsWith(".webp") ||
          url.pathname.endsWith(".gif") ||
          url.pathname.endsWith(".avif")
        ),
      handler: "CacheFirst",
      options: {
        cacheName: "product-images",
        expiration: {
          maxEntries: 200,                      // Maximo 200 imagenes en cache
          maxAgeSeconds: 30 * 24 * 60 * 60,     // 30 dias
        },
        cacheableResponse: {
          statuses: [0, 200],                   // Cachea respuestas OK y opaque (CORS)
        },
      },
    },

    // ──────────────────────────────────────────────
    // CACHE DE APIS DE PRODUCTOS / CATEGORIAS / BUSQUEDA
    // Estrategia: StaleWhileRevalidate
    //   - Sirve inmediatamente desde cache (si existe)
    //   - En paralelo hace fetch para actualizar cache en background
    //   - La proxima visita tendra datos frescos
    //   - Ideal para APIs donde la frescura importa pero no es critica
    // ──────────────────────────────────────────────
    {
      matcher: ({ url }: { url: URL }) =>
        url.pathname.startsWith("/api/products") ||
        url.pathname.startsWith("/api/categories") ||
        url.pathname.startsWith("/api/search") ||
        url.pathname.startsWith("/api/catalog"),
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 100,                // Maximo 100 respuestas API en cache
          maxAgeSeconds: 5 * 60,          // 5 minutos de vida util
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
        backgroundSync: {
          name: "api-sync-queue",         // Cola de sincronizacion en background
          options: {
            maxRetentionTime: 24 * 60,    // Retiene requests por 24 horas
          },
        },
      },
    },

    // ──────────────────────────────────────────────
    // CACHE DE IMAGENES EXTERNAS (Unsplash, Flaticon, Google, etc.)
    // Estrategia: CacheFirst
    //   - Reduce llamadas a CDNs externos
    //   - Mejora performance en conexiones lentas
    //   - Permite visualizar imagenes en modo offline
    // ──────────────────────────────────────────────
    {
      matcher: ({ url }: { url: URL }) =>
        url.hostname === "images.unsplash.com" ||
        url.hostname === "cdn-icons-png.flaticon.com" ||
        url.hostname === "lh3.googleusercontent.com" ||
        url.hostname === "img.icons8.com" ||
        url.hostname.endsWith(".cloudfront.net"),
      handler: "CacheFirst",
      options: {
        cacheName: "external-images",
        expiration: {
          maxEntries: 50,                      // Maximo 50 imagenes externas
          maxAgeSeconds: 7 * 24 * 60 * 60,     // 7 dias
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },

    // ──────────────────────────────────────────────
    // CACHE DE FUENTES EXTERNAS (Google Fonts, etc.)
    // Estrategia: CacheFirst
    //   - Las fuentes casi nunca cambian
    //   - Cache permanente de 1 ano
    // ──────────────────────────────────────────────
    {
      matcher: ({ url }: { url: URL }) =>
        url.hostname === "fonts.googleapis.com" ||
        url.hostname === "fonts.gstatic.com",
      handler: "CacheFirst",
      options: {
        cacheName: "external-fonts",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60,  // 1 anio
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },

    // ──────────────────────────────────────────────
    // CACHE DE API DE PAGINAS ESTATICAS (ISR)
    // Estrategia: NetworkFirst
    //   - Intenta obtener datos frescos primero
    //   - Si falla la red, sirve desde cache
    //   - Ideal para contenido que puede cambiar
    // ──────────────────────────────────────────────
    {
      matcher: ({ url }: { url: URL }) =>
        url.pathname.startsWith("/api/pages") ||
        url.pathname.startsWith("/api/content"),
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-api-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60,  // 1 hora
        },
        networkTimeoutSeconds: 3,  // Timeout de red de 3 segundos
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],

  // ──────────────────────────────────────────────
  // FALLBACK OFFLINE
  // Cuando no hay conexion y no hay cache,
  // muestra la pagina /offline.html
  // ──────────────────────────────────────────────
  fallbacks: {
    entries: [
      {
        type: "document",
        url: "/offline",
        matcher: "/",
      },
      {
        type: "image",
        url: "/offline-placeholder.svg",
      },
    ],
  },
});

// Inicializa todos los event listeners del Service Worker
serwist.addEventListeners();

// ──────────────────────────────────────────────
// EVENTOS ADICIONALES DEL SERVICE WORKER
// ──────────────────────────────────────────────

// Escuchar mensajes desde el cliente (ej: "skipWaiting" forzado)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Log de instalacion
self.addEventListener("install", (event) => {
  console.log("[MADSJEEZ SW] Instalando Service Worker...");
});

// Log de activacion
self.addEventListener("activate", (event) => {
  console.log("[MADSJEEZ SW] Service Worker activado y controlando clientes.");
});
