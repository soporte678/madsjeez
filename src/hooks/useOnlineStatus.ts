/**
 * Hook useOnlineStatus
 *
 * Detecta y reporta el estado de conexion a internet del usuario.
 * Se suscribe a los eventos nativos "online" y "offline" del navegador.
 *
 * Casos de uso tipicos:
 *   - Mostrar/ocultar un banner de "Sin conexion" en el layout
 *   - Deshabilitar botones que requieren conexion (comprar, pagar, etc.)
 *   - Mostrar cache local cuando se esta offline
 *   - Sincronizar datos cuando se vuelve online
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isOnline = useOnlineStatus();
 *
 *   return (
 *     <div>
 *       {!isOnline && (
 *         <Banner type="warning">
 *           Estas offline. Algunas funciones pueden no estar disponibles.
 *         </Banner>
 *       )}
 *       <button disabled={!isOnline}>
 *         Comprar ahora
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from "react";

/**
 * Estado extendido de conectividad que incluye informacion adicional
 * sobre la calidad de la conexion.
 */
interface OnlineStatusState {
  /** true si el navegador detecta conexion */
  isOnline: boolean;
  /** Tipo de conexion (wifi, 4g, 3g, etc.) - disponible en browsers modernos */
  connectionType: string | null;
  /** Velocidad estimada en Mbps (downlink) - disponible en browsers modernos */
  downlink: number | null;
  /** Si la conexion se considera lenta (2g, slow-2g) */
  isSlowConnection: boolean;
}

/**
 * Hook que monitorea el estado de conexion a internet.
 *
 * @returns OnlineStatusState con informacion completa de conectividad
 */
export function useOnlineStatus(): OnlineStatusState {
  const [status, setStatus] = useState<OnlineStatusState>({
    isOnline: true,
    connectionType: null,
    downlink: null,
    isSlowConnection: false,
  });

  /**
   * Obtiene informacion del Network Information API si esta disponible.
   * Este API proporciona detalles sobre el tipo y calidad de conexion.
   */
  const getConnectionInfo = useCallback(() => {
    // @ts-expect-error - Network Information API no esta estandarizado aun
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (!connection) {
      return {
        connectionType: null,
        downlink: null,
        isSlowConnection: false,
      };
    }

    return {
      connectionType: connection.effectiveType || null,
      downlink: connection.downlink || null,
      isSlowConnection: ["slow-2g", "2g"].includes(connection.effectiveType),
    };
  }, []);

  useEffect(() => {
    // Establecer estado inicial
    setStatus((prev) => ({
      ...prev,
      isOnline: navigator.onLine,
      ...getConnectionInfo(),
    }));

    /**
     * Handler cuando el navegador detecta que hay conexion.
     * Nota: navigator.onLine solo verifica acceso a la red local,
     * no garantiza acceso a internet. Para verificacion real,
     * se recomienda hacer un ping a un endpoint.
     */
    const handleOnline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: true,
        ...getConnectionInfo(),
      }));
    };

    /**
     * Handler cuando el navegador detecta que no hay conexion.
     */
    const handleOffline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
        ...getConnectionInfo(),
      }));
    };

    /**
     * Handler para cambios en la calidad de la conexion
     * (disponible solo en browsers con Network Information API).
     */
    const handleConnectionChange = () => {
      setStatus((prev) => ({
        ...prev,
        ...getConnectionInfo(),
      }));
    };

    // Suscribirse a eventos de conectividad
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // @ts-expect-error - Network Information API no esta estandarizado
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener("change", handleConnectionChange);
    }

    // Cleanup al desmontar
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (connection) {
        connection.removeEventListener("change", handleConnectionChange);
      }
    };
  }, [getConnectionInfo]);

  return status;
}

/**
 * Version simplificada del hook que solo devuelve un booleano.
 * Util cuando solo se necesita saber si hay conexion o no.
 *
 * @returns true si hay conexion, false si no
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
