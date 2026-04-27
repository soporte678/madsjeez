"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  Upload, X, Plus, Trash2, Save, Eye, 
  Package, Tag, DollarSign, FileText, 
  Image as ImageIcon, AlertCircle, CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductImage {
  id: string
  url: string
  order: number
}

interface ProductAttribute {
  id: string
  name: string
  value: string
}

export default function PublicarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [preview, setPreview] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    comparePrice: "",
    stock: "1",
    categoryId: "",
    condition: "NEW",
    images: [] as ProductImage[],
    attributes: [] as ProductAttribute[]
  })
  
  // UI states
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?redirect=/dashboard/publicar")
    }
  }, [status, router])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleImageUpload = async (files: FileList) => {
    setUploadingImages(true)
    
    try {
      const newImages: ProductImage[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileName = `${Date.now()}-${i}`
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file)
        
        if (uploadError) throw uploadError
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)
        
        newImages.push({
          id: `${Date.now()}-${i}`,
          url: publicUrl,
          order: formData.images.length + i
        })
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }))
      
    } catch (error) {
      console.error("Error uploading images:", error)
      setErrors(prev => ({
        ...prev,
        images: "Error al subir imágenes"
      }))
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (imageId: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }))
  }

  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, {
        id: `attr-${Date.now()}`,
        name: "",
        value: ""
      }]
    }))
  }

  const updateAttribute = (id: string, field: 'name' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map(attr => 
        attr.id === id ? { ...attr, [field]: value } : attr
      )
    }))
  }

  const removeAttribute = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter(attr => attr.id !== id)
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = "El título es requerido"
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "La descripción es requerida"
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "El precio debe ser mayor a 0"
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = "Debes seleccionar una categoría"
    }
    
    if (formData.images.length === 0) {
      newErrors.images = "Debes subir al menos una imagen"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        comparePrice: formData.comparePrice,
        stock: formData.stock,
        categoryId: formData.categoryId,
        condition: formData.condition,
        images: formData.images.map(img => img.url),
        attributes: formData.attributes.filter(attr => attr.name && attr.value)
      }
      
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al publicar producto")
      }
      
      setSuccess(true)
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          title: "",
          description: "",
          price: "",
          comparePrice: "",
          stock: "1",
          categoryId: "",
          condition: "NEW",
          images: [],
          attributes: []
        })
        setSuccess(false)
        router.push("/dashboard/publicaciones")
      }, 2000)
      
    } catch (error) {
      console.error("Error publishing product:", error)
      setErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : "Error al publicar producto"
      }))
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="animate-spin h-8 w-8 border-4 border-[#3483FA] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  if (preview) {
    return (
      <div className="min-h-screen bg-[#F5F5F5]">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Vista previa del producto</h1>
              <Button onClick={() => setPreview(false)} variant="outline">
                Volver al editor
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                {formData.images.length > 0 && (
                  <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={formData.images[0].url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2">{formData.title}</h2>
                <div className="text-3xl font-bold text-green-600 mb-4">
                  ${parseFloat(formData.price).toLocaleString('es-AR')}
                </div>
                
                {formData.comparePrice && (
                  <div className="text-lg text-gray-500 line-through mb-4">
                    ${parseFloat(formData.comparePrice).toLocaleString('es-AR')}
                  </div>
                )}
                
                <div className="mb-4">
                  <Badge variant="secondary">
                    {categories.find(c => c.id === formData.categoryId)?.name}
                  </Badge>
                </div>
                
                <div className="prose max-w-none">
                  <p>{formData.description}</p>
                </div>
                
                {formData.attributes.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Características:</h3>
                    <ul className="space-y-1">
                      {formData.attributes.map(attr => (
                        <li key={attr.id}>
                          <strong>{attr.name}:</strong> {attr.value}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Publicar producto</h1>
              <Button
                onClick={() => setPreview(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Eye size={16} />
                Vista previa
              </Button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">¡Producto publicado con éxito!</span>
              </div>
            )}
            
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errors.submit}</span>
              </div>
            )}
            
            {/* Información básica */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package size={20} />
                Información básica
              </h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Título del producto *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Smartphone Samsung Galaxy S23 256GB"
                  maxLength={60}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="Describe tu producto con detalles..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>
            </div>
            
            {/* Precio y stock */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign size={20} />
                Precio y stock
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Precio *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.price && (
                    <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Precio anterior (opcional)
                  </label>
                  <input
                    type="number"
                    value={formData.comparePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, comparePrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Stock *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Condición
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="NEW">Nuevo</option>
                    <option value="USED">Usado</option>
                    <option value="RECONDITIONED">Reacondicionado</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Categoría */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Tag size={20} />
                Categoría
              </h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
                )}
              </div>
            </div>
            
            {/* Imágenes */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon size={20} />
                Imágenes
              </h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fotos del producto *
                </label>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {uploadingImages ? "Subiendo imágenes..." : "Haz clic para subir imágenes"}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      JPG, PNG, GIF (Máx. 5MB por imagen)
                    </span>
                  </label>
                </div>
                
                {errors.images && (
                  <p className="text-red-500 text-sm mt-1">{errors.images}</p>
                )}
                
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {formData.images.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={image.url}
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Atributos */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={20} />
                Características adicionales
              </h2>
              
              <div className="space-y-3">
                {formData.attributes.map((attribute, index) => (
                  <div key={attribute.id} className="flex gap-3">
                    <input
                      type="text"
                      value={attribute.name}
                      onChange={(e) => updateAttribute(attribute.id, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre de la característica"
                    />
                    <input
                      type="text"
                      value={attribute.value}
                      onChange={(e) => updateAttribute(attribute.id, 'value', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Valor"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttribute(attribute.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  onClick={addAttribute}
                  variant="outline"
                  className="w-full"
                >
                  <Plus size={16} className="mr-2" />
                  Agregar característica
                </Button>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-4 pt-6 border-t">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Publicar producto
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
