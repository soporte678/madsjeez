"use client"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ARGENTINA_PROVINCES, validateFlashAddress, type FlashAddressData } from "@/lib/flash/types"
import { Zap, AlertCircle, Star, Clock, MapPin, Check, Truck } from "lucide-react"

type FlashOption = {
  code: string
  name: string
  description: string
  price: number
  priority: number
  coverageType: string
  radiusKm: number | null
  estimatedTime: string | null
  available: boolean
  unavailableReason: string | null
  recommended: boolean
}

interface Props {
  onConfirm: (data: FlashAddressData & { shippingTier: string; shippingPrice: number; priorityScore: number }) => void
  onBack: () => void
  loading?: boolean
}

export function FlashShippingForm({ onConfirm, onBack, loading }: Props) {
  const [form, setForm] = useState<Partial<FlashAddressData>>({})
  const [errors, setErrors] = useState<string[]>([])
  const [options, setOptions] = useState<FlashOption[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

  const set = (k: keyof FlashAddressData, v: string) =>
    setForm((p) => ({ ...p, [k]: v }))

  // Fetch shipping options when address changes (debounced)
  useEffect(() => {
    const cp = form.postalCode ?? ""
    const city = form.city ?? ""
    const province = form.province ?? ""

    const timer = setTimeout(() => {
      setOptionsLoading(true)
      const params = new URLSearchParams()
      if (cp) params.set("postalCode", cp)
      if (city) params.set("city", city)
      if (province) params.set("province", province)

      fetch(`/api/flash/shipping-options?${params}`)
        .then((r) => r.json())
        .then((d) => {
          setOptions(d.options ?? [])
          // Auto-select recommended if nothing selected
          if (!selectedTier) {
            const rec = (d.options ?? []).find((o: FlashOption) => o.recommended && o.available)
            if (rec) setSelectedTier(rec.code)
            else {
              const first = (d.options ?? []).find((o: FlashOption) => o.available)
              if (first) setSelectedTier(first.code)
            }
          }
        })
        .catch(() => {})
        .finally(() => setOptionsLoading(false))
    }, 500)

    return () => clearTimeout(timer)
  }, [form.postalCode, form.city, form.province])

  const selectedOption = options.find((o) => o.code === selectedTier)

  const handleSubmit = () => {
    const errs = validateFlashAddress(form)
    if (!selectedTier || !selectedOption?.available) {
      errs.push("Seleccioná una opción de envío Flash disponible.")
    }
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    onConfirm({
      ...(form as FlashAddressData),
      shippingTier: selectedTier!,
      shippingPrice: selectedOption!.price,
      priorityScore: selectedOption!.priority,
    })
  }

  const tierIcon = (code: string) => {
    if (code === "flash_plus") return <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
    if (code === "flash_local") return <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400" />
    return <Truck className="h-4 w-4 text-blue-400" />
  }

  const tierBorderColor = (code: string, selected: boolean) => {
    if (!selected) return "border-gray-200 hover:border-gray-300"
    if (code === "flash_plus") return "border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400/30"
    if (code === "flash_local") return "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-400/30"
    return "border-blue-400 bg-blue-50 ring-2 ring-blue-400/30"
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-300 rounded-xl p-4">
        <div className="bg-yellow-400 rounded-full p-2">
          <Zap className="h-5 w-5 text-black fill-black" />
        </div>
        <div>
          <p className="font-bold text-sm">⚡ Elegí tu envío Flash</p>
          <p className="text-xs text-gray-600">Completá la dirección y seleccioná la modalidad de entrega.</p>
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

      {/* Shipping tier selection */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Modalidad de envío Flash</p>

        {optionsLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-xs text-gray-500">Consultando disponibilidad...</span>
          </div>
        )}

        {!optionsLoading && options.length === 0 && (
          <div className="text-center py-4 text-sm text-gray-500">
            No hay envíos Flash disponibles para esta dirección.
          </div>
        )}

        {!optionsLoading && options.map((opt) => (
          <button
            key={opt.code}
            type="button"
            disabled={!opt.available}
            onClick={() => opt.available && setSelectedTier(opt.code)}
            className={`w-full text-left rounded-xl border p-4 transition-all ${
              opt.available
                ? tierBorderColor(opt.code, selectedTier === opt.code)
                : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Selection indicator */}
              <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selectedTier === opt.code
                  ? "border-yellow-400 bg-yellow-400"
                  : "border-gray-300"
              }`}>
                {selectedTier === opt.code && <Check className="h-3 w-3 text-black" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {tierIcon(opt.code)}
                  <span className="font-bold text-sm">{opt.name.split("—")[0].trim()}</span>
                  {opt.recommended && (
                    <span className="text-[10px] font-bold bg-yellow-400 text-black rounded-full px-2 py-0.5 uppercase">
                      Recomendado
                    </span>
                  )}
                  {opt.code === "flash_plus" && (
                    <span className="text-[10px] font-bold bg-orange-100 text-orange-700 rounded-full px-2 py-0.5">
                      Prioridad alta
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-lg font-black text-gray-900">
                    ${opt.price.toLocaleString("es-AR")}
                  </span>
                  {opt.estimatedTime && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" /> {opt.estimatedTime}
                    </span>
                  )}
                  {opt.radiusKm && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" /> Radio {opt.radiusKm} km
                    </span>
                  )}
                </div>
                {!opt.available && opt.unavailableReason && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {opt.unavailableReason}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}

        {!optionsLoading && options.every((o) => !o.available) && options.length > 0 && (
          <div className="text-center py-2">
            <p className="text-sm text-red-600 font-medium">No hay envíos Flash disponibles para esta dirección.</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {selectedOption?.available && (
        <div className="bg-gray-50 border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {tierIcon(selectedOption.code)}
              <span className="text-sm font-semibold">{selectedOption.name.split("—")[0].trim()}</span>
            </div>
            <span className="text-lg font-black">${selectedOption.price.toLocaleString("es-AR")}</span>
          </div>
          {selectedOption.code === "flash_plus" && (
            <p className="text-xs text-orange-600 mt-1">Tu pedido pasa a los primeros lugares de la cola de asignación.</p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} disabled={loading}>Volver</Button>
        <Button
          className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
          onClick={handleSubmit}
          disabled={loading || !selectedTier || !selectedOption?.available}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Procesando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 fill-black" />
              Confirmar Envío Flash · ${selectedOption?.price.toLocaleString("es-AR") ?? ""}
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
