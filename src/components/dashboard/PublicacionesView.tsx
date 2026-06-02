"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  Search, Edit, Trash2, Pause, Play, Plus, ChevronLeft, ChevronRight,
  MoreVertical, Eye, Copy, ChevronDown, CheckCircle2, AlertCircle,
  Info, TrendingDown, TrendingUp, Filter, ShoppingCart, Image as ImageIcon, Loader2, CopyMinus
} from "lucide-react"
import PublicarFlow from "@/components/dashboard/PublicarFlow"
import { toast } from "sonner"

interface P { id: string; title: string; description: string | null; sku: string | null; price: number; originalPrice: number | null; stock: number; isActive: boolean; views: number; sales: number; condition: string; freeShipping: boolean; shippingCost: number; qualityScore: number; categoryId: string | null; category: { name: string } | null; images: { url: string }[]; source?: "prisma" | "supabase"; isCatalog?: boolean }
interface S { active: number; paused: number; lowStock: number; noSales: number }

const fmt = (v: number) => `$ ${v.toLocaleString("es-AR")}`
// Política Madsjeez: 0% comisión sobre ventas. Se mantiene la constante
// para no romper el cálculo legacy de "neto estimado" — sumá costos reales
// (MP fee + envío seller) si querés un net real.
const COMMISSION = 0

const getRecommendation = (p: P) => {
  if (!p.isActive) return { badge: "PERDIENDO", badgeColor: "bg-destructive text-destructive-foreground", tip: "Reactivá tu publicación para no perder ventas.", action: "Reactivar" }
  if (p.stock <= 0) return { badge: "SIN STOCK", badgeColor: "bg-destructive text-destructive-foreground", tip: "Agregá stock para volver a vender.", action: "Agregar stock" }
  if (p.stock <= 5) return { badge: "ATENCIÓN", badgeColor: "bg-primary/10 text-primary", tip: "Stock bajo. Reponé para no perder ventas.", action: "Reponer stock" }
  if (!p.freeShipping) return { badge: "", badgeColor: "", tip: "Ofrecé envío gratis. Atraé compradores con el beneficio que más valoran.", action: "Ofrecer envío" }
  if (p.sales === 0 && p.views > 50) return { badge: "PERDIENDO", badgeColor: "bg-[#cc0000] text-white", tip: "Otros vendedores ofrecen mejores condiciones.", action: "Mejorar condiciones" }
  if (p.originalPrice && p.originalPrice > p.price) return { badge: "", badgeColor: "", tip: "Participá de una promoción en 2 variantes. Ofrecé descuentos para recibir más visitas.", action: "Participar" }
  return { badge: "", badgeColor: "", tip: "", action: "" }
}

