"use client"

import { useState } from "react"
import {
  Settings,
  Bell,
  Shield,
  CreditCard,
  Truck,
  Mail,
  Save,
  RefreshCw,
  CheckCircle,
} from "lucide-react"
import { toast } from "sonner"

interface ConfigSection {
  id: string
  title: string
  icon: any
  description: string
}

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [saving, setSaving] = useState(false)

  const sections: ConfigSection[] = [
    { id: "general", title: "General", icon: Settings, description: "Configuración general del marketplace" },
    { id: "notifications", title: "Notificaciones", icon: Bell, description: "Alertas y notificaciones por email" },
    { id: "security", title: "Seguridad", icon: Shield, description: "Políticas de seguridad y acceso" },
    { id: "payments", title: "Pagos", icon: CreditCard, description: "Configuración de métodos de pago" },
    { id: "shipping", title: "Envíos", icon: Truck, description: "Opciones de envío y logística" },
    { id: "emails", title: "Emails", icon: Mail, description: "Templates de correos electrónicos" },
  ]

  const handleSave = async () => {
    setSaving(true)
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Configuración guardada")
    setSaving(false)
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Configuración del Sistema
          </h2>
          <p className="text-sm text-gray-500">Administra las preferencias del marketplace</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-lg border border-gray-200 p-4 shrink-0 overflow-y-auto">
          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === section.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <section.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6 overflow-y-auto">
          {activeTab === "general" && <GeneralSettings />}
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "security" && <SecuritySettings />}
          {activeTab === "payments" && <PaymentSettings />}
          {activeTab === "shipping" && <ShippingSettings />}
          {activeTab === "emails" && <EmailSettings />}
        </div>
      </div>
    </div>
  )
}

function GeneralSettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configuración General</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Nombre del Marketplace</label>
          <input type="text" defaultValue="MaqJeez" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email de Contacto</label>
          <input type="email" defaultValue="soporte@maqjeez.com.ar" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Teléfono</label>
          <input type="tel" defaultValue="+54 11 1234-5678" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Zona Horaria</label>
          <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm">
            <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Descripción del Marketplace</label>
        <textarea defaultValue="El marketplace de productos de ferretería más grande de Argentina" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm h-20" />
      </div>

      <div className="border-t pt-6">
        <h4 className="font-medium mb-4">Términos y Condiciones</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm">Requerir aceptación de términos para nuevos usuarios</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm">Habilitar registro de vendedores</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm">Modo mantenimiento</span>
          </label>
        </div>
      </div>
    </div>
  )
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configuración de Notificaciones</h3>
      
      <div className="space-y-4">
        {[
          { label: "Nuevas órdenes", desc: "Recibir email cuando hay una nueva compra" },
          { label: "Registro de vendedores", desc: "Notificar cuando un nuevo vendedor se registra" },
          { label: "Disputas", desc: "Alerta cuando se abre una mediación" },
          { label: "Siniestros", desc: "Notificación de siniestros logísticos" },
          { label: "Reportes de fraude", desc: "Alertas de posibles estafas" },
          { label: "Verificaciones KYC", desc: "Nuevas solicitudes de verificación" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configuración de Seguridad</h3>
      
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Autenticación de Dos Factores (2FA)
          </h4>
          <p className="text-sm text-yellow-700 mt-1">Requerir 2FA para todos los administradores</p>
          <div className="mt-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Intentos máximos de login</label>
            <input type="number" defaultValue={5} className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tiempo de bloqueo (minutos)</label>
            <input type="number" defaultValue={30} className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">IPs Permitidas (Admin)</label>
          <textarea placeholder="10.0.0.1, 192.168.1.1" className="w-full p-2.5 border rounded-lg text-sm h-20" />
          <p className="text-xs text-gray-500">Deja vacío para permitir todas las IPs</p>
        </div>
      </div>
    </div>
  )
}

function PaymentSettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configuración de Pagos</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">MercadoPago</p>
              <p className="text-xs text-gray-500">Pagos con tarjeta y saldo</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Comisión del Marketplace (%)</label>
            <input type="number" defaultValue={10} step="0.1" className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Monto mínimo de compra ($)</label>
            <input type="number" defaultValue={100} className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Retenciones</h4>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm">Retener fondos por 14 días para nuevos vendedores</span>
          </label>
        </div>
      </div>
    </div>
  )
}

function ShippingSettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configuración de Envíos</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium">Andreani</p>
              <p className="text-xs text-gray-500">Envío estándar</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium">Correo Argentino</p>
              <p className="text-xs text-gray-500">Envío económico</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Días hábiles de entrega (promedio)</label>
            <input type="number" defaultValue={3} className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Costo de envío gratis desde ($)</label>
            <input type="number" defaultValue={15000} className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmailSettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Templates de Email</h3>
      
      <div className="space-y-3">
        {[
          { name: "Bienvenida", subject: "Bienvenido a MaqJeez" },
          { name: "Confirmación de compra", subject: "Tu orden ha sido confirmada" },
          { name: "Envío confirmado", subject: "Tu pedido ha sido enviado" },
          { name: "Entrega completada", subject: "Tu pedido fue entregado" },
          { name: "Recuperar contraseña", subject: "Restablecer contraseña" },
        ].map((template) => (
          <div key={template.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-sm">{template.name}</p>
                <p className="text-xs text-gray-500">Asunto: {template.subject}</p>
              </div>
            </div>
            <button className="text-blue-600 text-sm">Editar</button>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Configuración SMTP</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Servidor SMTP</label>
            <input type="text" placeholder="smtp.ejemplo.com" className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Puerto</label>
            <input type="number" placeholder="587" className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
        </div>
      </div>
    </div>
  )
}
