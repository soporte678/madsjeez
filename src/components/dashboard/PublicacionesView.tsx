"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { Search, Edit, Trash2, Pause, Play, Plus, ChevronLeft, ChevronRight, MoreVertical, Eye, Copy, BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import PublicarFlow from "@/components/dashboard/PublicarFlow"

interface P { id: string; title: string; description: string | null; sku: string | null; price: number; originalPrice: number | null; stock: number; isActive: boolean; views: number; sales: number; condition: string; freeShipping: boolean; shippingCost: number; qualityScore: number; categoryId: string | null; category: { name: string } | null; images: { url: string }[] }
interface S { active: number; paused: number; lowStock: number; noSales: number }

const fmt = (v: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(v)
const ql = (s: number) => s >= 80 ? "Excelente" : s >= 60 ? "Buena" : s >= 40 ? "Regular" : "Mala"
const qc: Record<string, string> = { Excelente: "text-green-600 bg-green-50", Buena: "text-blue-600 bg-blue-50", Regular: "text-yellow-600 bg-yellow-50", Mala: "text-red-600 bg-red-50" }
const el = (sales: number, views: number) => views === 0 ? "Neutral" : sales / views >= 0.1 ? "Muy positiva" : sales / views >= 0.05 ? "Positiva" : sales / views >= 0.02 ? "Mejorar" : "Negativa"
const rc = (p: P) => !p.isActive ? "PAUSADA" : p.stock <= 0 ? "Sin stock" : p.qualityScore < 40 ? "Mejorar fotos" : p.sales === 0 && p.views > 100 ? "Ajustar precio" : "Bien hecho"

export default function PublicacionesView() {
  const [products, setProducts] = useState<P[]>([])
  const [summary, setSummary] = useState<S | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFlow, setShowFlow] = useState(false)
  const [editingProduct, setEditingProduct] = useState<P | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
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
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [filter, page])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" /></div>

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return p.title.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q)
  })

  const openCreate = () => { setEditingProduct(null); setShowFlow(true) }
  const openEdit = (p: P) => { setEditingProduct(p); setShowFlow(true) }

  const handlePublished = () => {
    setShowFlow(false)
    setEditingProduct(null)
    load()
  }

  const toggle = async (id: string, active: boolean) => {
    await fetch("/api/dashboard/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive: active }) })
    load()
  }

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar publicación?")) return
    await fetch(`/api/dashboard/products?id=${id}`, { method: "DELETE" })
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Publicaciones</h1>
        <Button onClick={openCreate} className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold"><Plus size={18} className="mr-1" />Nueva</Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => { setFilter("active"); setPage(1) }} className={`bg-white p-4 rounded-xl shadow-sm border text-left transition-all ${filter === "active" ? "ring-2 ring-green-500" : "hover:shadow-md"}`}><div className="text-2xl font-bold text-green-600">{summary.active}</div><div className="text-sm text-gray-500">Activas</div></button>
          <button onClick={() => { setFilter("paused"); setPage(1) }} className={`bg-white p-4 rounded-xl shadow-sm border text-left transition-all ${filter === "paused" ? "ring-2 ring-yellow-500" : "hover:shadow-md"}`}><div className="text-2xl font-bold text-yellow-600">{summary.paused}</div><div className="text-sm text-gray-500">Pausadas</div></button>
          <button onClick={() => { setFilter("low_stock"); setPage(1) }} className={`bg-white p-4 rounded-xl shadow-sm border text-left transition-all ${filter === "low_stock" ? "ring-2 ring-orange-500" : "hover:shadow-md"}`}><div className="text-2xl font-bold text-orange-600">{summary.lowStock}</div><div className="text-sm text-gray-500">Stock bajo</div></button>
          <button onClick={() => { setFilter("no_sales"); setPage(1) }} className={`bg-white p-4 rounded-xl shadow-sm border text-left transition-all ${filter === "no_sales" ? "ring-2 ring-blue-500" : "hover:shadow-md"}`}><div className="text-2xl font-bold text-blue-600">{summary.noSales}</div><div className="text-sm text-gray-500">Sin ventas</div></button>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Buscar por título o SKU" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} className="px-4 py-2 border border-gray-200 rounded-lg outline-none">
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="paused">Pausadas</option>
          <option value="low_stock">Stock bajo</option>
          <option value="no_sales">Sin ventas</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col" style={{ minHeight: "calc(100vh - 280px)" }}>
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Publicación</th>
              <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Precio</th>
              <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Métricas</th>
              <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Calidad</th>
              <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr></thead>
            <tbody className="divide-y">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 h-[52px]">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]?.url || "https://via.placeholder.com/48"} alt={p.title} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{p.title}</h4>
                        <div className="flex gap-2 mt-1">
                          {p.freeShipping && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Envío gratis</span>}
                          {p.category && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{p.category.name}</span>}
                          {p.sku && <span className="text-xs text-gray-400">{p.sku}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2"><div className="text-sm font-medium">{fmt(p.price)}</div>{p.originalPrice && <div className="text-xs text-gray-400 line-through">{fmt(p.originalPrice)}</div>}</td>
                  <td className="px-4 py-2"><div className="text-sm">{p.stock}</div><div className={`text-xs ${p.stock <= 5 ? "text-red-500" : "text-gray-400"}`}>{p.stock <= 5 ? "Bajo" : "OK"}</div></td>
                  <td className="px-4 py-2"><div className="text-sm text-gray-600"><div>👁 {p.views}</div><div>🛒 {p.sales} vendidos</div></div></td>
                  <td className="px-4 py-2"><Badge className={qc[ql(p.qualityScore)]}>{ql(p.qualityScore)}</Badge><div className="text-xs mt-1">{el(p.sales, p.views)}</div></td>
                  <td className="px-4 py-2"><Badge className={p.isActive ? "text-green-600 bg-green-50" : "text-yellow-600 bg-yellow-50"}>{p.isActive ? "Activo" : "Pausado"}</Badge><div className="text-xs text-gray-500 mt-1">{rc(p)}</div></td>
                  <td className="px-4 py-2">
                    <div className="relative">
                      <button onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)} className="p-1.5 hover:bg-gray-100 rounded">
                        <MoreVertical size={18} className="text-gray-500" />
                      </button>
                      {openMenu === p.id && (
                        <div ref={menuRef} className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-52 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                          <a href={`/product/${p.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setOpenMenu(null)}>
                            <Eye size={16} className="text-blue-500" /> Ver publicación
                          </a>
                          <button onClick={() => { openEdit(p); setOpenMenu(null) }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left">
                            <Edit size={16} className="text-gray-500" /> Editar publicación
                          </button>
                          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/product/${p.id}`); setOpenMenu(null) }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left">
                            <Copy size={16} className="text-gray-500" /> Copiar enlace
                          </button>
                          <button onClick={() => { toggle(p.id, !p.isActive); setOpenMenu(null) }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left">
                            {p.isActive ? <Pause size={16} className="text-yellow-500" /> : <Play size={16} className="text-green-500" />}
                            {p.isActive ? "Pausar" : "Activar"}
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button onClick={() => { remove(p.id); setOpenMenu(null) }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                            <Trash2 size={16} /> Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay publicaciones. <button onClick={openCreate} className="text-blue-600 underline">Crear una</button></td></tr>}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 mt-auto">
          <span className="text-sm text-gray-500">
            Mostrando {filtered.length} publicaciones · Página {page} de {totalPages}
          </span>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