const TABS = ["Gestión de publicaciones", "Central de promociones", "Gestión de precios", "Gestión de stock"]
const isMutableProduct = (p: P) => p.source !== "supabase"
const rowKey = (p: P) => `${p.source || "prisma"}:${p.id}`

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
  const [deduping, setDeduping] = useState(false)
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
      p.set("limit", "50")
      const r = await fetch(`/api/dashboard/products?${p}`)
      const d = await r.json()
      setProducts(d.products || [])
      setSummary(d.summary || null)
      setTotalPages(d.totalPages || 1)
      setTotalCount(d.total || d.products?.length || 0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [filter, page])

  useEffect(() => {
    const t = setTimeout(() => load(), 0)
    return () => clearTimeout(t)
  }, [load])

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return p.title.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q)
  })

  const openCreate = () => { setEditingProduct(null); setShowFlow(true) }
  const openEdit = (p: P) => { setEditingProduct(p); setShowFlow(true) }
  const handlePublished = () => { setShowFlow(false); setEditingProduct(null); load() }

  const toggle = async (id: string, active: boolean) => {
    const scrollY = window.scrollY
    await fetch("/api/dashboard/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive: active }) })
    await load()
    requestAnimationFrame(() => window.scrollTo(0, scrollY))
  }
  const remove = async (id: string) => {
    if (!confirm("¿Eliminar publicación?")) return
    const scrollY = window.scrollY
    await fetch(`/api/dashboard/products?id=${id}`, { method: "DELETE" })
    await load()
    requestAnimationFrame(() => window.scrollTo(0, scrollY))
  }

  const toggleSelect = (id: string) => {
    const product = filtered.find((p) => p.id === id)
    if (product && !isMutableProduct(product)) return
    const s = new Set(selected)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setSelected(s)
  }
  const toggleAll = () => {
    const mutableIds = filtered.filter(isMutableProduct).map(p => p.id)
    if (mutableIds.length > 0 && mutableIds.every((id) => selected.has(id))) setSelected(new Set())
    else setSelected(new Set(mutableIds))
  }
  const bulkPause = async () => { for (const id of selected) await toggle(id, false); setSelected(new Set()) }
  const bulkActivate = async () => { for (const id of selected) await toggle(id, true); setSelected(new Set()) }
  const bulkDelete = async () => {
    if (!confirm(`¿Eliminar ${selected.size} publicaciones?`)) return
    const scrollY = window.scrollY
    for (const id of selected) await fetch(`/api/dashboard/products?id=${id}`, { method: "DELETE" })
    setSelected(new Set()); await load()
    requestAnimationFrame(() => window.scrollTo(0, scrollY))
  }

  const removeDuplicatePublications = async () => {
    setDeduping(true)
    try {
      const previewRes = await fetch("/api/dashboard/products/dedupe-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: true }),
      })
      const preview = await previewRes.json()
      if (!previewRes.ok) {
        toast.error(preview.error || "No se pudo analizar duplicados")
        return
      }
      if (!preview.toRemove) {
        toast.message("No hay duplicados", {
          description: "Ninguna publicación coincide en 2 de 3: título, SKU y precio.",
        })
        return
      }
      const skipNote =
        preview.skippedWithOrders > 0
          ? `\n\n${preview.skippedWithOrders} tienen ventas y no se borrarán.`
          : ""
      if (
        !confirm(
          `Se eliminarán ${preview.toRemove} publicaciones duplicadas (${preview.groups} grupos). Se conserva la más completa por grupo (MLA, ventas).${skipNote}\n\n¿Continuar?`
        )
      ) {
        return
      }
      const execRes = await fetch("/api/dashboard/products/dedupe-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false }),
      })
      const result = await execRes.json()
      if (!execRes.ok) {
        toast.error(result.error || "Error al eliminar duplicados")
        return
      }
      toast.success(`Eliminadas ${result.toRemove} publicaciones duplicadas`)
      await load()
    } catch {
      toast.error("Error de red al eliminar duplicados")
    } finally {
      setDeduping(false)
    }
  }

  if (showFlow) {
    return <PublicarFlow onClose={() => { setShowFlow(false); setEditingProduct(null) }} onPublished={handlePublished} editProduct={editingProduct || undefined} />
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" /></div>

  return (
    <div className="text-foreground w-full px-6 lg:px-8">
      <style>{`
        .pub-grid {
          display: grid;
          grid-template-columns: 2.5fr 1fr 1.3fr 1.1fr 0.9fr 0.9fr 0.9fr 2fr;
          gap: 8px;
          align-items: start;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .quality-circle {
          width: 34px; height: 34px; border-radius: 50%; border: 2px solid var(--success);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: var(--success);
        }
        .quality-circle.low { border-color: var(--destructive); color: var(--destructive); }
        .quality-circle.mid { border-color: var(--primary); color: var(--primary); }
        .pub-row-card {
          border: 1px solid var(--border);
          border-radius: 6px;
          margin: 4px 8px;
          background: var(--card);
          color: var(--card-foreground);
          transition: box-shadow 0.15s;
          position: relative;
          overflow: visible;
        }
        .pub-row-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          background: color-mix(in srgb, var(--card) 88%, var(--muted));
        }
      `}</style>

      {/* TABS */}
      <div className="flex items-center gap-8 border-b border-slate-200 mb-6 bg-white rounded-t-lg px-4">
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)} className={`pb-3 pt-4 text-[14px] font-medium cursor-pointer relative ${i === activeTab ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {tab}
            {i === activeTab && <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-primary rounded-t-sm" />}
          </button>
        ))}
        <div className="ml-auto pb-3 pt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={removeDuplicatePublications}
            disabled={deduping}
            className="border border-amber-300/60 bg-amber-50 text-amber-900 font-medium text-[13px] h-9 px-3 rounded-md flex items-center gap-1.5 hover:bg-amber-100 disabled:opacity-50"
            title="Elimina duplicados si coinciden al menos 2 de: título, SKU y precio"
          >
            {deduping ? <Loader2 size={16} className="animate-spin" /> : <CopyMinus size={16} />}
            Quitar duplicados
          </button>
          <button onClick={openCreate} className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-[13px] h-9 px-4 rounded-md flex items-center gap-1.5 transition-colors">
            <Plus size={16} /> Nueva publicación
          </button>
        </div>
      </div>

      {/* ALERT CARDS */}
      {summary && (
        <div className="flex items-center gap-3 mb-6 overflow-x-auto scrollbar-hide pb-1 px-0">
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
          <button onClick={() => { setFilter("all"); setPage(1) }} className="w-9 h-9 rounded-full bg-card shadow-sm border border-border flex items-center justify-center flex-shrink-0 text-primary hover:bg-muted transition-all -ml-4 relative z-10">
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* SEARCH & FILTER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-[340px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar por título, código o SKU" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-full text-[13px] text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          </div>
          <button className="flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded transition-all">
            <Filter size={14} /> Filtrar y ordenar
          </button>
        </div>
        <div className="text-[12px] text-slate-500 font-medium">{totalCount} publicaciones</div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="border border-border rounded-lg flex flex-col w-full bg-muted/60">

        {/* TOOLBAR */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border w-full bg-muted/50">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={filtered.filter(isMutableProduct).length > 0 && filtered.filter(isMutableProduct).every((p) => selected.has(p.id))} onChange={toggleAll} className="w-4 h-4 rounded border-slate-300 text-[#3483fa] focus:ring-[#3483fa] cursor-pointer" />
            <ChevronDown size={14} className="text-[#3483fa] -ml-1 cursor-pointer" />
            <span className="text-[14px] text-slate-800 font-medium">{filtered.length} publicaciones</span>
          </div>
          <div className="flex items-center gap-5 text-[13px] font-medium">
            <button onClick={bulkPause} className="text-primary hover:underline">Pausar</button>
            <button onClick={bulkActivate} className="text-primary hover:underline">Reactivar</button>
            <button onClick={bulkDelete} className="text-primary hover:underline">Eliminar</button>
            <div className="w-px h-4 bg-slate-300" />
            <button className="bg-primary/10 text-primary flex items-center gap-1.5 px-3 py-1.5 rounded text-[13px] font-medium hover:bg-primary/20 transition-colors">
              Modificar en Editor masivo <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="w-full">
          <div className="flex flex-col w-full">

            {/* HEADER */}
            <div className="pub-grid px-4 py-3 border-b border-border bg-muted/60">
              {["Publicación", "Precio", "Condiciones", "Recibís", "Métricas últ. 7 días", "Calidad", "Experiencia", "Estado y recomendaciones"].map((h, i) => (
                <div key={i} className="text-[11px] font-bold text-slate-700">{h}</div>
              ))}
            </div>

            {/* ROWS */}
            <div className="flex flex-col">
              {filtered.map(p => {
                const rk = rowKey(p)
                const rec = getRecommendation(p)
                const comission = p.price * COMMISSION
                const receives = p.price - comission - (p.freeShipping ? (p.shippingCost || 0) : 0)
                const qScore = p.qualityScore
                const objectives = Math.max(1, Math.floor(qScore / 20))
                const hasCuotas = p.price >= 10000
                const cuotaPrice = hasCuotas ? Math.ceil(p.price / 3) : 0

                return (
                  <div key={rk} className="pub-row-card pub-grid px-4 py-3 group">

                    {/* 1. PUBLICACIÓN */}
                    <div className="flex items-start gap-3">
                      <input type="checkbox" disabled={!isMutableProduct(p)} checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="w-4 h-4 rounded border-slate-300 text-[#3483fa] focus:ring-[#3483fa] cursor-pointer mt-1 disabled:opacity-40 disabled:cursor-not-allowed" />
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
                            {(p.isCatalog || p.category) && <span className="text-primary ml-1">{p.isCatalog ? "Catálogo" : p.category?.name}</span>}
                          </div>
                          <div className="text-[11px] text-slate-700 mt-1.5 flex items-center flex-wrap gap-x-2 font-medium">
                            <span>Depósito: {p.stock} u.</span>
                            {p.stock <= 5 && p.stock > 0 && <AlertCircle size={11} className="text-destructive" />}
                            {p.stock <= 0 && <span className="text-destructive font-bold">Sin stock</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. PRECIO */}
                    <div className="flex flex-col gap-0.5 pt-0.5">
                        <span className="text-[13px] font-bold text-foreground">{fmt(p.price)}</span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-[11px] text-slate-500">{fmt(p.originalPrice)}</span>
                      )}
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-[10px] text-primary mt-1 flex items-center gap-1 leading-tight">
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
                            <span className="text-[12px] font-bold text-foreground">Ofrecés envío gratis</span>
                            {p.shippingCost > 0 && <span className="text-[10px] text-slate-500 mt-[2px]">Pagás {fmt(p.shippingCost)}</span>}
                          </>
                        ) : (
                          <span className="text-[12px] text-slate-500">Envío a cargo del comprador</span>
                        )}
                      </div>
                    </div>

                    {/* 4. RECIBÍS */}
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      <span className="text-[13px] font-bold text-foreground">{fmt(Math.max(0, receives))}</span>
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
                          {p.views > 10 && <TrendingUp size={12} className="text-success" />}
                          {p.views > 0 && p.views <= 10 && <TrendingDown size={12} className="text-destructive" />}
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
                        <span className="text-[11px] text-primary font-medium hover:underline cursor-pointer">{objectives} objetivo{objectives > 1 ? "s" : ""}</span>
                    </div>

                    {/* 7. EXPERIENCIA */}
                    <div className="flex flex-col items-center justify-start gap-1 pt-0.5 text-center">
                      <CheckCircle2 size={16} className="text-success fill-success/20" />
                      <span className="text-[10px] text-slate-500 mt-0.5">¡Bien hecho!</span>
                    </div>

                    {/* 8. ESTADO Y RECOMENDACIONES */}
                    <div className="flex flex-col pr-2 pt-0.5">
                      <div className="flex justify-between items-start mb-2">
                        {rec.badge ? (
                          <div className={`text-[9px] font-bold px-1.5 py-[2px] rounded-[3px] uppercase tracking-wider ${rec.badgeColor}`}>{rec.badge}</div>
                        ) : <div />}
                        <div className="flex items-center gap-3">
                        <button onClick={() => toggle(p.id, !p.isActive)} className={`relative w-[32px] h-[18px] rounded-full transition-colors ${p.isActive ? "bg-primary" : "bg-slate-300"}`}>
                            <span className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow transition-all ${p.isActive ? "right-[2px]" : "left-[2px]"}`} />
                          </button>
                          <div className="relative">
                            <button onClick={() => setOpenMenu(openMenu === rk ? null : rk)} className="hover:bg-slate-100 rounded p-0.5">
                              <MoreVertical size={16} className="text-slate-500 cursor-pointer hover:text-slate-800" />
                            </button>
                            {openMenu === rk && (
                              <div ref={menuRef} className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-52 py-1">
                                {[
                                  {
                                    id: "view",
                                    label: "Ver publicación",
                                    icon: <Eye size={15} className="text-primary" />,
                                    onClick: () => {
                                      window.open(`/product/${p.id}`, "_blank", "noopener,noreferrer")
                                      setOpenMenu(null)
                                    },
                                  },
                                  {
                                    id: "copy",
                                    label: "Copiar enlace",
                                    icon: <Copy size={15} className="text-slate-400" />,
                                    onClick: () => {
                                      navigator.clipboard.writeText(`${window.location.origin}/product/${p.id}`)
                                      setOpenMenu(null)
                                    },
                                  },
                                  ...(p.source !== "supabase"
                                    ? [
                                        {
                                          id: "edit",
                                          label: "Editar publicación",
                                          icon: <Edit size={15} className="text-slate-400" />,
                                          onClick: () => {
                                            openEdit(p)
                                            setOpenMenu(null)
                                          },
                                        },
                                        {
                                          id: "toggle",
                                          label: p.isActive ? "Pausar" : "Activar",
                                          icon: p.isActive ? <Pause size={15} className="text-primary" /> : <Play size={15} className="text-green-500" />,
                                          onClick: () => {
                                            toggle(p.id, !p.isActive)
                                            setOpenMenu(null)
                                          },
                                        },
                                        {
                                          id: "delete",
                                          label: "Eliminar",
                                          danger: true,
                                          icon: <Trash2 size={15} />,
                                          onClick: () => {
                                            remove(p.id)
                                            setOpenMenu(null)
                                          },
                                        },
                                      ]
                                    : []),
                                ].map((action) => (
                                  <div key={action.id}>
                                    {action.id === "delete" && <div className="border-t border-slate-100 my-1" />}
                                    <button
                                      onClick={action.onClick}
                                      className={`flex items-center gap-3 px-4 py-2.5 text-[13px] w-full text-left ${action.danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"}`}
                                    >
                                      {action.icon}
                                      {action.label}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {rec.tip && <p className="text-[12px] text-slate-800 font-semibold leading-[1.3] mb-1">{rec.tip}</p>}
                      {rec.action && (
                        <button className="text-[12px] text-primary bg-primary/10 px-3 py-1.5 rounded self-start font-medium hover:bg-primary/20 transition-colors mt-1">
                          {rec.action}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {filtered.length === 0 && (
                <div className="p-12 text-center text-slate-500 bg-white rounded-lg mx-2 my-2 border border-slate-200">
                  No hay publicaciones. <button onClick={openCreate} className="text-primary font-medium hover:underline">Crear una</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/50 mt-auto">
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
                  <button key={pg} onClick={() => setPage(pg)} className={`w-8 h-8 flex items-center justify-center rounded text-[12px] font-medium transition-colors ${pg === page ? "bg-primary text-primary-foreground" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{pg}</button>
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
