"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  Search, Edit, Trash2, Pause, Play, Plus, ChevronLeft, ChevronRight,
  MoreVertical, Eye, Copy, ChevronDown, CheckCircle2, AlertCircle,
  Info, TrendingDown, TrendingUp, Filter, ShoppingCart, Image as ImageIcon
} from "lucide-react"
import PublicarFlow from "@/components/dashboard/PublicarFlow"

interface P { id: string; title: string; description: string | null; sku: string | null; price: number; originalPrice: number | null; stock: number; isActive: boolean; views: number; sales: number; condition: string; freeShipping: boolean; shippingCost: number; qualityScore: number; categoryId: string | null; category: { name: string } | null; images: { url: string }[] }
interface S { active: number; paused: number; lowStock: number; noSales: number }

const fmt = (v: number) => `$ ${v.toLocaleString("es-AR")}`
const COMMISSION = 0.13

const getRecommendation = (p: P) => {
  if (!p.isActive) return { badge: "PERDIENDO", badgeColor: "bg-[#cc0000] text-white", tip: "Reactivá tu publicación para no perder ventas.", action: "Reactivar" }
  if (p.stock <= 0) return { badge: "SIN STOCK", badgeColor: "bg-[#cc0000] text-white", tip: "Agregá stock para volver a vender.", action: "Agregar stock" }
  if (p.stock <= 5) return { badge: "ATENCIÓN", badgeColor: "bg-yellow-100 text-yellow-700", tip: "Stock bajo. Reponé para no perder ventas.", action: "Reponer stock" }
  if (!p.freeShipping) return { badge: "", badgeColor: "", tip: "Ofrecé envío gratis. Atraé compradores con el beneficio que más valoran.", action: "Ofrecer envío" }
  if (p.sales === 0 && p.views > 50) return { badge: "PERDIENDO", badgeColor: "bg-[#cc0000] text-white", tip: "Otros vendedores ofrecen mejores condiciones.", action: "Mejorar condiciones" }
  if (p.originalPrice && p.originalPrice > p.price) return { badge: "", badgeColor: "", tip: "Participá de una promoción en 2 variantes. Ofrecé descuentos para recibir más visitas.", action: "Participar" }
  return { badge: "", badgeColor: "", tip: "", action: "" }
}

