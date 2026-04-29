"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Search, Edit, Trash2, Pause, Play, Plus, ChevronLeft, ChevronRight, MoreVertical, Eye, Copy, SlidersHorizontal, AlertCircle, Trophy, RotateCcw, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import PublicarFlow from "@/components/dashboard/PublicarFlow"

interface P { id: string; title: string; description: string | null; sku: string | null; price: number; originalPrice: number | null; stock: number; isActive: boolean; views: number; sales: number; condition: string; freeShipping: boolean; shippingCost: number; qualityScore: number; categoryId: string | null; category: { name: string } | null; images: { url: string }[] }
interface S { active: number; paused: number; lowStock: number; noSales: number }

const fmt = (v: number) => `$ ${v.toLocaleString("es-AR")}`
const qualityLabel = (s: number) => s >= 80 ? "Bien hecho" : s >= 60 ? "Bien hecho" : s >= 40 ? "Regular" : "Mejorar"
const qualityColor = (s: number) => s >= 60 ? "text-green-600" : s >= 40 ? "text-yellow-600" : "text-red-600"
const expLabel = (sales: number, views: number) => {
  if (views === 0) return "Neutral"
  const r = sales / views
  return r >= 0.1 ? "¡Bien hecho!" : r >= 0.05 ? "¡Bien hecho!" : r >= 0.02 ? "Mejorar" : "Mejorar"
}
const expColor = (sales: number, views: number) => {
  if (views === 0) return "text-gray-500"
  return sales / views >= 0.05 ? "text-green-600" : "text-orange-500"
}
const getRecommendation = (p: P) => {
  if (!p.isActive) return { label: "PERDIENDO", color: "bg-red-100 text-red-600", tip: "Reactivá tu publicación para no perder ventas.", action: "Reactivar" }
  if (p.stock <= 5 && p.stock > 0) return { label: "ATENCIÓN", color: "bg-yellow-100 text-yellow-700", tip: "Stock bajo. Reponé para no perder ventas.", action: "Reponer stock" }
  if (p.stock <= 0) return { label: "SIN STOCK", color: "bg-red-100 text-red-600", tip: "Agregá stock para volver a vender.", action: "Agregar stock" }
  if (p.freeShipping) return { label: "ACTIVA", color: "bg-green-100 text-green-700", tip: "Ofrecé envío gratis. Atraé compradores con el beneficio que más valoran.", action: "Ofrecer envío" }
  if (p.sales === 0 && p.views > 50) return { label: "ACTIVA", color: "bg-blue-100 text-blue-700", tip: "Otros vendedores ofrecen mejores condiciones.", action: "Mejorar condiciones" }
  return { label: "ACTIVA", color: "bg-green-100 text-green-700", tip: "", action: "" }
}

const TABS = [
  { id: "gestion", label: "Gestión de publicaciones" },
  { id: "promociones", label: "Central de promociones" },
  { id: "precios", label: "Gestión de precios" },
  { id: "stock", label: "Gestión de stock" },
]

