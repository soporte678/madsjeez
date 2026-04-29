"use client"
import React, { useState, useEffect, useRef } from "react"
import {
  ChevronLeft, Search, ChevronRight, X, Info,
  Check, Image as ImageIcon, Upload, ChevronDown, Sparkles,
  Package, Car, Home, PaintBucket, FileText, Calculator, Loader2
} from "lucide-react"

interface Cat { id: string; name: string; slug: string; children?: { id: string; name: string; slug: string }[] }

interface PublishData {
  type: string
  categoryId: string
  categoryName: string
  condition: string
  title: string
  description: string
  images: string[]
  stock: number
  sku: string
  price: string
  originalPrice: string
  freeShipping: boolean
  shippingCost: string
  warranty: string
  warrantyTime: string
  warrantyUnit: string
  offersPickup: boolean
}

const defaultData: PublishData = {
  type: "productos",
  categoryId: "",
  categoryName: "",
  condition: "new",
  title: "",
  description: "",
  images: [],
  stock: 1,
  sku: "",
  price: "",
  originalPrice: "",
  freeShipping: false,
  shippingCost: "",
  warranty: "factory",
  warrantyTime: "60",
  warrantyUnit: "days",
  offersPickup: true,
}

const fmt = (v: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(v)

interface Props {
  onClose: () => void
  onPublished: () => void
  editProduct?: {
    id: string; title: string; description: string | null; sku: string | null; price: number;
    originalPrice: number | null; stock: number; condition: string; freeShipping: boolean;
    shippingCost: number; categoryId: string | null; category: { name: string } | null; images: { url: string }[]
  }
}

export default function PublicarFlow({ onClose, onPublished, editProduct }: Props) {
  const [step, setStep] = useState(editProduct ? 4 : 0)
  const [data, setData] = useState<PublishData>(() => {
    if (editProduct) {
      return {
        ...defaultData,
        categoryId: editProduct.categoryId || "",
        categoryName: editProduct.category?.name || "",
        condition: editProduct.condition,
        title: editProduct.title,
        description: editProduct.description || "",
        images: editProduct.images.map(i => i.url),
        stock: editProduct.stock,
        sku: editProduct.sku || "",
        price: String(editProduct.price),
        originalPrice: editProduct.originalPrice ? String(editProduct.originalPrice) : "",
        freeShipping: editProduct.freeShipping,
        shippingCost: String(editProduct.shippingCost || ""),
      }
    }
    return { ...defaultData }
  })
  const [categories, setCategories] = useState<Cat[]>([])
  const [catSearch, setCatSearch] = useState("")
  const [busy, setBusy] = useState(false)
  const [imageInput, setImageInput] = useState("")
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d || [])).catch(() => {})
  }, [])

  const upd = (partial: Partial<PublishData>) => setData(prev => ({ ...prev, ...partial }))
  const nextStep = () => { setStep(s => s + 1); mainRef.current?.scrollTo(0, 0) }
  const prevStep = () => { setStep(s => Math.max(0, s - 1)); mainRef.current?.scrollTo(0, 0) }
  const goToStep = (t: number) => { setStep(t); mainRef.current?.scrollTo(0, 0) }

  // Flatten categories
  const flatCats: { id: string; name: string; display: string }[] = []
  categories.forEach(c => {
    flatCats.push({ id: c.id, name: c.name, display: c.name })
    c.children?.forEach(sub => flatCats.push({ id: sub.id, name: sub.name, display: `${c.name} > ${sub.name}` }))
  })
  const filteredCats = catSearch
    ? flatCats.filter(c => c.display.toLowerCase().includes(catSearch.toLowerCase()))
    : flatCats

  const addImage = () => {
    if (imageInput.trim() && !data.images.includes(imageInput.trim())) {
      upd({ images: [...data.images, imageInput.trim()] })
      setImageInput("")
    }
  }
  const removeImage = (idx: number) => upd({ images: data.images.filter((_, i) => i !== idx) })

  const publish = async () => {
    setBusy(true)
    try {
      const body: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        sku: data.sku || undefined,
        price: parseFloat(data.price),
        originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : null,
        stock: data.stock,
        condition: data.condition,
        freeShipping: data.freeShipping,
        shippingCost: data.shippingCost ? parseFloat(data.shippingCost) : 0,
        images: data.images,
        categoryId: data.categoryId,
      }
      const isEdit = !!editProduct
      const r = await fetch("/api/dashboard/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editProduct!.id, ...body } : body),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => null)
        throw new Error(err?.error || "Error al guardar")
      }
      onPublished()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al publicar")
    }
    setBusy(false)
  }

  const canPublish = data.title && data.categoryId && data.price && parseFloat(data.price) > 0

  // ==========================================
  // PASO 0: ¿Qué vas a publicar?
  // ==========================================
  if (step === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-auto" ref={mainRef}>
        <div className="absolute top-0 left-0 w-full h-[45vh] bg-[#FFF159] z-0" />
        <div className="absolute bottom-0 left-0 w-full h-[55vh] bg-[#ebebeb] z-0" />

        <div className="relative z-10 p-4">
          <button onClick={onClose} className="flex items-center text-slate-700 font-medium text-sm hover:underline">
            <X size={18} className="mr-1" /> Cerrar
          </button>
        </div>

        <div className="relative z-10 flex flex-col items-center pt-[8vh] px-4 flex-1">
          <h1 className="text-[28px] md:text-[32px] font-medium text-[#333] mb-12 text-center leading-tight">
            ¡Hola! Antes que nada contanos,<br />¿qué vas a publicar?
          </h1>

          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8">
            {[
              { icon: Package, label: "Productos" },
              { icon: Car, label: "Vehículos" },
              { icon: Home, label: "Inmuebles" },
              { icon: PaintBucket, label: "Servicios" },
            ].map((item, i) => (
              <div
                key={i}
                onClick={() => { upd({ type: item.label.toLowerCase() }); nextStep() }}
                className="bg-white w-[150px] h-[150px] rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4 group"
              >
                <div className="text-slate-700 group-hover:text-[#3483fa] transition-colors relative">
                  <item.icon size={52} strokeWidth={1} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#FFF159] rounded-sm -z-10 opacity-80 mix-blend-multiply" />
                </div>
                <span className="text-[14px] text-slate-700 font-light group-hover:font-medium group-hover:text-[#3483fa]">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 text-slate-600 bg-white/50 px-4 py-2 rounded-lg">
            <FileText size={20} className="text-slate-400" />
            <div className="text-[13px] leading-tight">
              Para subir muchos productos, podés ir al publicador masivo.
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // LAYOUT COMÚN PARA PASOS 1+
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 bg-[#ebebeb] flex flex-col overflow-auto" ref={mainRef}>
      {/* Header */}
      <header className="pt-6 pb-4 px-4 md:px-8 max-w-[900px] mx-auto flex items-center justify-between w-full">
        <button onClick={step <= 1 ? onClose : prevStep} className="flex items-center text-[#3483fa] font-medium text-[14px] hover:underline">
          <ChevronLeft size={18} className="mr-0.5" /> {step <= 1 ? "Cerrar" : "Anterior"}
        </button>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
          <X size={20} />
        </button>
      </header>

      <main className="max-w-[800px] w-full mx-auto px-4 md:px-8 flex-1 pb-20">

        {/* ==========================================
            PASO 1: Categoría
           ========================================== */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <p className="text-[12px] text-slate-500 mb-1">Paso 1 de 5</p>
              <h2 className="text-[26px] font-medium leading-tight">Seleccioná la categoría de tu producto</h2>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6">
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar categoría..."
                    value={catSearch}
                    onChange={e => setCatSearch(e.target.value)}
                    className="w-full border-2 border-[#3483fa] rounded-md pl-11 pr-4 py-3 text-[14px] text-slate-800 outline-none"
                  />
                </div>

                {filteredCats.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">No se encontraron categorías. Verificá el término de búsqueda.</p>
                )}

                <div className="flex flex-col border border-slate-200 rounded-md max-h-[400px] overflow-y-auto">
                  {filteredCats.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => { upd({ categoryId: cat.id, categoryName: cat.display }); nextStep() }}
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${data.categoryId === cat.id ? "bg-blue-50" : ""}`}
                    >
                      <span className="text-[14px] text-slate-700">{cat.display}</span>
                      <ChevronRight size={16} className="text-[#3483fa]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            PASO 2: Condición
           ========================================== */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6">
              <p className="text-[12px] text-slate-500 mb-1">Paso 2 de 5</p>
              <h2 className="text-[26px] font-medium leading-tight">Completá los datos del producto</h2>
            </div>

            {/* Producto seleccionado */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-4">
              <div className="p-6">
                <h3 className="text-[16px] font-medium text-slate-800 mb-1">Categoría seleccionada</h3>
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center">
                    <Package size={20} className="text-[#3483fa]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-slate-800">{data.categoryName}</p>
                    <button onClick={() => goToStep(1)} className="text-[#3483fa] font-medium text-[12px] hover:underline">Cambiar categoría</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-[16px] font-medium text-slate-800 mb-1">Condición</h3>
                <p className="text-[13px] text-slate-500 mb-6">Indicá la condición de tu producto.</p>

                <div className="bg-[#f5f5f5] border-l-4 border-[#3483fa] p-4 rounded-r-md flex gap-3 mb-6">
                  <Info size={18} className="text-[#3483fa] flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-slate-700">Si tuvo algún tipo de uso, seleccioná usado.</p>
                </div>

                <div className="flex flex-col gap-4 pl-2">
                  {[
                    { value: "new", label: "Nuevo" },
                    { value: "used", label: "Usado" },
                    { value: "refurbished", label: "Reacondicionado" },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="condicion"
                        checked={data.condition === opt.value}
                        onChange={() => upd({ condition: opt.value })}
                        className="w-4 h-4 text-[#3483fa] focus:ring-[#3483fa]"
                      />
                      <span className="text-[14px] text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 p-6 border-t border-slate-100 bg-slate-50/30">
                <button onClick={prevStep} className="text-slate-400 hover:text-slate-600 font-medium text-[14px] px-4 py-2 transition-colors">Cancelar</button>
                <button onClick={nextStep} className="bg-[#3483fa] hover:bg-blue-600 text-white font-medium text-[14px] px-8 py-2.5 rounded transition-colors shadow-sm">Confirmar</button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            PASO 3: Título
           ========================================== */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6">
              <p className="text-[12px] text-slate-500 mb-1">Paso 2 de 5</p>
              <h2 className="text-[26px] font-medium leading-tight">Título de tu publicación</h2>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-[16px] font-medium text-slate-800 mb-1">Título</h3>
                <p className="text-[13px] text-slate-500">Incluí producto, marca, modelo y características principales.</p>
              </div>

              <div className="p-6">
                <div className="bg-[#f5f5f5] border-l-4 border-[#3483fa] p-4 rounded-r-md flex gap-3 mb-6">
                  <Info size={18} className="text-[#3483fa] flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-slate-700">No incluyas datos de contacto o condiciones de venta, como cuotas o envíos gratis.</p>
                </div>

                <div className="relative mb-2">
                  <input
                    type="text"
                    value={data.title}
                    onChange={e => upd({ title: e.target.value.slice(0, 60) })}
                    placeholder="Ej: Celular Samsung Galaxy A56 5g 256gb 8gb Ram"
                    className="w-full border-2 border-[#3483fa] rounded-md px-4 py-3.5 text-[14px] text-slate-800 outline-none"
                  />
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-[12px] text-slate-400">Sé específico: marca, modelo, color, talle</span>
                  <span className={`text-[12px] ${data.title.length > 55 ? "text-orange-500" : "text-slate-400"}`}>{data.title.length} / 60</span>
                </div>
              </div>

              <div className="flex justify-end gap-4 p-6 border-t border-slate-100 bg-slate-50/30">
                <button onClick={prevStep} className="text-slate-400 hover:text-slate-600 font-medium text-[14px] px-6 py-2.5 transition-colors">Cancelar</button>
                <button
                  onClick={nextStep}
                  disabled={!data.title.trim()}
                  className={`font-medium text-[14px] px-8 py-2.5 rounded transition-colors shadow-sm ${data.title.trim() ? "bg-[#3483fa] hover:bg-blue-600 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            PASO 4: Fotos
           ========================================== */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6">
              <p className="text-[12px] text-slate-500 mb-1">Paso 3 de 5</p>
              <h2 className="text-[26px] font-medium leading-tight">Fotos de tu producto</h2>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-[16px] font-medium text-slate-800 mb-1">Fotos</h3>
                <p className="text-[13px] text-slate-500">Subí buenas fotos para que el producto se destaque. Podés agregar hasta 10.</p>
              </div>

              <div className="p-6">
                {/* Agregar por URL */}
                <div className="flex gap-3 mb-6">
                  <input
                    type="text"
                    value={imageInput}
                    onChange={e => setImageInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addImage())}
                    placeholder="Pegar URL de imagen..."
                    className="flex-1 border border-slate-300 rounded-md px-4 py-2.5 text-[14px] outline-none focus:border-[#3483fa]"
                  />
                  <button
                    onClick={addImage}
                    disabled={!imageInput.trim() || data.images.length >= 10}
                    className="bg-[#3483fa] hover:bg-blue-600 text-white px-6 py-2.5 rounded text-[14px] font-medium disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                  >
                    Agregar
                  </button>
                </div>

                {/* Grid de imágenes */}
                <div className="flex flex-wrap gap-4">
                  {data.images.map((url, idx) => (
                    <div key={idx} className="w-[120px] h-[120px] border border-slate-200 rounded relative overflow-hidden bg-white group">
                      <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = "" }} />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      {idx === 0 && <div className="absolute bottom-0 left-0 w-full bg-slate-900/80 text-white text-[10px] font-bold text-center py-1">PORTADA</div>}
                    </div>
                  ))}
                  {data.images.length < 10 && (
                    <label className="w-[120px] h-[120px] border-2 border-dashed border-[#3483fa]/50 hover:border-[#3483fa] hover:bg-blue-50/50 transition-colors rounded cursor-pointer flex flex-col items-center justify-center gap-2 text-[#3483fa]">
                      <Upload size={24} strokeWidth={1.5} />
                      <span className="text-[12px] font-medium">URL</span>
                    </label>
                  )}
                </div>

                {data.images.length === 0 && (
                  <p className="text-sm text-slate-400 mt-4">Todavía no agregaste fotos. Pegá la URL de una imagen arriba.</p>
                )}
              </div>

              <div className="flex justify-end gap-4 p-6 border-t border-slate-100 bg-slate-50/30">
                <button onClick={prevStep} className="text-slate-400 hover:text-slate-600 font-medium text-[14px] px-6 py-2.5 transition-colors">Cancelar</button>
                <button onClick={nextStep} className="bg-[#3483fa] hover:bg-blue-600 text-white font-medium text-[14px] px-8 py-2.5 rounded transition-colors shadow-sm">Confirmar</button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            PASO 5: Descripción
           ========================================== */}
        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6">
              <p className="text-[12px] text-slate-500 mb-1">Paso 3 de 5</p>
              <h2 className="text-[26px] font-medium leading-tight">Descripción del producto</h2>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-[16px] font-medium text-slate-800 mb-1">Descripción <span className="text-slate-400 font-normal text-sm">| Opcional</span></h3>
                <p className="text-[13px] text-slate-500">Detallá las principales características de tu producto.</p>
              </div>

              <div className="p-6">
                <textarea
                  value={data.description}
                  onChange={e => upd({ description: e.target.value })}
                  rows={8}
                  placeholder="Describí tu producto con el mayor detalle posible. Incluí materiales, dimensiones, funcionalidades, etc."
                  className="w-full border border-slate-300 rounded-md px-4 py-3 text-[14px] text-slate-800 outline-none focus:border-[#3483fa] resize-none"
                />
                <p className="text-[12px] text-slate-400 mt-2">{data.description.length} caracteres</p>
              </div>

              <div className="flex justify-end gap-4 p-6 border-t border-slate-100 bg-slate-50/30">
                <button onClick={prevStep} className="text-slate-400 hover:text-slate-600 font-medium text-[14px] px-6 py-2.5 transition-colors">Volver</button>
                <button onClick={nextStep} className="bg-[#3483fa] hover:bg-blue-600 text-white font-medium text-[14px] px-8 py-2.5 rounded transition-colors shadow-sm">Continuar</button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            PASO 6: Stock y SKU
           ========================================== */}
        {step === 6 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6">
              <p className="text-[12px] text-slate-500 mb-1">Paso 4 de 5</p>
              <h2 className="text-[26px] font-medium leading-tight">Stock y código de identificación</h2>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-[16px] font-medium text-slate-800 mb-1">Stock en tu depósito y código de identificación (SKU)</h3>
                <p className="text-[13px] text-slate-500">Indicá cuántas unidades tenés a la venta y asigná un código interno.</p>
              </div>

              <div className="p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-[12px] font-medium text-slate-700 mb-2">Stock en tu depósito</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={data.stock}
                      onChange={e => upd({ stock: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full border border-slate-300 rounded-md px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-[#3483fa]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-slate-500">{data.stock === 1 ? "unidad" : "unidades"}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-[12px] font-medium text-slate-700 mb-2">Código de identificación (SKU) <span className="text-slate-400">Opcional</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      value={data.sku}
                      onChange={e => upd({ sku: e.target.value })}
                      placeholder="Ej: SKU-001"
                      className="w-full border border-slate-300 rounded-md px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-[#3483fa]"
                    />
                    <Info size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3483fa] cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 p-6 border-t border-slate-100 bg-slate-50/30">
                <button onClick={prevStep} className="text-[#3483fa] hover:bg-blue-50 font-medium text-[14px] px-6 py-2.5 rounded transition-colors">Cancelar</button>
                <button onClick={nextStep} className="bg-[#3483fa] hover:bg-blue-600 text-white font-medium text-[14px] px-8 py-2.5 rounded transition-colors shadow-sm">Confirmar</button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            PASO 7: Condiciones de venta (Precio, Envío, Retiro, Garantía)
           ========================================== */}
        {step === 7 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6">
              <p className="text-[12px] text-slate-500 mb-1">Paso 5 de 5</p>
              <h2 className="text-[26px] font-medium leading-tight">Para terminar, definamos las condiciones de venta</h2>
            </div>

            {/* PRECIO */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-4">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-[16px] font-medium text-slate-800 mb-1">Precio</h3>
                <p className="text-[13px] text-slate-500">Indicá a cuánto querés vender el producto.</p>
              </div>
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-[40%]">
                    <label className="block text-[12px] font-medium text-slate-700 mb-2">Precio de venta <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-[16px]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.price}
                        onChange={e => upd({ price: e.target.value })}
                        className="w-full border border-slate-300 rounded-md pl-8 pr-4 py-3.5 text-[16px] font-semibold text-slate-800 focus:border-[#3483fa] outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-[40%]">
                    <label className="block text-[12px] font-medium text-slate-700 mb-2">Precio original <span className="text-slate-400">(tachado)</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-[16px]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.originalPrice}
                        onChange={e => upd({ originalPrice: e.target.value })}
                        className="w-full border border-slate-300 rounded-md pl-8 pr-4 py-3.5 text-[16px] text-slate-800 focus:border-[#3483fa] outline-none"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                </div>

                {data.price && parseFloat(data.price) > 0 && (
                  <div className="mt-4 bg-[#f5f5f5] rounded-md p-4 flex items-center gap-2 text-[12px] text-slate-600">
                    <Calculator size={16} className="text-slate-400" />
                    <p>Precio final: <strong>{fmt(parseFloat(data.price))}</strong>{data.originalPrice && parseFloat(data.originalPrice) > parseFloat(data.price) && (
                      <span className="ml-2 text-green-600 font-medium">
                        {Math.round((1 - parseFloat(data.price) / parseFloat(data.originalPrice)) * 100)}% OFF
                      </span>
                    )}</p>
                  </div>
                )}
              </div>
            </div>

            {/* FORMA DE ENTREGA */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-4">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-[16px] font-medium text-slate-800 mb-1">Forma de entrega</h3>
                <p className="text-[13px] text-slate-500">Configurá las opciones de envío.</p>
              </div>
              <div className="p-6">
                <div className="border border-slate-200 rounded-md p-5">
                  <div className="flex flex-col gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="envio"
                        checked={data.freeShipping}
                        onChange={() => upd({ freeShipping: true, shippingCost: "0" })}
                        className="w-4 h-4 text-[#3483fa] focus:ring-[#3483fa]"
                      />
                      <div className="text-[14px] text-slate-800">
                        <span className="font-medium">Ofrecer envío gratis</span>
                        <span className="block text-[12px] text-green-600">Tus productos aparecen con mayor destaque</span>
                      </div>
                    </label>
                    <div className="w-full h-px bg-slate-100" />
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="envio"
                        checked={!data.freeShipping}
                        onChange={() => upd({ freeShipping: false })}
                        className="w-4 h-4 text-[#3483fa] focus:ring-[#3483fa]"
                      />
                      <span className="text-[14px] text-slate-800">Ofrecer envío a cargo del comprador</span>
                    </label>
                    {!data.freeShipping && (
                      <div className="pl-7 mt-1">
                        <label className="block text-[12px] font-medium text-slate-700 mb-1">Costo de envío</label>
                        <div className="relative w-48">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.shippingCost}
                            onChange={e => upd({ shippingCost: e.target.value })}
                            className="w-full border border-slate-300 rounded px-7 py-2 text-[14px] outline-none focus:border-[#3483fa]"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RETIRO EN PERSONA */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-4">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-[16px] font-medium text-slate-800 mb-1">Retiro en persona</h3>
                <p className="text-[13px] text-slate-500">Elegí si ofrecés o no retiro en persona.</p>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="retiro" checked={data.offersPickup} onChange={() => upd({ offersPickup: true })} className="w-4 h-4 text-[#3483fa] focus:ring-[#3483fa]" />
                  <span className="text-[14px] text-slate-800">Ofrezco</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="retiro" checked={!data.offersPickup} onChange={() => upd({ offersPickup: false })} className="w-4 h-4 text-[#3483fa] focus:ring-[#3483fa]" />
                  <span className="text-[14px] text-slate-800">No ofrezco</span>
                </label>
              </div>
            </div>

            {/* GARANTÍA */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-4">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-[16px] font-medium text-slate-800 mb-1">Garantía</h3>
                <p className="text-[13px] text-slate-500">Indicá el tipo de garantía que ofrecés.</p>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="garantia" checked={data.warranty === "seller"} onChange={() => upd({ warranty: "seller" })} className="w-4 h-4 text-[#3483fa] focus:ring-[#3483fa]" />
                  <span className="text-[14px] text-slate-800">Garantía del vendedor</span>
                </label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="garantia" checked={data.warranty === "factory"} onChange={() => upd({ warranty: "factory" })} className="w-4 h-4 text-[#3483fa] focus:ring-[#3483fa]" />
                    <span className="text-[14px] text-slate-800">Garantía de fábrica</span>
                  </label>
                  {(data.warranty === "factory" || data.warranty === "seller") && (
                    <div className="pl-7 flex items-center gap-2 w-56">
                      <input
                        type="number"
                        min="1"
                        value={data.warrantyTime}
                        onChange={e => upd({ warrantyTime: e.target.value })}
                        className="w-16 border border-slate-300 rounded px-2 py-1.5 text-[14px] outline-none focus:border-[#3483fa] text-center"
                      />
                      <div className="flex-1 relative border border-slate-300 rounded overflow-hidden">
                        <select
                          value={data.warrantyUnit}
                          onChange={e => upd({ warrantyUnit: e.target.value })}
                          className="w-full appearance-none bg-transparent px-3 py-1.5 text-[14px] outline-none cursor-pointer"
                        >
                          <option value="days">Días</option>
                          <option value="months">Meses</option>
                          <option value="years">Años</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                      </div>
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="garantia" checked={data.warranty === "none"} onChange={() => upd({ warranty: "none" })} className="w-4 h-4 text-[#3483fa] focus:ring-[#3483fa]" />
                  <span className="text-[14px] text-slate-800">Sin garantía</span>
                </label>
              </div>
            </div>

            {/* RESUMEN ANTES DE PUBLICAR */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-4">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-[16px] font-medium text-slate-800 mb-1">Resumen de tu publicación</h3>
              </div>
              <div className="p-6 text-[14px] text-slate-700 space-y-3">
                <div className="flex justify-between"><span className="text-slate-500">Título</span><span className="font-medium text-right max-w-[60%] truncate">{data.title || "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Categoría</span><span className="font-medium">{data.categoryName || "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Condición</span><span className="font-medium">{data.condition === "new" ? "Nuevo" : data.condition === "used" ? "Usado" : "Reacondicionado"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Precio</span><span className="font-medium">{data.price ? fmt(parseFloat(data.price)) : "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Stock</span><span className="font-medium">{data.stock} {data.stock === 1 ? "unidad" : "unidades"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Fotos</span><span className="font-medium">{data.images.length}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Envío</span><span className="font-medium">{data.freeShipping ? "Gratis" : data.shippingCost ? fmt(parseFloat(data.shippingCost)) : "A cargo del comprador"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Retiro</span><span className="font-medium">{data.offersPickup ? "Sí" : "No"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Garantía</span><span className="font-medium">{data.warranty === "none" ? "Sin garantía" : `${data.warrantyTime} ${data.warrantyUnit === "days" ? "días" : data.warrantyUnit === "months" ? "meses" : "años"} (${data.warranty === "factory" ? "fábrica" : "vendedor"})`}</span></div>
              </div>
            </div>

            {/* BOTÓN PUBLICAR */}
            <div className="flex justify-end gap-4 mb-16">
              <button onClick={prevStep} className="text-slate-400 hover:text-slate-600 font-medium text-[14px] px-6 py-2.5 transition-colors">Volver</button>
              <button
                onClick={publish}
                disabled={busy || !canPublish}
                className={`font-medium text-[15px] px-12 py-3.5 rounded transition-colors shadow-md flex items-center gap-2 ${canPublish && !busy ? "bg-[#3483fa] hover:bg-blue-600 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
              >
                {busy && <Loader2 size={18} className="animate-spin" />}
                {busy ? "Publicando..." : editProduct ? "Guardar cambios" : "Publicar"}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
