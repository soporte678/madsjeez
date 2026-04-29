"use client"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Search, Edit, Trash2, Pause, Play, Plus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface P { id: string; title: string; sku: string; price: number; originalPrice: number | null; stock: number; isActive: boolean; views: number; sales: number; condition: string; freeShipping: boolean; shippingCost: number; qualityScore: number; category: { name: string } | null; images: { url: string }[] }
interface S { active: number; paused: number; lowStock: number; noSales: number }
const fmt = (v: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(v)
const ql = (s: number) => s >= 80 ? "Excelente" : s >= 60 ? "Buena" : s >= 40 ? "Regular" : "Mala"
const qc: Record<string, string> = { Excelente: "text-green-600 bg-green-50", Buena: "text-blue-600 bg-blue-50", Regular: "text-yellow-600 bg-yellow-50", Mala: "text-red-600 bg-red-50" }
const el = (sales: number, views: number) => views === 0 ? "Neutral" : sales / views >= 0.1 ? "Muy positiva" : sales / views >= 0.05 ? "Positiva" : sales / views >= 0.02 ? "Mejorar" : "Negativa"
const ec: Record<string, string> = { "Muy positiva": "text-green-600 bg-green-50", Positiva: "text-blue-600 bg-blue-50", Neutral: "text-gray-600 bg-gray-50", Mejorar: "text-orange-600 bg-orange-50", Negativa: "text-red-600 bg-red-50" }
const rc = (p: P) => !p.isActive ? "PAUSADA" : p.stock <= 0 ? "Sin stock" : p.qualityScore < 40 ? "Mejorar fotos" : p.sales === 0 && p.views > 100 ? "Ajustar precio" : "Bien hecho"

export default function Page() {
  const { status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<P[]>([])
  const [summary, setSummary] = useState<S | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", description: "", sku: "", price: "", originalPrice: "", stock: "", condition: "new", freeShipping: false, shippingCost: "", imageUrl: "" })
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams(); if (filter !== "all") p.set("status", filter)
      const r = await fetch(`/api/dashboard/products?${p}`)
      const d = await r.json()
      setProducts(d.products || [])
      setSummary(d.summary || null)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [filter])

  useEffect(() => { if (status === "authenticated") load() }, [status, load])
  useEffect(() => { if (status === "unauthenticated") router.push("/auth/login?redirect=/dashboard/publicaciones") }, [status, router])

  if (status === "loading" || loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
  if (status === "unauthenticated") return null

  const filtered = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))

  const openCreate = () => { setEditId(null); setForm({ title: "", description: "", sku: "", price: "", originalPrice: "", stock: "", condition: "new", freeShipping: false, shippingCost: "", imageUrl: "" }); setModal(true) }
  const openEdit = (p: P) => { setEditId(p.id); setForm({ title: p.title, description: "", sku: p.sku, price: String(p.price), originalPrice: p.originalPrice ? String(p.originalPrice) : "", stock: String(p.stock), condition: p.condition, freeShipping: p.freeShipping, shippingCost: String(p.shippingCost || 0), imageUrl: p.images[0]?.url || "" }); setModal(true) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true)
    const { title, description, sku, price, originalPrice, stock, condition, freeShipping, shippingCost, imageUrl } = form
    const body = { title, description, sku, price: parseFloat(price), originalPrice: originalPrice ? parseFloat(originalPrice) : null, stock: parseInt(stock), condition, freeShipping, shippingCost: shippingCost ? parseFloat(shippingCost) : 0, images: imageUrl ? [imageUrl] : [] }
    try {
      const r = await fetch("/api/dashboard/products", { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editId ? { id: editId, ...body } : body) })
      if (!r.ok) throw new Error("Error")
      setModal(false); load()
    } catch { alert("Error al guardar") }
    setBusy(false)
  }

  const toggle = async (id: string, active: boolean) => { await fetch("/api/dashboard/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive: active }) }); load() }
  const remove = async (id: string) => { if (!confirm("Eliminar publicación?")) return; await fetch(`/api/dashboard/products?id=${id}`, { method: "DELETE" }); load() }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Publicaciones</h1>
        <Button onClick={openCreate} className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold"><Plus size={18} className="mr-1" />Nueva</Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border"><div className="text-2xl font-bold text-green-600">{summary.active}</div><div className="text-sm text-gray-500">Activas</div></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border"><div className="text-2xl font-bold text-yellow-600">{summary.paused}</div><div className="text-sm text-gray-500">Pausadas</div></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border"><div className="text-2xl font-bold text-orange-600">{summary.lowStock}</div><div className="text-sm text-gray-500">Stock bajo</div></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border"><div className="text-2xl font-bold text-blue-600">{summary.noSales}</div><div className="text-sm text-gray-500">Sin ventas</div></div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Buscar por título o SKU" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg outline-none"><option value="all">Todas</option><option value="active">Activas</option><option value="paused">Pausadas</option><option value="low_stock">Stock bajo</option><option value="no_sales">Sin ventas</option></select>
      </div>

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
                  <td className="p-4"><div className="flex items-center gap-3"><img src={p.images[0]?.url || "https://via.placeholder.com/48"} alt={p.title} className="w-12 h-12 rounded-lg object-cover" /><div><h4 className="text-sm font-medium text-gray-900 line-clamp-2">{p.title}</h4><div className="flex gap-2 mt-1">{p.freeShipping && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Envío gratis</span>}<span className="text-xs text-gray-400">{p.sku}</span></div></div></div></td>
                  <td className="p-4"><div className="text-sm font-medium">{fmt(p.price)}</div>{p.originalPrice && <div className="text-xs text-gray-400 line-through">{fmt(p.originalPrice)}</div>}</td>
                  <td className="p-4"><div className="text-sm">{p.stock}</div><div className={`text-xs ${p.stock <= 5 ? "text-red-500" : "text-gray-400"}`}>{p.stock <= 5 ? "Bajo" : "OK"}</div></td>
                  <td className="p-4"><div className="text-sm text-gray-600"><div>👁 {p.views}</div><div>🛒 {p.sales} vendidos</div></div></td>
                  <td className="p-4"><Badge className={qc[ql(p.qualityScore)]}>{ql(p.qualityScore)}</Badge><div className="text-xs mt-1">{el(p.sales, p.views)}</div></td>
                  <td className="p-4"><Badge className={p.isActive ? "text-green-600 bg-green-50" : "text-yellow-600 bg-yellow-50"}>{p.isActive ? "Activo" : "Pausado"}</Badge><div className="text-xs text-gray-500 mt-1">{rc(p)}</div></td>
                  <td className="p-4"><div className="flex items-center gap-2"><button onClick={() => toggle(p.id, !p.isActive)} className="p-1.5 hover:bg-gray-100 rounded" title={p.isActive ? "Pausar" : "Activar"}>{p.isActive ? <Pause size={16} /> : <Play size={16} />}</button><button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded"><Edit size={16} /></button><button onClick={() => remove(p.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay publicaciones. <button onClick={openCreate} className="text-blue-600 underline">Crear una</button></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b"><h2 className="text-lg font-bold">{editId ? "Editar" : "Nueva"} publicación</h2><button onClick={() => setModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button></div>
            <form onSubmit={submit} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Nombre</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium mb-1">SKU</label><input required value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Precio</label><input required type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium mb-1">Precio original</label><input type="number" step="0.01" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Stock</label><input required type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium mb-1">Condición</label><select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none"><option value="new">Nuevo</option><option value="used">Usado</option></select></div>
              </div>
              <div className="flex items-center gap-2"><input type="checkbox" id="fs" checked={form.freeShipping} onChange={e => setForm({ ...form, freeShipping: e.target.checked })} /><label htmlFor="fs" className="text-sm">Envío gratis</label></div>
              <div><label className="block text-sm font-medium mb-1">Imagen URL</label><input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setModal(false)}>Cancelar</Button><Button type="submit" disabled={busy} className="bg-yellow-400 hover:bg-yellow-500 text-slate-900">{busy ? "Guardando..." : "Guardar"}</Button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
