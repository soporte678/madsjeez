"use client"

import { useState } from "react"
import { useNotifications } from "@/hooks/useNotifications"
import { Button } from "@/components/ui/button"
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Loader2,
  ShoppingCart,
  MessageCircle,
  AlertCircle,
  Tag,
  Info,
  X
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

const iconMap: Record<string, React.ReactNode> = {
  order: <ShoppingCart className="w-4 h-4" />,
  question: <MessageCircle className="w-4 h-4" />,
  claim: <AlertCircle className="w-4 h-4" />,
  message: <MessageCircle className="w-4 h-4" />,
  promotion: <Tag className="w-4 h-4" />,
  default: <Info className="w-4 h-4" />
}

const colorMap: Record<string, string> = {
  order: "bg-blue-100 text-blue-600",
  question: "bg-purple-100 text-purple-600",
  claim: "bg-red-100 text-red-600",
  message: "bg-green-100 text-green-600",
  promotion: "bg-primary/10 text-primary",
  default: "bg-gray-100 text-gray-600"
}

export function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useNotifications()
  
  const [isOpen, setIsOpen] = useState(false)

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    
    // Navegar según el tipo
    let url = "/dashboard"
    switch (notification.type) {
      case "order":
        url = `/orders/${notification.resourceId}`
        break
      case "question":
        url = "/dashboard"
        break
      case "claim":
        url = `/claims/${notification.resourceId}`
        break
      case "message":
        url = `/messages/${notification.resourceId}`
        break
    }
    
    setIsOpen(false)
    window.location.href = url
  }

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-[500px] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-semibold">Notificaciones</h4>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => markAllAsRead()}
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Todas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[400px]">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No tienes notificaciones</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification: any) => {
                    const Icon = iconMap[notification.type] || iconMap.default
                    const colorClass = colorMap[notification.type] || colorMap.default
                    
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.isRead ? "bg-blue-50/50" : ""
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                            {Icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                  locale: es
                                })}
                              </span>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-3 border-t text-center">
              <Link 
                href="/notifications" 
                className="text-sm text-blue-600 hover:underline"
                onClick={() => setIsOpen(false)}
              >
                Ver todas las notificaciones
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
