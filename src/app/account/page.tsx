"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  User, 
  ShoppingBag, 
  Heart, 
  Bell, 
  MapPin, 
  CreditCard, 
  Settings,
  ChevronRight,
  Package,
  MessageSquare,
  Store
} from "lucide-react"

export default function AccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    router.push("/auth/login")
    return null
  }

  const menuItems = [
    {
      icon: Package,
      title: "Mis compras",
      description: "Ver historial de compras y seguimiento",
      href: "/orders",
      color: "bg-blue-500"
    },
    {
      icon: Heart,
      title: "Favoritos",
      description: "Productos que te gustaron",
      href: "/favorites",
      color: "bg-red-500"
    },
    {
      icon: Bell,
      title: "Notificaciones",
      description: "Ver notificaciones y alertas",
      href: "/notifications",
      color: "bg-yellow-500"
    },
    {
      icon: MapPin,
      title: "Direcciones",
      description: "Gestionar direcciones de envío",
      href: "/settings#addresses",
      color: "bg-green-500"
    },
    {
      icon: CreditCard,
      title: "Tarjetas y pagos",
      description: "Administrar métodos de pago",
      href: "/settings#payments",
      color: "bg-purple-500"
    },
    {
      icon: MessageSquare,
      title: "Mensajes",
      description: "Chat con vendedores",
      href: "/messages",
      color: "bg-indigo-500"
    },
    {
      icon: Settings,
      title: "Configuración",
      description: "Editar perfil y preferencias",
      href: "/settings",
      color: "bg-gray-500"
    }
  ]

  if (session.user?.isSeller) {
    menuItems.unshift({
      icon: Store,
      title: "Panel de vendedor",
      description: "Gestionar tu tienda y ventas",
      href: "/dashboard",
      color: "bg-blue-600"
    })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header de la página */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {session.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ¡Hola, {session.user?.name?.split(" ")[0] || "Usuario"}!
              </h1>
              <p className="text-gray-500">{session.user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">
                  {session.user?.isSeller ? "Vendedor" : "Comprador"}
                </span>
                {session.user?.isSeller && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 group"
            >
              <div className="flex items-start gap-4">
                <div className={`${item.color} p-3 rounded-lg text-white`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        {/* Resumen rápido */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Compras recientes</h3>
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No tienes compras recientes</p>
              <Link href="/" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                Explorar productos
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Favoritos</h3>
            <div className="text-center py-8 text-gray-500">
              <Heart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No tienes productos favoritos</p>
              <Link href="/" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                Descubrir productos
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Notificaciones</h3>
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No tienes notificaciones nuevas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