const TABS = ["Gestión de publicaciones", "Central de promociones", "Gestión de precios", "Gestión de stock"]

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
  const [activeTab, setActiveTab] = useState(0)
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

  const toggleSelect = (id: string) => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s) }
  const toggleAll = () => { selected.size === filtered.length ? setSelected(new Set()) : setSelected(new Set(filtered.map(p => p.id))) }
  const bulkPause = async () => { for (const id of selected) await toggle(id, false); setSelected(new Set()) }
  const bulkActivate = async () => { for (const id of selected) await toggle(id, true); setSelected(new Set()) }
  const bulkDelete = async () => {
    if (!confirm(`¿Eliminar ${selected.size} publicaciones?`)) return
    for (const id of selected) await fetch(`/api/dashboard/products?id=${id}`, { method: "DELETE" })
    setSelected(new Set()); load()
  }

  if (showFlow) {
    return <PublicarFlow onClose={() => { setShowFlow(false); setEditingProduct(null) }} onPublished={handlePublished} editProduct={editingProduct || undefined} />
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" /></div>

  return (
    <div className="text-[#333]">
      <style>{`
        .pub-grid {
          display: grid;
          grid-template-columns: minmax(280px, 2.5fr) 100px 140px 120px 90px 90px 90px minmax(210px, 1.8fr);
          gap: 16px;
          align-items: start;
        }
        .table-scrollbar::-webkit-scrollbar { height: 10px; }
        .table-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-top: 1px solid #e2e8f0; }
        .table-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f8fafc; }
        .table-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .quality-circle {
          width: 34px; height: 34px; border-radius: 50%; border: 2px solid #00a650;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: #00a650;
        }
        .quality-circle.low { border-color: #cc0000; color: #cc0000; }
        .quality-circle.mid { border-color: #3483fa; color: #3483fa; }
      `}</style>

      {/* TABS */}
      <div className="flex items-center gap-8 border-b border-slate-200 mb-6 -mx-6 -mt-6 px-6 bg-white">
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)} className={`pb-3 pt-4 text-[14px] font-medium cursor-pointer relative ${i === activeTab ? "text-[#3483fa]" : "text-slate-500 hover:text-slate-800"}`}>
            {tab}
            {i === activeTab && <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-[#3483fa] rounded-t-sm" />}
          </button>
        ))}
        <div className="ml-auto pb-3 pt-4">
          <button onClick={openCreate} className="bg-[#3483fa] hover:bg-[#2968c8] text-white font-medium text-[13px] h-9 px-4 rounded-md flex items-center gap-1.5 transition-colors">
            <Plus size={16} /> Nueva publicación
          </button>
        </div>
      </div>

      {/* ALERT CARDS */}
      {summary && (
        <div className="flex items-center gap-3 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {[
            { title: "Pendientes por corregir", desc: "Revisá qué debés hacer para reactivarlas.", count: summary.paused, action: () => { setFilter("paused"); setPage(1) } },
            { title: "Para ganar la competencia en Madsjeez", desc: "Revisá qué debés hacer para ser el vendedor destacado.", count: summary.noSales, action: () => { setFilter("no_sales"); setPage(1) } },
            { title: "Para volver a vender", desc: "Verificá si tus productos son los mismos del catálogo.", count: summary.lowStock, action: () => { setFilter("low_stock"); setPage(1) } },
          ].map((card, i) => (
            <button key={i} onClick={card.action} className="bg-white border border-slate-200 rounded-lg p-3.5 min-w-[260px] max-w-[280px] cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-shadow text-left flex-shrink-0">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-[12px] text-slate-800 leading-tight pr-2">{card.title}</span>
                <div className="w-6 h-5 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0 px-1.5">{card.count}</div>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight truncate">{card.desc}</p>
            </button>
          ))}
          <button onClick={() => { setFilter("all"); setPage(1) }} className="w-9 h-9 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center flex-shrink-0 text-[#3483fa] hover:bg-slate-50 transition-all -ml-4 relative z-10">
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* SEARCH & FILTER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-[340px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar por título, código o SKU" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-full text-[13px] text-slate-700 outline-none focus:border-[#3483fa] focus:ring-1 focus:ring-[#3483fa] transition-all" />
          </div>
          <button className="flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded transition-all">
            <Filter size={14} /> Filtrar y ordenar
          </button>
        </div>
        <div className="text-[12px] text-slate-500 font-medium">{totalCount} publicaciones</div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="border border-slate-200 rounded-lg flex flex-col w-full overflow-hidden bg-white">

        {/* TOOLBAR */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 w-full bg-[#f8f9fa]">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="w-4 h-4 rounded border-slate-300 text-[#3483fa] focus:ring-[#3483fa] cursor-pointer" />
            <ChevronDown size={14} className="text-[#3483fa] -ml-1 cursor-pointer" />
            <span className="text-[14px] text-slate-800 font-medium">{filtered.length} publicaciones</span>
          </div>
          <div className="flex items-center gap-5 text-[13px] font-medium">
            <button onClick={bulkPause} className="text-[#3483fa] hover:underline">Pausar</button>
            <button onClick={bulkActivate} className="text-[#3483fa] hover:underline">Reactivar</button>
            <button onClick={bulkDelete} className="text-[#3483fa] hover:underline">Eliminar</button>
            <div className="w-px h-4 bg-slate-300" />
            <button className="bg-[#e4edfa] text-[#3483fa] flex items-center gap-1.5 px-3 py-1.5 rounded text-[13px] font-medium hover:bg-[#d0e1f9] transition-colors">
              Modificar en Editor masivo <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* SCROLLABLE TABLE */}
        <div className="overflow-x-auto table-scrollbar w-full">
          <div className="min-w-[1250px] flex flex-col">

            {/* HEADER */}
            <div className="pub-grid px-4 py-3 border-b border-slate-200 bg-[#ebebeb]/50">
              {["Publicación", "Precio", "Condiciones", "Recibís", "Métricas últ. 7 días", "Calidad", "Experiencia", "Estado y recomendaciones"].map((h, i) => (
                <div key={i} className="text-[11px] font-bold text-slate-700">{h}</div>
              ))}
            </div>

            {/* ROWS */}
            <div className="divide-y divide-slate-200">
              {filtered.map(p => {
                const rec = getRecommendation(p)
                const comission = p.price * COMMISSION
                const receives = p.price - comission - (p.freeShipping ? (p.shippingCost || 0) : 0)
                const qScore = p.qualityScore
                const objectives = Math.max(1, Math.floor(qScore / 20))
                const hasCuotas = p.price >= 10000
                const cuotaPrice = hasCuotas ? Math.ceil(p.price / 3) : 0

                return (
                  <div key={p.id} className="pub-grid px-4 py-4 hover:bg-slate-50/50 transition-colors group">

                    {/* 1. PUBLICACIÓN */}
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="w-4 h-4 rounded border-slate-300 text-[#3483fa] focus:ring-[#3483fa] cursor-pointer mt-1" />
                      <div className="flex gap-3 min-w-0">
                        <div className="w-12 h-12 bg-white border border-slate-200 rounded flex-shrink-0 overflow-hidden shadow-sm">
                          {p.images[0]?.url ? (
                            <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-slate-300" /></div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 pt-0.5">
                          <a href={`/product/${p.id}`} target="_blank" rel="noopener noreferrer" className="text-[13px] text-slate-800 font-semibold leading-[1.3] hover:text-[#3483fa] cursor-pointer pr-4 line-clamp-1">
                            {p.title}
                          </a>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                            {p.sku && <span>#{p.sku}</span>}
                            {p.sku && <Copy size={12} className="cursor-pointer hover:text-slate-600" onClick={() => navigator.clipboard.writeText(p.sku || "")} />}
                            {p.category && <span className="text-[#3483fa] ml-1">{p.category.name}</span>}
                          </div>
                          <div className="text-[11px] text-slate-700 mt-1.5 flex items-center flex-wrap gap-x-2 font-medium">
                            <span>Depósito: {p.stock} u.</span>
                            {p.stock <= 5 && p.stock > 0 && <AlertCircle size={11} className="text-[#cc0000]" />}
                            {p.stock <= 0 && <span className="text-[#cc0000] font-bold">Sin stock</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. PRECIO */}
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      <span className="text-[13px] font-bold text-slate-800">{fmt(p.price)}</span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-[11px] text-slate-500">{fmt(p.originalPrice)}</span>
                      )}
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-[10px] text-[#3483fa] mt-1 flex items-center gap-1 leading-tight">
                          Con 1 precio mayorista <Info size={11} className="flex-shrink-0" />
                        </span>
                      )}
                    </div>

                    {/* 3. CONDICIONES */}
                    <div className="flex flex-col gap-1.5 pt-0.5 pr-2">
                      {hasCuotas && (
                        <div className="flex flex-col leading-tight">
                          <span className="text-[12px] text-slate-800">{p.price >= 30000 ? "Con cuotas" : "3 cuotas"}</span>
                          <span className="text-[10px] text-slate-500 mt-[2px]">Pagás {fmt(cuotaPrice)}</span>
                        </div>
                      )}
                      <div className="flex flex-col leading-tight">
                        {p.freeShipping ? (
                          <>
                            <span className="text-[12px] font-bold text-slate-800">Ofrecés envío gratis</span>
                            {p.shippingCost > 0 && <span className="text-[10px] text-slate-500 mt-[2px]">Pagás {fmt(p.shippingCost)}</span>}
                          </>
                        ) : (
                          <span className="text-[12px] text-slate-500">Envío a cargo del comprador</span>
                        )}
                      </div>
                    </div>

                    {/* 4. RECIBÍS */}
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      <span className="text-[13px] font-bold text-slate-800">{fmt(Math.max(0, receives))}</span>
                      <span className="text-[11px] text-slate-500">Pagás {fmt(comission)}</span>
                      {p.freeShipping && p.shippingCost > 0 && (
                        <span className="text-[11px] text-slate-500">Pagás {fmt(p.shippingCost)}</span>
                      )}
                    </div>

                    {/* 5. MÉTRICAS */}
                    <div className="flex flex-col gap-1.5 pt-0.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <Eye size={13} className="text-slate-400" />
                        <span className="font-bold flex-1 text-center">{p.views}</span>
                        <div className="w-[12px]">
                          {p.views > 10 && <TrendingUp size={12} className="text-[#00a650]" />}
                          {p.views > 0 && p.views <= 10 && <TrendingDown size={12} className="text-[#cc0000]" />}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <ShoppingCart size={13} className="text-slate-400" />
                        <span className="font-bold flex-1 text-center">{p.sales > 0 ? p.sales : "-"}</span>
                        <div className="w-[12px]" />
                      </div>
                    </div>

                    {/* 6. CALIDAD */}
                    <div className="flex flex-col items-center justify-start gap-1.5 pt-0.5">
                      {qScore >= 40 ? (
                        <div className={`quality-circle ${qScore >= 70 ? "" : qScore >= 40 ? "mid" : "low"}`}>{qScore}</div>
                      ) : qScore > 0 ? (
                        <div className="quality-circle low">{qScore}</div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#e4edfa] flex items-center justify-center"><Info size={16} className="text-[#3483fa]" /></div>
                      )}
                      <span className="text-[11px] text-[#3483fa] font-medium hover:underline cursor-pointer">{objectives} objetivo{objectives > 1 ? "s" : ""}</span>
                    </div>

                    {/* 7. EXPERIENCIA */}
                    <div className="flex flex-col items-center justify-start gap-1 pt-0.5 text-center">
                      <CheckCircle2 size={16} className="text-[#00a650] fill-[#e6f6ec]" />
                      <span className="text-[10px] text-slate-500 mt-0.5">¡Bien hecho!</span>
                    </div>

                    {/* 8. ESTADO Y RECOMENDACIONES */}
                    <div className="flex flex-col pr-2 pt-0.5">
                      <div className="flex justify-between items-start mb-2">
                        {rec.badge ? (
                          <div className={`text-[9px] font-bold px-1.5 py-[2px] rounded-[3px] uppercase tracking-wider ${rec.badgeColor}`}>{rec.badge}</div>
                        ) : <div />}
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggle(p.id, !p.isActive)} className={`relative w-[32px] h-[18px] rounded-full transition-colors ${p.isActive ? "bg-[#3483fa]" : "bg-slate-300"}`}>
                            <span className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow transition-all ${p.isActive ? "right-[2px]" : "left-[2px]"}`} />
                          </button>
                          <div className="relative">
                            <button onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)} className="hover:bg-slate-100 rounded p-0.5">
                              <MoreVertical size={16} className="text-slate-500 cursor-pointer hover:text-slate-800" />
                            </button>
                            {openMenu === p.id && (
                              <div ref={menuRef} className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-52 py-1">
                                <a href={`/product/${p.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50" onClick={() => setOpenMenu(null)}>
                                  <Eye size={15} className="text-[#3483fa]" /> Ver publicación
                                </a>
                                <button onClick={() => { openEdit(p); setOpenMenu(null) }} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 w-full text-left">
                                  <Edit size={15} className="text-slate-400" /> Editar publicación
                                </button>
                                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/product/${p.id}`); setOpenMenu(null) }} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 w-full text-left">
                                  <Copy size={15} className="text-slate-400" /> Copiar enlace
                                </button>
                                <button onClick={() => { toggle(p.id, !p.isActive); setOpenMenu(null) }} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 w-full text-left">
                                  {p.isActive ? <Pause size={15} className="text-yellow-500" /> : <Play size={15} className="text-green-500" />}
                                  {p.isActive ? "Pausar" : "Activar"}
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                <button onClick={() => { remove(p.id); setOpenMenu(null) }} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 w-full text-left">
                                  <Trash2 size={15} /> Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {rec.tip && <p className="text-[12px] text-slate-800 font-semibold leading-[1.3] mb-1">{rec.tip}</p>}
                      {rec.action && (
                        <button className="text-[12px] text-[#3483fa] bg-[#e4edfa] px-3 py-1.5 rounded self-start font-medium hover:bg-[#d0e1f9] transition-colors mt-1">
                          {rec.action}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {filtered.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                  No hay publicaciones. <button onClick={openCreate} className="text-[#3483fa] font-medium hover:underline">Crear una</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-[#f8f9fa] mt-auto">
          <span className="text-[12px] text-slate-500">
            {filtered.length} de {totalCount} publicaciones · Página {page} de {totalPages}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronLeft size={16} /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page + i - 2
                if (pg < 1 || pg > totalPages) return null
                return (
                  <button key={pg} onClick={() => setPage(pg)} className={`w-8 h-8 flex items-center justify-center rounded text-[12px] font-medium transition-colors ${pg === page ? "bg-[#3483fa] text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{pg}</button>
                )
              })}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
