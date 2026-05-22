"use client"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Search, Edit, Trash2, Pause, Play, Plus, ChevronLeft, ChevronRight, Loader2, CopyMinus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import PublicarFlow from "@/components/dashboard/PublicarFlow"
import {
  PublicationsFilterButton,
  PublicationsFilterModal,
  countActivePublicationFilters,
} from "@/components/dashboard/PublicationsFilterModal"
import {
  DEFAULT_SELLER_PUBLICATION_QUERY,
  SELLER_PUBLICATION_SORT_OPTIONS,
  sellerPublicationQueryToSearchParams,
  type SellerPublicationQuery,
  type SellerPublicationsSort,
} from "@/lib/dashboard/seller-publications-query"

const PUBL_SORT_GROUPS = [...new Set(SELLER_PUBLICATION_SORT_OPTIONS.map((o) => o.group))]

interface P { id: string; title: string; description: string | null; sku: string | null; price: number; originalPrice: number | null; stock: number; isActive: boolean; views: number; sales: number; condition: string; freeShipping: boolean; shippingCost: number; qualityScore: number; categoryId: string | null; category: { id?: string | null; name: string } | null; images: { url: string }[] }
interface S { active: number; paused: number; lowStock: number; noSales: number }

const fmt = (v: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(v)
const ql = (s: number) => s >= 80 ? "Excelente" : s >= 60 ? "Buena" : s >= 40 ? "Regular" : "Mala"
const qc: Record<string, string> = { Excelente: "text-green-600 bg-green-50", Buena: "text-blue-600 bg-blue-50", Regular: "text-primary bg-primary/10", Mala: "text-red-600 bg-red-50" }
const el = (sales: number, views: number) => views === 0 ? "Neutral" : sales / views >= 0.1 ? "Muy positiva" : sales / views >= 0.05 ? "Positiva" : sales / views >= 0.02 ? "Mejorar" : "Negativa"
const rc = (p: P) => !p.isActive ? "PAUSADA" : p.stock <= 0 ? "Sin stock" : p.qualityScore < 40 ? "Mejorar fotos" : p.sales === 0 && p.views > 100 ? "Ajustar precio" : "Bien hecho"

interface ZipnovaSellerStatus {
  oauthAppConfigured: boolean
  connected: boolean
  expiresAt: string | null
}

export default function Page() {
  const { status, data: session } = useSession()
  const router = useRouter()
  const [zipnovaStatus, setZipnovaStatus] = useState<ZipnovaSellerStatus | null>(null)
  const [zipnovaBanner, setZipnovaBanner] = useState<string | null>(null)
  const [products, setProducts] = useState<P[]>([])
  const [summary, setSummary] = useState<S | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [publicationQuery, setPublicationQuery] = useState<SellerPublicationQuery>(() => ({
    ...DEFAULT_SELLER_PUBLICATION_QUERY,
    flags: { ...DEFAULT_SELLER_PUBLICATION_QUERY.flags },
  }))
  const [totalCount, setTotalCount] = useState(0)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFlow, setShowFlow] = useState(false)
  const [editingProduct, setEditingProduct] = useState<P | null>(null)
  const [deduping, setDeduping] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = sellerPublicationQueryToSearchParams(publicationQuery, page, 20)
      const r = await fetch(`/api/dashboard/products?${p}`)
      const d = await r.json()
      setProducts(d.products || [])
      setSummary(d.summary || null)
      setTotalPages(d.totalPages || 1)
      setTotalCount(typeof d.total === "number" ? d.total : (d.products || []).length)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [publicationQuery, page])

  useEffect(() => {
    if (status === "authenticated") load()
  }, [status, load])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login?redirect=/dashboard/publicaciones")
  }, [status, router])

  useEffect(() => {
    if (typeof window === "undefined") return
    const p = new URLSearchParams(window.location.search)
    if (p.get("zipnova") === "connected") {
      setZipnovaBanner("Zipnova quedó conectado a tu cuenta de vendedor.")
      router.replace("/dashboard/publicaciones", { scroll: false })
    }
    const ze = p.get("zipnova_error")
    if (ze) {
      setZipnovaBanner(`No se pudo conectar Zipnova: ${decodeURIComponent(ze)}`)
      router.replace("/dashboard/publicaciones", { scroll: false })
    }
  }, [router])

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.isSeller) return
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch("/api/seller/zipnova/status")
        const d = (await r.json()) as ZipnovaSellerStatus
        if (!cancelled && r.ok) setZipnovaStatus(d)
      } catch {
        if (!cancelled) setZipnovaStatus(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [status, session?.user?.isSeller])

  if (status === "loading" || loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" /></div>
  if (status === "unauthenticated") return null

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return p.title.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
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
          `Se eliminarán ${preview.toRemove} publicaciones duplicadas (${preview.groups} grupos).${skipNote}\n\n¿Continuar?`
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
      load()
    } catch {
      toast.error("Error de red al eliminar duplicados")
    } finally {
      setDeduping(false)
    }
  }

  // PublicarFlow overlay
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Publicaciones</h1>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {session?.user?.isSeller && zipnovaStatus?.oauthAppConfigured && !zipnovaStatus.connected && (
            <Button variant="outline" asChild className="border-slate-300">
              <a href="/api/seller/zipnova/oauth/start">Conectar Zipnova</a>
            </Button>
          )}
          {session?.user?.isSeller && zipnovaStatus?.connected && (
            <span className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
              Zipnova conectado
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={deduping}
            onClick={removeDuplicatePublications}
            className="border-amber-300 text-amber-900 hover:bg-amber-50"
            title="Elimina duplicados si coinciden al menos 2 de: título, SKU y precio"
          >
            {deduping ? <Loader2 size={18} className="mr-1 animate-spin" /> : <CopyMinus size={18} className="mr-1" />}
            Quitar duplicados
          </Button>
          <Button onClick={openCreate} className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"><Plus size={18} className="mr-1" />Nueva</Button>
        </div>
      </div>

      {zipnovaBanner && (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${
            zipnovaBanner.startsWith("No se pudo")
              ? "bg-red-50 text-red-800 border-red-200"
              : "bg-green-50 text-green-800 border-green-200"
          }`}
        >
          {zipnovaBanner}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => {
              setPublicationQuery({
                ...DEFAULT_SELLER_PUBLICATION_QUERY,
                flags: { ...DEFAULT_SELLER_PUBLICATION_QUERY.flags, active: true },
              })
              setPage(1)
            }}
            className="bg-white p-4 rounded-xl shadow-sm border text-left transition-all hover:shadow-md"
          >
            <div className="text-2xl font-bold text-green-600">{summary.active}</div>
            <div className="text-sm text-gray-500">Activas</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setPublicationQuery({
                ...DEFAULT_SELLER_PUBLICATION_QUERY,
                flags: { ...DEFAULT_SELLER_PUBLICATION_QUERY.flags, paused: true },
              })
              setPage(1)
            }}
            className="bg-white p-4 rounded-xl shadow-sm border text-left transition-all hover:shadow-md"
          >
            <div className="text-2xl font-bold text-primary">{summary.paused}</div>
            <div className="text-sm text-gray-500">Pausadas</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setPublicationQuery({
                ...DEFAULT_SELLER_PUBLICATION_QUERY,
                flags: { ...DEFAULT_SELLER_PUBLICATION_QUERY.flags, lowStock: true },
              })
              setPage(1)
            }}
            className="bg-white p-4 rounded-xl shadow-sm border text-left transition-all hover:shadow-md"
          >
            <div className="text-2xl font-bold text-orange-600">{summary.lowStock}</div>
            <div className="text-sm text-gray-500">Stock bajo</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setPublicationQuery({
                ...DEFAULT_SELLER_PUBLICATION_QUERY,
                flags: { ...DEFAULT_SELLER_PUBLICATION_QUERY.flags, noSales: true },
              })
              setPage(1)
            }}
            className="bg-white p-4 rounded-xl shadow-sm border text-left transition-all hover:shadow-md"
          >
            <div className="text-2xl font-bold text-blue-600">{summary.noSales}</div>
            <div className="text-sm text-gray-500">Sin ventas</div>
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex-1 relative min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por título, código o SKU"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex flex-col gap-1 w-full sm:w-56 shrink-0">
            <label htmlFor="pub-sort-toolbar" className="text-xs font-medium text-gray-600">
              Ordenar por
            </label>
            <select
              id="pub-sort-toolbar"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              value={publicationQuery.sort}
              onChange={(e) => {
                const sort = e.target.value as SellerPublicationsSort
                setPublicationQuery((q) => ({ ...q, sort }))
                setPage(1)
              }}
            >
              {PUBL_SORT_GROUPS.map((g) => (
                <optgroup key={g} label={g}>
                  {SELLER_PUBLICATION_SORT_OPTIONS.filter((o) => o.group === g).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <PublicationsFilterButton
            activeCount={countActivePublicationFilters(publicationQuery)}
            onClick={() => setFilterModalOpen(true)}
          />
          <span className="text-sm text-gray-600 whitespace-nowrap">{totalCount} publicaciones</span>
        </div>
      </div>

      <PublicationsFilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        applied={publicationQuery}
        onApply={(q) => {
          setPublicationQuery(q)
          setPage(1)
        }}
      />

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
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
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]?.url || "https://via.placeholder.com/48"} alt={p.title} className="w-12 h-12 rounded-lg object-cover" />
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
                  <td className="p-4"><div className="text-sm font-medium">{fmt(p.price)}</div>{p.originalPrice && <div className="text-xs text-gray-400 line-through">{fmt(p.originalPrice)}</div>}</td>
                  <td className="p-4"><div className="text-sm">{p.stock}</div><div className={`text-xs ${p.stock <= 5 ? "text-red-500" : "text-gray-400"}`}>{p.stock <= 5 ? "Bajo" : "OK"}</div></td>
                  <td className="p-4"><div className="text-sm text-gray-600"><div>👁 {p.views}</div><div>🛒 {p.sales} vendidos</div></div></td>
                  <td className="p-4"><Badge className={qc[ql(p.qualityScore)]}>{ql(p.qualityScore)}</Badge><div className="text-xs mt-1">{el(p.sales, p.views)}</div></td>
                  <td className="p-4"><Badge className={p.isActive ? "text-green-600 bg-green-50" : "text-primary bg-primary/10"}>{p.isActive ? "Activo" : "Pausado"}</Badge><div className="text-xs text-gray-500 mt-1">{rc(p)}</div></td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggle(p.id, !p.isActive)} className="p-1.5 hover:bg-gray-100 rounded" title={p.isActive ? "Pausar" : "Activar"}>{p.isActive ? <Pause size={16} /> : <Play size={16} />}</button>
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded"><Edit size={16} /></button>
                      <button onClick={() => remove(p.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay publicaciones. <button onClick={openCreate} className="text-blue-600 underline">Crear una</button></td></tr>}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></Button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
