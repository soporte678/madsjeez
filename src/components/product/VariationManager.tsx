"use client"

import { useState } from "react"
import { useVariations } from "@/hooks/useVariations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  Loader2,
  Package
} from "lucide-react"

interface VariationManagerProps {
  productId: string
}

export function VariationManager({ productId }: VariationManagerProps) {
  const { 
    variations, 
    isLoading, 
    createVariation, 
    updateVariation, 
    deleteVariation 
  } = useVariations({ productId })

  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    sku: "",
    attributes: "" as string | Record<string, string>,
    price: "",
    comparePrice: "",
    stock: "",
    images: ""
  })

  const resetForm = () => {
    setFormData({
      sku: "",
      attributes: "",
      price: "",
      comparePrice: "",
      stock: "",
      images: ""
    })
  }

  const handleCreate = async () => {
    setIsSubmitting(true)
    try {
      const attributes = typeof formData.attributes === 'string' 
        ? JSON.parse(formData.attributes || "{}")
        : formData.attributes

      await createVariation({
        productId,
        sku: formData.sku || undefined,
        attributes,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
        stock: parseInt(formData.stock) || 0,
        images: formData.images ? formData.images.split(",").map(s => s.trim()) : []
      })

      resetForm()
      setIsCreating(false)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (id: string) => {
    setIsSubmitting(true)
    try {
      const attributes = typeof formData.attributes === 'string'
        ? JSON.parse(formData.attributes || "{}")
        : formData.attributes

      await updateVariation(id, {
        sku: formData.sku || undefined,
        attributes,
        price: formData.price ? parseFloat(formData.price) : undefined,
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
        stock: formData.stock ? parseInt(formData.stock) : undefined,
        images: formData.images ? formData.images.split(",").map(s => s.trim()) : undefined
      })

      setEditingId(null)
      resetForm()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta variación?")) return
    
    try {
      await deleteVariation(id)
    } catch (error: any) {
      alert(error.message)
    }
  }

  const startEdit = (variation: any) => {
    setEditingId(variation.id)
    setFormData({
      sku: variation.sku || "",
      attributes: JSON.stringify(variation.attributes, null, 2),
      price: variation.price.toString(),
      comparePrice: variation.comparePrice?.toString() || "",
      stock: variation.stock.toString(),
      images: variation.images?.join(", ") || ""
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="w-5 h-5" />
          Variaciones ({variations.length})
        </h3>
        
        {!isCreating && (
          <Button
            size="sm"
            onClick={() => {
              setIsCreating(true)
              resetForm()
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Variación
          </Button>
        )}
      </div>

      {/* Formulario de creación */}
      {isCreating && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>SKU</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="SKU-001"
              />
            </div>
            <div>
              <Label>Stock</Label>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <Label>Atributos (JSON)</Label>
            <textarea
              className="w-full min-h-[80px] p-2 border rounded-md font-mono text-sm"
              value={typeof formData.attributes === 'string' ? formData.attributes : JSON.stringify(formData.attributes)}
              onChange={(e) => setFormData({ ...formData, attributes: e.target.value })}
              placeholder='{"color": "rojo", "talle": "XL"}'
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Precio</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="9999"
              />
            </div>
            <div>
              <Label>Precio Comparación</Label>
              <Input
                type="number"
                value={formData.comparePrice}
                onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                placeholder="12999"
              />
            </div>
          </div>

          <div>
            <Label>Imágenes (URLs separadas por coma)</Label>
            <Input
              value={formData.images}
              onChange={(e) => setFormData({ ...formData, images: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false)
                resetForm()
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de variaciones */}
      <div className="space-y-2">
        {variations.map((variation: any) => (
          <div
            key={variation.id}
            className="border rounded-lg p-4 hover:bg-gray-50"
          >
            {editingId === variation.id ? (
              // Modo edición
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>SKU</Label>
                    <Input
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Precio</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Precio Comparación</Label>
                    <Input
                      type="number"
                      value={formData.comparePrice}
                      onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(variation.id)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Guardar"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null)
                      resetForm()
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              // Modo visualización
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {Object.entries(variation.attributes).map(([key, value]) => (
                      <span
                        key={key}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {variation.sku && <span className="mr-4">SKU: {variation.sku}</span>}
                    <span className="mr-4">
                      Precio: ${variation.price.toLocaleString("es-AR")}
                    </span>
                    <span>Stock: {variation.stock}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(variation)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => handleDelete(variation.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {variations.length === 0 && !isCreating && (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No hay variaciones</p>
          <p className="text-sm">Agrega variaciones para diferentes talles, colores, etc.</p>
        </div>
      )}
    </div>
  )
}
