"use client"
import { Zap, Check } from "lucide-react"

export type FlashOption = {
  code: "flash_local" | "flash_plus" | "flash_normal"
  name: string
  price: number
  badge: string
  description: string
  recommended?: boolean
  available?: boolean
}

// MOCK TEMPORAL — reemplazar fetch a /api/flash/options cuando Cursor lo implemente
export const FLASH_OPTIONS_MOCK: FlashOption[] = [
  {
    code: "flash_local",
    name: "Flash Local",
    price: 3999,
    badge: "Rápido",
    description: "Busca un conductor local disponible para retirar y entregar tu pedido lo antes posible.",
    available: true,
  },
  {
    code: "flash_plus",
    name: "Flash Plus",
    price: 5999,
    badge: "Prioridad alta",
    description: "Entrega prioritaria. Tu pedido pasa a los primeros lugares de la cola.",
    recommended: true,
    available: true,
  },
  {
    code: "flash_normal",
    name: "Flash Normal",
    price: 6999,
    badge: "Cobertura ampliada",
    description: "Cobertura ampliada en zonas Flash establecidas.",
    available: true,
  },
]

function formatArs(v: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)
}

interface Props {
  options?: FlashOption[]
  selected: FlashOption | null
  onSelect: (option: FlashOption) => void
  loading?: boolean
  coverageMessage?: string | null
}

export function FlashShippingSelector({ options = FLASH_OPTIONS_MOCK, selected, onSelect, loading, coverageMessage }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
        <span className="h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin shrink-0" />
        Calculando cobertura Flash…
      </div>
    )
  }

  if (coverageMessage) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        {coverageMessage}
      </div>
    )
  }

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Elegí tu envío Flash</legend>
      <div className="mb-3">
        <p className="font-bold text-sm text-slate-900">Elegí tu envío Flash</p>
        <p className="text-xs text-gray-500 mt-0.5">Envíos prioritarios con conductor asignado según tu zona.</p>
      </div>

      {options.map((opt) => {
        const isSelected = selected?.code === opt.code
        const disabled = opt.available === false

        return (
          <button
            key={opt.code}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => !disabled && onSelect(opt)}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-1 ${
              disabled
                ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                : isSelected
                  ? "border-yellow-400 bg-yellow-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-yellow-300 cursor-pointer"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isSelected ? "bg-yellow-400" : "bg-yellow-100"}`}>
                  <Zap className={`h-5 w-5 ${isSelected ? "fill-black text-black" : "text-yellow-600"}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm text-slate-900">{opt.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.recommended ? "bg-yellow-400 text-black" : "bg-slate-100 text-slate-600"}`}>
                      {opt.badge}
                    </span>
                    {opt.recommended && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Recomendada
                      </span>
                    )}
                    {disabled && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        No disponible
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{opt.description}</p>
                  {!disabled && (
                    <p className="text-xs text-gray-400 mt-1">Disponible para tu zona.</p>
                  )}
                  {disabled && (
                    <p className="text-xs text-gray-400 mt-1">No disponible para esta dirección.</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 gap-1">
                <span className="font-black text-base text-slate-900">{formatArs(opt.price)}</span>
                {isSelected && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                    <Check className="h-2.5 w-2.5" /> Seleccionada
                  </span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </fieldset>
  )
}
