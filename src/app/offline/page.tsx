/**
 * Pagina Offline de MADSJEEZ Marketplace
 *
 * Se muestra automaticamente cuando el usuario no tiene conexion
 * a internet y el Service Worker no puede servir contenido cacheado.
 *
 * Incluye:
 *   - Mensaje claro de estado sin conexion
 *   - Boton de reintentar conexion
 *   - Link de navegacion a la pagina de inicio
 *   - Lista de funciones disponibles offline (si hay cache previo)
 *
 * Route: /offline
 */

"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw, Home, ShoppingBag, Search, Heart } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [cachedFeatures, setCachedFeatures] = useState<string[]>([]);

  // Verificar que caches tenemos disponibles para mostrar
  // funciones accesibles offline
  useEffect(() => {
    async function checkAvailableCaches() {
      if (!("caches" in window)) return;

      try {
        const cacheNames = await caches.keys();
        const features: string[] = [];

        if (cacheNames.some((name) => name.includes("product-images"))) {
          features.push("Imagenes de productos");
        }
        if (cacheNames.some((name) => name.includes("api-cache"))) {
          features.push("Catalogo de productos");
          features.push("Categorias");
        }
        if (cacheNames.some((name) => name.includes("external-images"))) {
          features.push("Imagenes de marcas");
        }

        setCachedFeatures(features);
      } catch {
        // Silenciar errores de cache check
      }
    }

    checkAvailableCaches();
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    // Intentar recargar la pagina
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      {/* Icono de sin conexion */}
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 animate-pulse">
        <WifiOff size={40} className="text-muted-foreground" />
      </div>

      {/* Titulo */}
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Sin conexion
      </h1>

      {/* Descripcion */}
      <p className="text-muted-foreground text-center max-w-sm mb-8">
        Parece que no tenes conexion a internet. Algunas funciones pueden no estar disponibles.
      </p>

      {/* Funciones disponibles offline (si hay cache previo) */}
      {cachedFeatures.length > 0 && (
        <div className="w-full max-w-xs mb-8 bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-semibold text-foreground mb-3">
            Disponible offline:
          </p>
          <ul className="space-y-2">
            {cachedFeatures.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Botones de accion */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {/* Boton reintentar */}
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            size={18}
            className={isRetrying ? "animate-spin" : ""}
          />
          {isRetrying ? "Reintentando..." : "Reintentar conexion"}
        </button>

        {/* Link al inicio */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 border border-border px-6 py-3 rounded-md font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <Home size={18} />
          Ir al inicio
        </Link>

        {/* Links rapidos a secciones populares (solo visuales, pueden no funcionar offline) */}
        <div className="flex gap-2 mt-2">
          <Link
            href="/catalog"
            className="flex-1 flex items-center justify-center gap-1.5 border border-border px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <ShoppingBag size={14} />
            Catalogo
          </Link>
          <Link
            href="/search"
            className="flex-1 flex items-center justify-center gap-1.5 border border-border px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Search size={14} />
            Buscar
          </Link>
          <Link
            href="/favorites"
            className="flex-1 flex items-center justify-center gap-1.5 border border-border px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Heart size={14} />
            Favoritos
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground mt-8">
        Madsjeez Marketplace
      </p>
    </div>
  );
}