export default function PublicacionesView() {
  const [products, setProducts] = useState<P[]>([])
  const [summary, setSummary] = useState<S | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showFlow, setShowFlow] = useState(false)
  const [editingProduct, setEditingProduct] = useState<P | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("gestion")
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (openMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [openMenu])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (filter !== "all") p.set("status", filter)
      p.set("page", String(page))
      p.set("limit", "25")
      const r = await fetch(`/api/dashboard/products?${p}`)
      const d = await r.json()
      setProducts(d.products || [])
      setSummary(d.summary || null)
      setTotalPages(d.totalPages || 1)
      setTotalCount(d.total || d.products?.length || 0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [filter, page])

  useEffect(() => { load() }, [load])

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return p.title.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q)
  })

  const openCreate = () => { setEditingProduct(null); setShowFlow(true) }
  const openEdit = (p: P) => { setEditingProduct(p); setShowFlow(true) }
  const handlePublished = () => { setShowFlow(false); setEditingProduct(null); load() }

  const toggle = async (id: string, active: boolean) => {
    await fetch("/api/dashboard/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive: active }) })
    load()
  }

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar publicación?")) return
    await fetch(`/api/dashboard/products?id=${id}`, { method: "DELETE" })
    load()
  }

  const toggleSelect = (id: string) => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(p => p.id)))
  }

  const bulkPause = async () => {
    for (const id of selected) await toggle(id, false)
    setSelected(new Set())
  }
  const bulkActivate = async () => {
    for (const id of selected) await toggle(id, true)
    setSelected(new Set())
  }
  const bulkDelete = async () => {
    if (!confirm(`¿Eliminar ${selected.size} publicaciones?`)) return
    for (const id of selected) await fetch(`/api/dashboard/products?id=${id}`, { method: "DELETE" })
    setSelected(new Set())
    load()
  }

  if (showFlow) {
    return (
      <PublicarFlow
        onClose={() => { setShowFlow(false); setEditingProduct(null) }}
        onPublished={handlePublished}
        editProduct={editingProduct || undefined}
      />
    )
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" /></div>

  const commissionRate = 0.13
  const shippingDiscount = 0.0

  return (
    <div className="space-y-0">
      {/* Tabs */}
      <div className="border-b bg-white -mx-6 -mt-6 px-6">
        <div className="flex items-center gap-8">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? "border-[#3483FA] text-[#3483FA]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="ml-auto">
            <Button onClick={openCreate} className="bg-[#3483FA] hover:bg-[#2968C8] text-white font-medium text-sm h-9">
              <Plus size={16} className="mr-1" /> Nueva publicación
            </Button>
          </div>
        </div>
      </div>

      {/* Alert Cards */}
      {summary && (
        <div className="flex gap-4 overflow-x-auto py-4 -mx-6 px-6">
          <button onClick={() => { setFilter("paused"); setPage(1) }} className="min-w-[240px] bg-white border rounded-lg p-4 text-left hover:shadow-sm transition-shadow flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 font-medium">Pendientes de corregir</span>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{summary.paused}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Revisá qué debés hacer para reactivarlas.</p>
          </button>
          <button onClick={() => { setFilter("no_sales"); setPage(1) }} className="min-w-[240px] bg-white border rounded-lg p-4 text-left hover:shadow-sm transition-shadow flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 font-medium">Para ganar la competencia</span>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{summary.noSales}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Revisá qué debés hacer para ser el vendedor destacado.</p>
          </button>
          <button onClick={() => { setFilter("low_stock"); setPage(1) }} className="min-w-[240px] bg-white border rounded-lg p-4 text-left hover:shadow-sm transition-shadow flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 font-medium">Para volver a vender</span>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{summary.lowStock}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Verificá si tus productos son los mismos del catálogo.</p>
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4 py-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por título, código o SKU"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:border-[#3483FA] focus:ring-1 focus:ring-[#3483FA] outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md px-3 py-2">
          <SlidersHorizontal size={16} /> Filtrar y ordenar
        </button>
        <span className="text-sm text-gray-500 whitespace-nowrap">{totalCount} publicaciones</span>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-2 flex items-center gap-4 mb-2">
          <span className="text-sm font-medium text-blue-800">{selected.size} seleccionadas</span>
          <button onClick={bulkPause} className="text-sm text-[#3483FA] hover:underline font-medium">Pausar</button>
          <button onClick={bulkActivate} className="text-sm text-[#3483FA] hover:underline font-medium">Reactivar</button>
          <button onClick={bulkDelete} className="text-sm text-red-600 hover:underline font-medium">Eliminar</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden flex flex-col" style={{ minHeight: "calc(100vh - 340px)" }}>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left text-xs text-gray-500 font-medium">
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-[#3483FA] focus:ring-[#3483FA]"
                  />
                </th>
                <th className="px-3 py-3">Publicación</th>
                <th className="px-3 py-3">Precio</th>
                <th className="px-3 py-3">Condiciones</th>
                <th className="px-3 py-3">Recibís</th>
                <th className="px-3 py-3">Métricas últ. 7 días</th>
                <th className="px-3 py-3">Calidad</th>
                <th className="px-3 py-3">Experiencia</th>
                <th className="px-3 py-3">Estado y recomendaciones</th>
                <th className="px-3 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => {
                const rec = getRecommendation(p)
                const comission = p.price * commissionRate
                const receives = p.price - comission - (p.freeShipping ? p.shippingCost : 0)
                const qualityNum = p.qualityScore
                const objectives = Math.max(1, Math.floor(qualityNum / 20))

                return (
                  <tr key={p.id} className="hover:bg-gray-50 group">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-gray-300 text-[#3483FA] focus:ring-[#3483FA]"
                      />
                    </td>
                    {/* Publicación */}
                    <td className="px-3 py-3 max-w-[200px]">
                      <div className="flex items-center gap-3">
                        <img src={p.images[0]?.url || "https://via.placeholder.com/40"} alt="" className="w-10 h-10 rounded object-cover bg-gray-100 shrink-0" />
                        <div className="min-w-0">
                          <a href={`/product/${p.id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-900 font-medium line-clamp-1 hover:text-[#3483FA]">
                            {p.title}
                          </a>
                          <div className="flex items-center gap-2 mt-0.5">
                            {p.sku && <span className="text-xs text-gray-400">#{p.sku}</span>}
                            {p.category && <span className="text-xs text-[#3483FA]">{p.category.name}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {p.stock <= 5 && p.stock > 0 && <span className="text-xs text-orange-500">Depósito: {p.stock} u.</span>}
                            {p.stock <= 0 && <span className="text-xs text-red-500 font-medium">Sin stock</span>}
                            {p.stock > 5 && <span className="text-xs text-gray-400">Depósito: {p.stock} u.</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Precio */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="font-medium text-sm">{fmt(p.price)}</div>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <div className="text-xs text-gray-400 line-through">{fmt(p.originalPrice)}</div>
                      )}
                    </td>
                    {/* Condiciones */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-600">
                        {p.originalPrice && p.originalPrice > p.price && (
                          <div>Con 1 precio mayorista</div>
                        )}
                        <div>{p.freeShipping ? (
                          <span className="text-green-600 font-medium">Ofrecés envío gratis</span>
                        ) : (
                          <span>Envío a cargo del comprador</span>
                        )}</div>
                      </div>
                    </td>
                    {/* Recibís */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium">{fmt(Math.max(0, receives))}</div>
                      <div className="text-xs text-gray-400">Pagás {fmt(comission)}</div>
                      {p.freeShipping && p.shippingCost > 0 && (
                        <div className="text-xs text-gray-400">Pagás {fmt(p.shippingCost)}</div>
                      )}
                    </td>
                    {/* Métricas últ. 7 días */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <span>👁</span> <span>{p.views}</span>
                      </div>
                      {p.sales > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <span>🛒</span> <span>{p.sales}</span>
                        </div>
                      )}
                    </td>
                    {/* Calidad */}
                    <td className="px-3 py-3 text-center">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-bold ${
                        qualityNum >= 60 ? "border-[#3483FA] text-[#3483FA]" : qualityNum >= 40 ? "border-yellow-500 text-yellow-600" : "border-red-500 text-red-600"
                      }`}>
                        {qualityNum}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{objectives} objetivo{objectives > 1 ? "s" : ""}</div>
                    </td>
                    {/* Experiencia */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          expColor(p.sales, p.views) === "text-green-600" ? "bg-green-100" : "bg-orange-100"
                        }`}>
                          <Check size={12} className={expColor(p.sales, p.views)} />
                        </div>
                        <span className={`text-xs font-medium ${expColor(p.sales, p.views)}`}>{expLabel(p.sales, p.views)}</span>
                      </div>
                    </td>
                    {/* Estado y recomendaciones */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rec.color}`}>{rec.label}</span>
                        {/* Toggle */}
                        <button
                          onClick={() => toggle(p.id, !p.isActive)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${p.isActive ? "bg-[#3483FA]" : "bg-gray-300"}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${p.isActive ? "left-5" : "left-0.5"}`} />
                        </button>
                      </div>
                      {rec.tip && <p className="text-xs text-gray-500 leading-tight">{rec.tip}</p>}
                      {rec.action && (
                        <button className="text-xs text-[#3483FA] font-medium mt-1 hover:underline">{rec.action}</button>
                      )}
                    </td>
                    {/* Menu */}
                    <td className="px-3 py-3">
                      <div className="relative">
                        <button onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)} className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                        {openMenu === p.id && (
                          <div ref={menuRef} className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-52 py-1">
                            <a href={`/product/${p.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpenMenu(null)}>
                              <Eye size={16} className="text-blue-500" /> Ver publicación
                            </a>
                            <button onClick={() => { openEdit(p); setOpenMenu(null) }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                              <Edit size={16} className="text-gray-500" /> Editar publicación
                            </button>
                            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/product/${p.id}`); setOpenMenu(null) }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                              <Copy size={16} className="text-gray-500" /> Copiar enlace
                            </button>
                            <button onClick={() => { toggle(p.id, !p.isActive); setOpenMenu(null) }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                              {p.isActive ? <Pause size={16} className="text-yellow-500" /> : <Play size={16} className="text-green-500" />}
                              {p.isActive ? "Pausar" : "Activar"}
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button onClick={() => { remove(p.id); setOpenMenu(null) }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                              <Trash2 size={16} /> Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="p-12 text-center text-gray-500">
                  No hay publicaciones. <button onClick={openCreate} className="text-[#3483FA] font-medium hover:underline">Crear una</button>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 mt-auto">
          <span className="text-sm text-gray-500">
            {filtered.length} de {totalCount} publicaciones · Página {page} de {totalPages}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-8 w-8 p-0"><ChevronLeft size={16} /></Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2
                if (p < 1 || p > totalPages) return null
                return (
                  <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => setPage(p)}
                    className={`h-8 w-8 p-0 text-xs ${p === page ? "bg-[#3483FA] text-white" : ""}`}>
                    {p}
                  </Button>
                )
              })}
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="h-8 w-8 p-0"><ChevronRight size={16} /></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
