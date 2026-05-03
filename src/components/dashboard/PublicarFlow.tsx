"use client"
import React, { useState, useEffect, useRef, ChangeEvent } from "react"
import { WholesalePriceManager } from "./WholesalePriceManager"
import {
  ChevronLeft, Search, ChevronRight, X, Info,
  Check, Image as ImageIcon, Upload, ChevronDown, Sparkles,
  Package, Car, Home, PaintBucket, FileText, Calculator, Loader2,
  Video, GripVertical, AlertTriangle, Camera
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
  videoUrl: string
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
  videoUrl: "",
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
  const [uploadingImages, setUploadingImages] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [videoError, setVideoError] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiImageAnalysis, setAiImageAnalysis] = useState<any>(null)
  const [aiTitleAlts, setAiTitleAlts] = useState<string[]>([])
  const mainRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

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

  // Compress & resize image to max 1200x1200, quality 0.82, output as base64 webp/jpeg
  const compressImage = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new window.Image()
        img.onload = () => {
          const MAX = 1200
          let w = img.width, h = img.height
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX }
            else { w = Math.round(w * MAX / h); h = MAX }
          }
          const canvas = document.createElement("canvas")
          canvas.width = w; canvas.height = h
          const ctx = canvas.getContext("2d")!
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, w, h)
          ctx.drawImage(img, 0, 0, w, h)
          // Try webp first, fallback to jpeg
          let dataUrl = canvas.toDataURL("image/webp", 0.82)
          if (!dataUrl.startsWith("data:image/webp")) {
            dataUrl = canvas.toDataURL("image/jpeg", 0.82)
          }
          resolve(dataUrl)
        }
        img.onerror = () => reject(new Error("Error al procesar imagen"))
        img.src = reader.result as string
      }
      reader.onerror = () => reject(new Error("Error al leer archivo"))
      reader.readAsDataURL(file)
    })
  }

  const handleFileUpload = async (files: FileList | File[]) => {
    const remaining = 10 - data.images.length
    if (remaining <= 0) return
    const validFiles = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, remaining)
    if (validFiles.length === 0) return

    setUploadingImages(true)
    try {
      const compressed = await Promise.all(validFiles.map(f => compressImage(f)))
      upd({ images: [...data.images, ...compressed] })
    } catch (e) { console.error("Error compressing images:", e) }
    setUploadingImages(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files)
  }

  const handleVideoFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoError("")
    if (!file.type.startsWith("video/")) { setVideoError("El archivo debe ser un video"); return }
    if (file.size > 50 * 1024 * 1024) { setVideoError("El video no debe superar los 50MB"); return }
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      if (video.duration < 10) { setVideoError("El video debe durar al menos 10 segundos"); return }
      if (video.duration > 60) { setVideoError("El video no debe durar más de 60 segundos"); return }
      // Convert to base64 for storage (or use URL.createObjectURL for preview)
      const reader = new FileReader()
      reader.onload = () => upd({ videoUrl: reader.result as string })
      reader.readAsDataURL(file)
    }
    video.src = URL.createObjectURL(file)
  }

  const addImage = () => {
    if (imageInput.trim() && !data.images.includes(imageInput.trim()) && data.images.length < 10) {
      upd({ images: [...data.images, imageInput.trim()] })
      setImageInput("")
    }
  }
  const removeImage = (idx: number) => upd({ images: data.images.filter((_, i) => i !== idx) })
  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= data.images.length) return
    const imgs = [...data.images]
    const [moved] = imgs.splice(from, 1)
    imgs.splice(to, 0, moved)
    upd({ images: imgs })
  }

  // ── AI: Generate listing from images ──
  const aiGenerateListing = async () => {
    if (data.images.length === 0) return
    setAiLoading(true)
    setAiImageAnalysis(null)
    try {
      const res = await fetch("/api/ai/enhance-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_listing", images: data.images.slice(0, 3) }),
      })
      const result = await res.json()
      if (result.title) {
        upd({ title: result.title, description: result.description || data.description })
        setAiImageAnalysis(result)
        if (result.condition_suggestion) upd({ condition: result.condition_suggestion })
      }
    } catch (e) { console.error("AI error:", e) }
    setAiLoading(false)
  }

  // ── AI: Improve description ──
  const aiImproveDescription = async () => {
    if (!data.description && !data.title) return
    setAiLoading(true)
    try {
      const res = await fetch("/api/ai/enhance-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "improve_description", title: data.title, description: data.description, category: data.categoryName }),
      })
      const result = await res.json()
      if (result.description) upd({ description: result.description })
    } catch (e) { console.error("AI error:", e) }
    setAiLoading(false)
  }

  // ── AI: Generate title alternatives ──
  const aiGenerateTitle = async () => {
    if (!data.description && data.images.length === 0) return
    setAiLoading(true)
    setAiTitleAlts([])
    try {
      const res = await fetch("/api/ai/enhance-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_title", description: data.description, category: data.categoryName }),
      })
      const result = await res.json()
      if (result.title) upd({ title: result.title })
      if (result.alternatives) setAiTitleAlts(result.alternatives)
    } catch (e) { console.error("AI error:", e) }
    setAiLoading(false)
  }

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
              <p className="text-[14px] text-slate-500 mt-1">Escribí el nombre de tu producto o buscá una categoría</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6">
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Ej: celular, zapatillas, heladera..."
                    value={catSearch}
                    onChange={e => setCatSearch(e.target.value)}
                    autoFocus
                    className="w-full border-2 border-[#3483fa] rounded-md pl-11 pr-4 py-3 text-[14px] text-slate-800 outline-none"
                  />
                </div>

                {categories.length === 0 && (
                  <div className="text-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-[#3483fa] border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Cargando categorías...</p>
                  </div>
                )}

                {categories.length > 0 && catSearch.trim() === "" && (
                  <div className="flex flex-col border border-slate-200 rounded-md max-h-[420px] overflow-y-auto">
                    {categories.map((parentCat) => (
                      <div key={parentCat.id}>
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50 transition-colors border-b border-slate-100 bg-slate-50/50"
                          onClick={() => { upd({ categoryId: parentCat.id, categoryName: parentCat.name }); nextStep() }}
                        >
                          <span className="text-[14px] font-medium text-slate-800">{parentCat.name}</span>
                          <span className="text-[12px] text-slate-400">{parentCat.children?.length || 0} sub</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {categories.length > 0 && catSearch.trim() !== "" && filteredCats.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">No se encontraron categorías para &ldquo;{catSearch}&rdquo;. Probá con otro término.</p>
                )}

                {catSearch.trim() !== "" && filteredCats.length > 0 && (
                  <div className="flex flex-col border border-slate-200 rounded-md max-h-[420px] overflow-y-auto">
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
                )}
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

                {/* AI Title Generator */}
                <button
                  onClick={aiGenerateTitle}
                  disabled={aiLoading || (!data.description && data.images.length === 0)}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 rounded-lg font-medium text-[13px] hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all"
                >
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {aiLoading ? "Generando..." : "✨ Generar título con IA"}
                </button>

                {/* AI Title Alternatives */}
                {aiTitleAlts.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[11px] text-purple-600 font-medium">Alternativas sugeridas:</p>
                    {aiTitleAlts.map((alt, i) => (
                      <button
                        key={i}
                        onClick={() => upd({ title: alt })}
                        className="w-full text-left text-[13px] text-slate-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md px-3 py-2 transition-colors"
                      >
                        {alt}
                      </button>
                    ))}
                  </div>
                )}
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
            PASO 4: Fotos y Video
           ========================================== */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6">
              <p className="text-[12px] text-slate-500 mb-1">Paso 3 de 5</p>
              <h2 className="text-[26px] font-medium leading-tight">Fotos y video de tu producto</h2>
              <p className="text-[14px] text-slate-500 mt-1">Las buenas fotos aumentan tus ventas. Mínimo 1, máximo 10.</p>
            </div>

            {/* Requisitos de la imagen de portada */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[13px] text-amber-800">
                <p className="font-semibold mb-1">Requisitos para la foto de portada (1ra imagen):</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Fondo <strong>blanco</strong> y limpio</li>
                  <li>Sin logos, marcas de agua ni textos</li>
                  <li>Producto centrado, bien iluminado</li>
                  <li>Las imágenes se redimensionan y comprimen automáticamente</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-[16px] font-medium text-slate-800 mb-1">Fotos <span className="text-slate-400 font-normal text-sm">| {data.images.length}/10</span></h3>
                <p className="text-[13px] text-slate-500">Arrastrá archivos o hacé clic para subir. También podés pegar una URL.</p>
              </div>

              <div className="p-6">
                {/* Drag & Drop Zone */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => e.target.files && handleFileUpload(e.target.files)}
                />
                {data.images.length < 10 && (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 mb-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${dragOver ? "border-[#3483fa] bg-blue-50" : "border-slate-300 hover:border-[#3483fa] hover:bg-blue-50/30"}`}
                  >
                    {uploadingImages ? (
                      <>
                        <Loader2 size={32} className="text-[#3483fa] animate-spin" />
                        <p className="text-[14px] text-slate-500">Procesando imágenes...</p>
                      </>
                    ) : (
                      <>
                        <Camera size={32} className="text-[#3483fa]" strokeWidth={1.5} />
                        <p className="text-[14px] text-slate-600 font-medium">Arrastrá tus fotos acá o hacé clic para seleccionar</p>
                        <p className="text-[12px] text-slate-400">JPG, PNG, WEBP — Se comprimen automáticamente</p>
                      </>
                    )}
                  </div>
                )}

                {/* URL input */}
                <div className="flex gap-3 mb-5">
                  <input
                    type="text"
                    value={imageInput}
                    onChange={e => setImageInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addImage())}
                    placeholder="O pegá una URL de imagen..."
                    className="flex-1 border border-slate-300 rounded-md px-4 py-2.5 text-[14px] outline-none focus:border-[#3483fa]"
                  />
                  <button
                    onClick={addImage}
                    disabled={!imageInput.trim() || data.images.length >= 10}
                    className="bg-[#3483fa] hover:bg-blue-600 text-white px-5 py-2.5 rounded text-[14px] font-medium disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                  >
                    Agregar
                  </button>
                </div>

                {/* Grid de imágenes */}
                {data.images.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {data.images.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <div className={`w-[110px] h-[110px] border-2 rounded-lg overflow-hidden bg-white ${idx === 0 ? "border-[#3483fa]" : "border-slate-200"}`}>
                          <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                        </div>
                        {/* Label */}
                        {idx === 0 ? (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#3483fa] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">PORTADA</div>
                        ) : (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{idx + 1}</div>
                        )}
                        {/* Actions overlay */}
                        <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {idx > 0 && (
                            <button onClick={() => moveImage(idx, idx - 1)} className="bg-white/90 rounded-full p-1 hover:bg-white" title="Mover izquierda">
                              <ChevronLeft size={14} />
                            </button>
                          )}
                          <button onClick={() => removeImage(idx)} className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600" title="Eliminar">
                            <X size={14} />
                          </button>
                          {idx < data.images.length - 1 && (
                            <button onClick={() => moveImage(idx, idx + 1)} className="bg-white/90 rounded-full p-1 hover:bg-white" title="Mover derecha">
                              <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {data.images.length === 0 && !uploadingImages && (
                  <p className="text-sm text-slate-400 text-center py-2">Todavía no agregaste fotos.</p>
                )}

                {/* AI Generate from Images */}
                {data.images.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <button
                      onClick={aiGenerateListing}
                      disabled={aiLoading}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium text-[14px] hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {aiLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Sparkles size={18} />
                      )}
                      {aiLoading ? "Analizando imágenes con IA..." : "✨ Generar publicación con IA desde las fotos"}
                    </button>
                    <p className="text-[11px] text-slate-400 text-center mt-2">La IA analizará tus fotos y generará título, descripción y sugerencias automáticamente</p>

                    {/* AI Analysis Results */}
                    {aiImageAnalysis && (
                      <div className="mt-4 space-y-3">
                        {/* Generated Title */}
                        {aiImageAnalysis.title && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <p className="text-[11px] text-purple-600 font-medium mb-1">Título generado:</p>
                            <p className="text-[14px] text-purple-900 font-medium">{aiImageAnalysis.title}</p>
                          </div>
                        )}

                        {/* Category Suggestion */}
                        {aiImageAnalysis.category_suggestion && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-[11px] text-blue-600 font-medium mb-1">Categoría sugerida:</p>
                            <p className="text-[14px] text-blue-900">{aiImageAnalysis.category_suggestion}</p>
                          </div>
                        )}

                        {/* Price Range */}
                        {aiImageAnalysis.price_range && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-[11px] text-green-600 font-medium mb-1">Rango de precio estimado:</p>
                            <p className="text-[14px] text-green-900">
                              ${aiImageAnalysis.price_range.min?.toLocaleString()} - ${aiImageAnalysis.price_range.max?.toLocaleString()} ARS
                            </p>
                          </div>
                        )}

                        {/* Image Quality */}
                        {aiImageAnalysis.image_quality && aiImageAnalysis.image_quality.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-[11px] text-amber-600 font-medium mb-2">Análisis de calidad de fotos:</p>
                            {aiImageAnalysis.image_quality.map((iq: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-[12px] mb-1">
                                <span className={`font-bold ${iq.score >= 70 ? "text-green-600" : iq.score >= 40 ? "text-amber-600" : "text-red-600"}`}>
                                  Foto {iq.index + 1}: {iq.score}/100
                                </span>
                                {iq.issues?.length > 0 && (
                                  <span className="text-amber-700">— {iq.issues.join(", ")}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* SEO Keywords */}
                        {aiImageAnalysis.seo_keywords && (
                          <div className="flex flex-wrap gap-1.5">
                            {aiImageAnalysis.seo_keywords.map((kw: string) => (
                              <span key={kw} className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-full">
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Video */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-4">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-[16px] font-medium text-slate-800 mb-1 flex items-center gap-2">
                  <Video size={18} className="text-[#3483fa]" /> Video <span className="text-slate-400 font-normal text-sm">| Opcional</span>
                </h3>
                <p className="text-[13px] text-slate-500">Agregá un video de tu producto (10 seg mín. — 60 seg máx., hasta 50 MB).</p>
              </div>
              <div className="p-6">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoFile}
                />
                {!data.videoUrl ? (
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-300 hover:border-[#3483fa] rounded-lg p-6 flex flex-col items-center gap-2 transition-colors hover:bg-blue-50/30"
                  >
                    <Video size={28} className="text-slate-400" strokeWidth={1.5} />
                    <span className="text-[14px] text-slate-500 font-medium">Seleccionar video</span>
                    <span className="text-[12px] text-slate-400">MP4, MOV, WEBM — 10s a 60s</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <Check size={20} className="text-green-600" />
                    <span className="text-[14px] text-green-800 font-medium flex-1">Video cargado correctamente</span>
                    <button onClick={() => upd({ videoUrl: "" })} className="text-red-500 hover:text-red-700 text-[13px] font-medium">Eliminar</button>
                  </div>
                )}
                {videoError && (
                  <div className="mt-3 flex items-center gap-2 text-red-600 text-[13px]">
                    <AlertTriangle size={16} /> {videoError}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button onClick={prevStep} className="text-slate-400 hover:text-slate-600 font-medium text-[14px] px-6 py-2.5 transition-colors">Anterior</button>
              <button
                onClick={nextStep}
                disabled={data.images.length === 0}
                className={`font-medium text-[14px] px-8 py-2.5 rounded transition-colors shadow-sm ${data.images.length > 0 ? "bg-[#3483fa] hover:bg-blue-600 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
              >
                Confirmar
              </button>
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

                {/* AI Improve Description */}
                <button
                  onClick={aiImproveDescription}
                  disabled={aiLoading || (!data.description && !data.title)}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 rounded-lg font-medium text-[13px] hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all"
                >
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {aiLoading ? "Mejorando..." : "✨ Mejorar descripción con IA"}
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-1">La IA mejorará tu descripción con detalles técnicos y mejor redacción</p>
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

            {/* PRECIOS MAYORISTAS - Solo en edición */}
            {editProduct && (
              <div className="mb-4">
                <WholesalePriceManager 
                  productId={editProduct.id} 
                  basePrice={parseFloat(data.price) || editProduct.price} 
                />
              </div>
            )}

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
                <div className="flex justify-between"><span className="text-slate-500">Fotos</span><span className="font-medium">{data.images.length} {data.images.length === 1 ? "foto" : "fotos"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Video</span><span className="font-medium">{data.videoUrl ? "✓ Cargado" : "Sin video"}</span></div>
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
