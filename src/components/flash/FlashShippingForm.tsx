"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ARGENTINA_PROVINCES, validateFlashAddress, type FlashAddressData } from "@/lib/flash/types"
import { Zap, AlertCircle } from "lucide-react"

interface Props {
  onConfirm: (data: FlashAddressData) => void
  onBack: () => void
  loading?: boolean
}

export function FlashShippingForm({ onConfirm, onBack, loading }: Props) {
  const [form, setForm] = useState<Partial<FlashAddressData>>({})
  const [errors, setErrors] = useState<string[]>([])

  const set = (k: keyof FlashAddressData, v: string) =>
    setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    const errs = validateFlashAddress(form)
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    onConfirm(form as FlashAddressData)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-300 rounded-xl p-4">
        <div className="bg-yellow-400 rounded-full p-2">
          <Zap className="h-5 w-5 text-black fill-black" />
        </div>
        <div>
          <p className="font-bold text-sm">⚡ Envío Flash seleccionado</p>
          <p className="text-xs text-gray-600">Entrega en menos de 24 hs. Completá todos los datos.</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
          {errors.map((e) => (
            <p key={e} className="text-xs text-red-700 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" /> {e}
            </p>
          ))}
        </div>
      )}

      {/* Datos del receptor */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Datos del receptor</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Nombre completo *</Label>
            <Input placeholder="Juan Pérez" value={form.recipientName ?? ""} onChange={(e) => set("recipientName", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">DNI *</Label>
            <Input placeholder="32456789" maxLength={8} value={form.recipientDni ?? ""} onChange={(e) => set("recipientDni", e.target.value.replace(/\D/g, ""))} />
          </div>
          <div>
            <Label className="text-xs">WhatsApp *</Label>
            <Input placeholder="1145678901" value={form.recipientPhone ?? ""} onChange={(e) => set("recipientPhone", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Dirección */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Dirección de entrega</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Calle *</Label>
              <Input placeholder="Av. Corrientes" value={form.street ?? ""} onChange={(e) => set("street", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Número *</Label>
              <Input placeholder="1234" value={form.streetNumber ?? ""} onChange={(e) => set("streetNumber", e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Piso</Label>
            <Input placeholder="3" value={form.floor ?? ""} onChange={(e) => set("floor", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Depto</Label>
            <Input placeholder="B" value={form.apartment ?? ""} onChange={(e) => set("apartment", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Entre calle 1 *</Label>
            <Input placeholder="Callao" value={form.betweenStreet1 ?? ""} onChange={(e) => set("betweenStreet1", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Entre calle 2 *</Label>
            <Input placeholder="Uruguay" value={form.betweenStreet2 ?? ""} onChange={(e) => set("betweenStreet2", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Localidad *</Label>
            <Input placeholder="Buenos Aires" value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Provincia *</Label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              value={form.province ?? ""}
              onChange={(e) => set("province", e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {ARGENTINA_PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Código postal *</Label>
            <Input placeholder="1043" maxLength={4} value={form.postalCode ?? ""} onChange={(e) => set("postalCode", e.target.value.replace(/\D/g, ""))} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} disabled={loading}>Volver</Button>
        <Button
          className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Procesando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 fill-black" /> Confirmar Envío Flash
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
