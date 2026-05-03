"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Save, Tag } from "lucide-react"

interface WholesaleTier {
  min_quantity: number
  price: number
  label: string
}

interface WholesalePriceManagerProps {
  productId: string
  basePrice: number
}

export function WholesalePriceManager({ productId, basePrice }: WholesalePriceManagerProps) {
  const [tiers, setTiers] = useState<WholesaleTier[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch(`/api/products/wholesale?productId=${productId}`)
        const data = await res.json()
        if (data.prices && data.prices.length > 0) {
          setTiers(data.prices.map((p: any) => ({
            min_quantity: p.min_quantity,
            price: p.price,
            label: p.label,
          })))
        }
      } catch (e) {
        console.error("Error fetching wholesale prices:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchPrices()
  }, [productId])

  const addTier = () => {
    if (tiers.length >= 10) return
    const lastTier = tiers[tiers.length - 1]
    const newQty = lastTier ? lastTier.min_quantity + 5 : 5
    setTiers([...tiers, {
      min_quantity: newQty,
      price: Math.round(basePrice * 0.9),
      label: `x${newQty}`,
    }])
  }

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index))
  }

  const updateTier = (index: number, field: keyof WholesaleTier, value: string | number) => {
    const newTiers = [...tiers]
    if (field === "min_quantity") {
      newTiers[index].min_quantity = Math.max(2, parseInt(value as string) || 2)
      newTiers[index].label = `x${newTiers[index].min_quantity}`
    } else if (field === "price") {
      newTiers[index].price = Math.max(1, parseFloat(value as string) || 1)
    } else if (field === "label") {
      newTiers[index].label = value as string
    }
    setTiers(newTiers)
  }

  const savePrices = async () => {
    setSaving(true)
    try {
      // Sort by min_quantity before saving
      const sortedTiers = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity)
      
      const res = await fetch("/api/products/wholesale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          prices: sortedTiers,
        }),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (e) {
      console.error("Error saving wholesale prices:", e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando...</div>
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-blue-600" />
          <h3 className="font-semibold text-gray-900">Precios por volumen (Mayorista)</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{tiers.length}/10 escalas</span>
          <button
            onClick={savePrices}
            disabled={saving || tiers.length === 0}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={14} />
            {saving ? "Guardando..." : saved ? "Guardado!" : "Guardar"}
          </button>
        </div>
      </div>

      {tiers.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 mb-3">
            No tienes precios mayoristas configurados. Agregá escalas de precios por cantidad.
          </p>
          <button
            onClick={addTier}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            <Plus size={16} />
            Agregar primera escala
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-2">
            <div className="col-span-3">Cantidad mínima</div>
            <div className="col-span-4">Precio por unidad</div>
            <div className="col-span-3">Etiqueta</div>
            <div className="col-span-2">Descuento</div>
          </div>

          {tiers.map((tier, index) => {
            const discount = Math.round((1 - tier.price / basePrice) * 100)
            return (
              <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2">
                <div className="col-span-3">
                  <input
                    type="number"
                    min={2}
                    value={tier.min_quantity}
                    onChange={(e) => updateTier(index, "min_quantity", e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="col-span-4">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      min={1}
                      value={tier.price}
                      onChange={(e) => updateTier(index, "price", e.target.value)}
                      className="w-full border border-gray-300 rounded pl-6 pr-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={tier.label}
                    onChange={(e) => updateTier(index, "label", e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <span className={`text-sm font-medium ${discount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {discount > 0 ? `-${discount}%` : `+${Math.abs(discount)}%`}
                  </span>
                  <button
                    onClick={() => removeTier(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}

          {tiers.length < 10 && (
            <button
              onClick={addTier}
              className="w-full flex items-center justify-center gap-1 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm"
            >
              <Plus size={16} />
              Agregar escala ({10 - tiers.length} restantes)
            </button>
          )}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Tip:</strong> Configurá hasta 10 escalas de precios. Los compradores verán automáticamente el mejor precio según la cantidad que elijan.
        </p>
      </div>
    </div>
  )
}
