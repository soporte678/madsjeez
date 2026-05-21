"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DollarSign, Loader2, Save } from "lucide-react"
import type { FlashRateSettings } from "@/lib/flash/rate-config"

const FIELDS: { key: keyof FlashRateSettings; label: string; step?: string }[] = [
  { key: "basePerOrder", label: "Base por pedido (ARS)", step: "0.01" },
  { key: "basePerPackage", label: "Base por paquete (ARS)", step: "0.01" },
  { key: "extraPerKm", label: "Extra por km (ARS)", step: "0.01" },
  { key: "extraWaitPerMinute", label: "Extra por minuto de espera", step: "0.01" },
  { key: "rainBonusPercent", label: "Bonificación lluvia (%)", step: "1" },
  { key: "nightBonusPercent", label: "Bonificación nocturna (%)", step: "1" },
  { key: "highDemandBonusPercent", label: "Alta demanda (%)", step: "1" },
  { key: "difficultZoneBonusPercent", label: "Zona difícil (%)", step: "1" },
  { key: "minGuaranteedPerBlock", label: "Mínimo garantizado bloque Flex", step: "0.01" },
  { key: "platformCommissionPercent", label: "Comisión plataforma (%)", step: "0.1" },
  { key: "defaultTipEstimate", label: "Propina estimada default", step: "0.01" },
]

export function FlashRatesPanel() {
  const [settings, setSettings] = useState<FlashRateSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/admin/flash/rates", { credentials: "include" })
      const d = await r.json()
      if (r.ok) {
        setSettings((d.config?.settings ?? d.defaults) as FlashRateSettings)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    if (!settings) return
    setSaving(true)
    setMsg("")
    try {
      const r = await fetch("/api/admin/flash/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ settings }),
      })
      const d = await r.json()
      if (!r.ok) {
        setMsg(d.error ?? "Error al guardar")
        return
      }
      setSettings(d.config.settings as FlashRateSettings)
      setMsg("Tarifas actualizadas. Los conductores verán los nuevos valores.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
        </CardContent>
      </Card>
    )
  }

  if (!settings) return null

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-yellow-600" />
          <div>
            <h2 className="text-sm font-bold">Tarifas del conductor</h2>
            <p className="text-xs text-muted-foreground">
              Referencia inicial ~$3.032,90 por pedido. Ajustá por ciudad, demanda y promociones.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <Label className="text-xs">{f.label}</Label>
              <Input
                type="number"
                step={f.step ?? "1"}
                className="mt-1"
                value={settings[f.key]}
                onChange={(e) =>
                  setSettings((s) =>
                    s ? { ...s, [f.key]: parseFloat(e.target.value) || 0 } : s
                  )
                }
              />
            </div>
          ))}
        </div>
        {msg && <p className="text-xs text-green-700">{msg}</p>}
        <Button
          className="bg-yellow-400 hover:bg-yellow-500 text-black"
          onClick={save}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Guardar tarifas
        </Button>
      </CardContent>
    </Card>
  )
}
