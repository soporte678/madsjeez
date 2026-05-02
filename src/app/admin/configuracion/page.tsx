"use client"

import { useState, useEffect, useCallback } from "react"
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
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface ConfigSection {
  id: string
  title: string
  icon: any
  description: string
}

interface ConfigData {
  [key: string]: any
}

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<ConfigData>({
    marketplace_name: "MadsJeez",
    contact_email: "soporte@madsjeez.com.ar",
    contact_phone: "+54 11 1234-5678",
    timezone: "America/Argentina/Buenos_Aires",
    description: "El marketplace de productos de ferretería más grande de Argentina",
    require_terms: true,
    enable_seller_registration: true,
    maintenance_mode: false,
    notif_new_orders: true,
    notif_new_sellers: true,
    notif_disputes: true,
    notif_incidents: true,
    notif_fraud: true,
    notif_kyc: true,
    enable_2fa: false,
    max_login_attempts: 5,
    lockout_minutes: 30,
    allowed_ips: "",
    mercadopago_enabled: true,
    commission_percent: 10,
    min_purchase: 100,
    hold_funds_new_sellers: true,
    andreani_enabled: true,
    correo_argentino_enabled: true,
    avg_delivery_days: 3,
    free_shipping_threshold: 15000,
    smtp_server: "",
    smtp_port: 587,
  })

  const sections: ConfigSection[] = [
    { id: "general", title: "General", icon: Settings, description: "Configuración general del marketplace" },
    { id: "notifications", title: "Notificaciones", icon: Bell, description: "Alertas y notificaciones por email" },
    { id: "security", title: "Seguridad", icon: Shield, description: "Políticas de seguridad y acceso" },
    { id: "payments", title: "Pagos", icon: CreditCard, description: "Configuración de métodos de pago" },
    { id: "shipping", title: "Envíos", icon: Truck, description: "Opciones de envío y logística" },
    { id: "emails", title: "Emails", icon: Mail, description: "Templates de correos electrónicos" },
  ]

  const loadConfig = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("marketplace_settings")
        .select("key, value")

      if (error) throw error

      if (data && data.length > 0) {
        const loaded: ConfigData = { ...config }
        data.forEach((row: { key: string; value: any }) => {
          loaded[row.key] = row.value
        })
        setConfig(loaded)
      }
    } catch (error) {
      console.error("Error loading config:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    try {
      const entries = Object.entries(config).map(([key, value]) => ({
        key,
        value: typeof value === "object" ? value : value,
        updated_at: new Date().toISOString(),
      }))

      for (const entry of entries) {
        const { error } = await supabase
          .from("marketplace_settings")
          .upsert({ key: entry.key, value: entry.value, updated_at: entry.updated_at }, { onConflict: "key" })

        if (error) throw error
      }

      toast.success("Configuración guardada correctamente")
    } catch (error) {
      console.error("Error saving config:", error)
      toast.error("Error al guardar. La tabla marketplace_settings puede no existir aún.")
    } finally {
      setSaving(false)
    }
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
          {activeTab === "general" && <GeneralSettings config={config} onChange={updateConfig} />}
          {activeTab === "notifications" && <NotificationSettings config={config} onChange={updateConfig} />}
          {activeTab === "security" && <SecuritySettings config={config} onChange={updateConfig} />}
          {activeTab === "payments" && <PaymentSettings config={config} onChange={updateConfig} />}
          {activeTab === "shipping" && <ShippingSettings config={config} onChange={updateConfig} />}
          {activeTab === "emails" && <EmailSettings config={config} onChange={updateConfig} />}
        </div>
      </div>
    </div>
  )
}

interface SettingsProps {
  config: ConfigData
  onChange: (key: string, value: any) => void
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
    </label>
  )
}

