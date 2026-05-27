"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellOff, Loader2 } from "lucide-react";

interface PushNotificationToggleProps {
  userId?: string;
}

/**
 * Componente para activar/desactivar notificaciones push.
 * Usar en la pagina de configuracion o perfil del usuario.
 *
 * Ejemplo:
 * <PushNotificationToggle userId={session?.user?.id} />
 */
export function PushNotificationToggle({ userId }: PushNotificationToggleProps) {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications(userId);

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <BellOff className="h-4 w-4" />
        <span>Tu navegador no soporta notificaciones push</span>
      </div>
    );
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        isSubscribed
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
      } disabled:opacity-50`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      {isLoading
        ? "Procesando..."
        : isSubscribed
        ? "Notificaciones activadas"
        : "Activar notificaciones"}
    </button>
  );
}
