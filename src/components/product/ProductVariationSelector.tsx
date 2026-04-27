"use client"

import { useState, useEffect } from "react"
import { useVariations } from "@/hooks/useVariations"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface ProductVariationSelectorProps {
  productId: string
  basePrice: number
  onVariationSelect?: (variation: any) => void
}

export function ProductVariationSelector({ 
  productId, 
  basePrice,
  onVariationSelect 
}: ProductVariationSelectorProps) {
  const { variations, isLoading } = useVariations({ productId })
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  const [selectedVariation, setSelectedVariation] = useState<any>(null)

  // Extraer atributos únicos
  const attributeOptions = variations.reduce((acc: Record<string, Set<string>>, variation) => {
    Object.entries(variation.attributes).forEach(([key, value]) => {
      if (!acc[key]) {
        acc[key] = new Set()
      }
      acc[key].add(value)
    })
    return acc
  }, {})

  // Encontrar variación que coincida con los atributos seleccionados
  useEffect(() => {
    if (Object.keys(selectedAttributes).length === 0) {
      setSelectedVariation(null)
      onVariationSelect?.(null)
      return
    }

    const matchedVariation = variations.find(v => {
      return Object.entries(selectedAttributes).every(
        ([key, value]) => v.attributes[key] === value
      )
    })

    setSelectedVariation(matchedVariation || null)
    onVariationSelect?.(matchedVariation || null)
  }, [selectedAttributes, variations, onVariationSelect])

  const handleAttributeSelect = (attributeName: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeName]: value
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando opciones...
      </div>
    )
  }

  if (variations.length === 0) {
    return null
  }

  const currentPrice = selectedVariation?.price || basePrice
  const currentStock = selectedVariation?.stock || 0
  const isOutOfStock = currentStock === 0

  return (
    <div className="space-y-4">
      {/* Atributos */}
      {Object.entries(attributeOptions).map(([attributeName, values]) => (
        <div key={attributeName}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {attributeName.charAt(0).toUpperCase() + attributeName.slice(1)}
          </label>
          <div className="flex flex-wrap gap-2">
            {Array.from(values).map((value) => {
              const isSelected = selectedAttributes[attributeName] === value
              
              return (
                <Button
                  key={value}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAttributeSelect(attributeName, value)}
                  className={isSelected ? "bg-blue-600" : ""}
                >
                  {value}
                </Button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Precio y Stock */}
      {selectedVariation && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                ${currentPrice.toLocaleString("es-AR")}
              </span>
              {selectedVariation.comparePrice && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  ${selectedVariation.comparePrice.toLocaleString("es-AR")}
                </span>
              )}
            </div>
            
            <div>
              {isOutOfStock ? (
                <Badge variant="destructive">Sin stock</Badge>
              ) : currentStock < 5 ? (
                <Badge variant="secondary">¡Solo {currentStock} disponibles!</Badge>
              ) : (
                <Badge variant="default">{currentStock} disponibles</Badge>
              )}
            </div>
          </div>
          
          {selectedVariation.sku && (
            <p className="text-sm text-gray-500 mt-2">
              SKU: {selectedVariation.sku}
            </p>
          )}
        </div>
      )}

      {!selectedVariation && Object.keys(selectedAttributes).length > 0 && (
        <div className="text-amber-600 text-sm">
          La combinación seleccionada no está disponible
        </div>
      )}
    </div>
  )
}