function GeneralSettings({ config, onChange }: SettingsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configuración General</h3>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Nombre del Marketplace</label>
          <input type="text" value={config.marketplace_name || ""} onChange={(e) => onChange("marketplace_name", e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email de Contacto</label>
          <input type="email" value={config.contact_email || ""} onChange={(e) => onChange("contact_email", e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Teléfono</label>
          <input type="tel" value={config.contact_phone || ""} onChange={(e) => onChange("contact_phone", e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Zona Horaria</label>
          <select value={config.timezone || "America/Argentina/Buenos_Aires"} onChange={(e) => onChange("timezone", e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm">
            <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Descripción del Marketplace</label>
        <textarea value={config.description || ""} onChange={(e) => onChange("description", e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm h-20" />
      </div>
      <div className="border-t pt-6">
        <h4 className="font-medium mb-4">Términos y Condiciones</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={!!config.require_terms} onChange={(e) => onChange("require_terms", e.target.checked)} className="w-4 h-4" />
            <span className="text-sm">Requerir aceptación de términos para nuevos usuarios</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={!!config.enable_seller_registration} onChange={(e) => onChange("enable_seller_registration", e.target.checked)} className="w-4 h-4" />
            <span className="text-sm">Habilitar registro de vendedores</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={!!config.maintenance_mode} onChange={(e) => onChange("maintenance_mode", e.target.checked)} className="w-4 h-4" />
            <span className="text-sm">Modo mantenimiento</span>
          </label>
        </div>
      </div>
    </div>
  )
}

function NotificationSettings({ config, onChange }: SettingsProps) {
  const items = [
    { key: "notif_new_orders", label: "Nuevas órdenes", desc: "Recibir email cuando hay una nueva compra" },
    { key: "notif_new_sellers", label: "Registro de vendedores", desc: "Notificar cuando un nuevo vendedor se registra" },
    { key: "notif_disputes", label: "Disputas", desc: "Alerta cuando se abre una mediación" },
    { key: "notif_incidents", label: "Siniestros", desc: "Notificación de siniestros logísticos" },
    { key: "notif_fraud", label: "Reportes de fraude", desc: "Alertas de posibles estafas" },
    { key: "notif_kyc", label: "Verificaciones KYC", desc: "Nuevas solicitudes de verificación" },
  ]
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configuración de Notificaciones</h3>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
            <Toggle checked={!!config[item.key]} onChange={(v) => onChange(item.key, v)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SecuritySettings({ config, onChange }: SettingsProps) {
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
            <Toggle checked={!!config.enable_2fa} onChange={(v) => onChange("enable_2fa", v)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Intentos máximos de login</label>
            <input type="number" value={config.max_login_attempts || 5} onChange={(e) => onChange("max_login_attempts", parseInt(e.target.value))} className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tiempo de bloqueo (minutos)</label>
            <input type="number" value={config.lockout_minutes || 30} onChange={(e) => onChange("lockout_minutes", parseInt(e.target.value))} className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">IPs Permitidas (Admin)</label>
          <textarea value={config.allowed_ips || ""} onChange={(e) => onChange("allowed_ips", e.target.value)} placeholder="10.0.0.1, 192.168.1.1" className="w-full p-2.5 border rounded-lg text-sm h-20" />
          <p className="text-xs text-gray-500">Deja vacío para permitir todas las IPs</p>
        </div>
      </div>
    </div>
  )
}

function PaymentSettings({ config, onChange }: SettingsProps) {
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
          <Toggle checked={!!config.mercadopago_enabled} onChange={(v) => onChange("mercadopago_enabled", v)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Comisión del Marketplace (%)</label>
            <input type="number" value={config.commission_percent || 10} step="0.1" onChange={(e) => onChange("commission_percent", parseFloat(e.target.value))} className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Monto mínimo de compra ($)</label>
            <input type="number" value={config.min_purchase || 100} onChange={(e) => onChange("min_purchase", parseInt(e.target.value))} className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
        </div>
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Retenciones</h4>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={!!config.hold_funds_new_sellers} onChange={(e) => onChange("hold_funds_new_sellers", e.target.checked)} className="w-4 h-4" />
            <span className="text-sm">Retener fondos por 14 días para nuevos vendedores</span>
          </label>
        </div>
      </div>
    </div>
  )
}

function ShippingSettings({ config, onChange }: SettingsProps) {
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
          <Toggle checked={!!config.andreani_enabled} onChange={(v) => onChange("andreani_enabled", v)} />
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium">Correo Argentino</p>
              <p className="text-xs text-gray-500">Envío económico</p>
            </div>
          </div>
          <Toggle checked={!!config.correo_argentino_enabled} onChange={(v) => onChange("correo_argentino_enabled", v)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Días hábiles de entrega (promedio)</label>
            <input type="number" value={config.avg_delivery_days || 3} onChange={(e) => onChange("avg_delivery_days", parseInt(e.target.value))} className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Costo de envío gratis desde ($)</label>
            <input type="number" value={config.free_shipping_threshold || 15000} onChange={(e) => onChange("free_shipping_threshold", parseInt(e.target.value))} className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmailSettings({ config, onChange }: SettingsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Templates de Email</h3>
      <div className="space-y-3">
        {[
          { name: "Bienvenida", subject: "Bienvenido a MadsJeez" },
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
            <input type="text" value={config.smtp_server || ""} onChange={(e) => onChange("smtp_server", e.target.value)} placeholder="smtp.ejemplo.com" className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Puerto</label>
            <input type="number" value={config.smtp_port || 587} onChange={(e) => onChange("smtp_port", parseInt(e.target.value))} className="w-full p-2.5 border rounded-lg text-sm" />
          </div>
        </div>
      </div>
    </div>
  )
}
