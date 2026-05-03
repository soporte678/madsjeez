"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Tag, Package } from "lucide-react"

interface WholesalePrice {
  id: string
  min_quantity: number
  price: number
  label: string
}

interface WholesalePriceDisplayProps {
  productId: string
  basePrice: number
  onQuantityChange?: (quantity: number, price: number) => void
}

export function WholesalePriceDisplay({ productId, basePrice, onQuantityChange }: WholesalePriceDisplayProps) {
  const [wholesalePrices, setWholesalePrices] = useState<WholesalePrice[]>([])
  const [selectedQty, setSelectedQty] = useState(1)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch(`/api/products/wholesale?productId=${productId}`)
        const data = await res.json()
        if (data.prices) {
          setWholesalePrices(data.prices)
        }
      } catch (e) {
        console.error("Error fetching wholesale prices:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchPrices()
  }, [productId])

  if (loading || wholesalePrices.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 text-green-700">
          <Tag size={16} />
          <span className="text-sm font-medium">Precio unitario: ${basePrice.toLocaleString("es-AR")}</span>
        </div>
      </div>
    )
  }

  // Sort by min_quantity ascending
  const sortedPrices = [...wholesalePrices].sort((a, b) => a.min_quantity - b.min_quantity)
  
  // Get the best price (lowest price per unit)
  const bestPrice = sortedPrices.reduce((best, current) => 
    current.price < best.price ? current : best
  , sortedPrices[0])

  // Get the smallest quantity tier
  const smallestTier = sortedPrices[0]

  // Calculate current price based on selected quantity
  const getPriceForQuantity = (qty: number) => {
    // Find the applicable tier (largest min_quantity that is <= qty)
    let applicableTier = null
    for (const tier of sortedPrices) {
      if (tier.min_quantity <= qty) {
        applicableTier = tier
      }
    }
    return applicableTier ? applicableTier.price : basePrice
  }

  const currentPrice = getPriceForQuantity(selectedQty)
  const totalPrice = currentPrice * selectedQty

  // Notify parent of quantity/price changes
  useEffect(() => {
    onQuantityChange?.(selectedQty, currentPrice)
  }, [selectedQty, currentPrice, onQuantityChange])

  return (
    <div className="space-y-3">
      {/* Best price banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-800">
                Precio mayorista desde ${bestPrice.price.toLocaleString("es-AR")}
              </p>
              <p className="text-xs text-green-600">
                Comprando {bestPrice.min_quantity} o más unidades
              </p>
            </div>
          </div>
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
            -{Math.round((1 - bestPrice.price / basePrice) * 100)}%
          </span>
        </div>
      </div>

      {/* Quantity selector with dropdown */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cantidad
        </label>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 text-left hover:border-blue-400 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900">{selectedQty} unidad{selectedQty > 1 ? 'es' : ''}</span>
            <span className="text-gray-500">|</span>
            <span className="text-blue-600 font-bold">${totalPrice.toLocaleString("es-AR")}</span>
            {selectedQty > 1 && (
              <span className="text-xs text-gray-500">
                (${currentPrice.toLocaleString("es-AR")} c/u)
              </span>
            )}
          </div>
          <ChevronDown size={20} className={`text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown with all tiers */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {/* Custom quantity input */}
            <div className="p-3 border-b border-gray-100">
              <label className="text-xs text-gray-500 mb-1 block">Cantidad personalizada</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border border-gray-300 rounded py-1"
                />
                <button
                  onClick={() => setSelectedQty(selectedQty + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                >
                  +
                </button>
              </div>
            </div>

            {/* Wholesale tiers */}
            <div className="py-2">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase mb-2">
                Precios por volumen
              </p>
              {sortedPrices.map((tier) => {
                const isSelected = selectedQty >= tier.min_quantity && 
                  (sortedPrices.findIndex(t => t.min_quantity > selectedQty) === -1 || 
                   sortedPrices[sortedPrices.findIndex(t => t.min_quantity > selectedQty) - 1]?.id === tier.id)
                
                const total = tier.price * Math.max(tier.min_quantity, selectedQty)
                
                return (
                  <button
                    key={tier.id}
                    onClick={() => {
                      setSelectedQty(tier.min_quantity)
                      setShowDropdown(false)
                    }}
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                        {tier.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({tier.min_quantity} unidad{tier.min_quantity > 1 ? 'es' : ''})
                      </span>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                        ${tier.price.toLocaleString("es-AR")} c/u
                      </p>
                      <p className="text-xs text-gray-500">
                        Total: ${(tier.price * tier.min_quantity).toLocaleString("es-AR")}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Base price option */}
            <button
              onClick={() => {
                setSelectedQty(1)
                setShowDropdown(false)
              }}
              className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 border-t border-gray-100 ${
                selectedQty === 1 && wholesalePrices.every(t => t.min_quantity > 1) ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
              }`}
            >
              <span className="text-sm font-medium text-gray-700">1 unidad</span>
              <span className="font-bold text-gray-900">${basePrice.toLocaleString("es-AR")} c/u</span>
            </button>
          </div>
        )}
      </div>

      {/* Savings indicator */}
      {selectedQty >= smallestTier.min_quantity && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-center gap-2">
          <Tag size={14} className="text-yellow-600" />
          <span className="text-sm text-yellow-700">
            Estás ahorrando ${((basePrice - currentPrice) * selectedQty).toLocaleString("es-AR")} 
            ({Math.round((1 - currentPrice / basePrice) * 100)}% de descuento)
          </span>
        </div>
      )}
    </div>
  )
}
