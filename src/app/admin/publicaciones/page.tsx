"use client"

import { useState, useEffect } from "react"
import {
  Package,
  Search,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Edit,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Product {
  id: string
  title: string
  price: number
  status: "active" | "inactive" | "pending" | "rejected"
  seller_id: string
  seller_name: string
  seller_email: string
  category: string
  images: string[]
  created_at: string
  views: number
  sold_count: number
  stock: number
  is_featured: boolean
}

export default function PublicacionesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "pending" | "rejected">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20

  useEffect(() => {
    fetchProducts()
  }, [filter, currentPage])

  const fetchProducts = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase
        .from("products")
        .select("*, seller:seller_id(name, email)", { count: "exact" })

      if (filter !== "all") query = query.eq("status", filter)

      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) throw error

      const formattedProducts: Product[] = data?.map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        status: p.status || "pending",
        seller_id: p.seller_id,
        seller_name: p.seller?.name || "Sin nombre",
        seller_email: p.seller?.email || "",
        category: p.category || "Sin categoría",
        images: p.product_images?.map((img: any) => img.image_url) || [],
        created_at: p.created_at,
        views: p.views || 0,
        sold_count: p.sold_count || 0,
        stock: p.stock || 0,
        is_featured: p.is_featured || false,
      })) || []

      setProducts(formattedProducts)
      setTotalCount(count || 0)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Error al cargar publicaciones")
    } finally {
      setLoading(false)
    }
  }

  const updateProductStatus = async (productId: string, status: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("products")
        .update({ status })
        .eq("id", productId)

      if (error) throw error

      toast.success(`Producto ${status === "active" ? "aprobado" : "rechazado"}`)
      fetchProducts()
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error("Error al actualizar producto")
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta publicación?")) return
    
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId)

      if (error) throw error

      toast.success("Producto eliminado")
      fetchProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Error al eliminar producto")
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-gray-100 text-gray-800 border-gray-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    }
    const labels: Record<string, string> = {
      active: "Activo",
      inactive: "Inactivo",
      pending: "Pendiente",
      rejected: "Rechazado",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[status] || colors.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.seller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Moderación de Publicaciones
          </h2>
          <p className="text-sm text-gray-500">
            {totalCount} publicaciones | {products.filter(p => p.status === "pending").length} pendientes
          </p>
        </div>
        <button
          onClick={fetchProducts}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar publicación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as any)
            setCurrentPage(1)
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="pending">Pendientes</option>
          <option value="rejected">Rechazados</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Activos", value: products.filter(p => p.status === "active").length, color: "green" },
          { label: "Pendientes", value: products.filter(p => p.status === "pending").length, color: "yellow" },
          { label: "Rechazados", value: products.filter(p => p.status === "rejected").length, color: "red" },
          { label: "Inactivos", value: products.filter(p => p.status === "inactive").length, color: "gray" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-${stat.color}-50 p-4 rounded-lg border border-${stat.color}-200`}>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Producto</th>
                <th className="p-4 font-semibold text-gray-700">Vendedor</th>
                <th className="p-4 font-semibold text-gray-700">Precio</th>
                <th className="p-4 font-semibold text-gray-700">Estado</th>
                <th className="p-4 font-semibold text-gray-700">Stock/Ventas</th>
                <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No hay publicaciones
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {product.images[0] ? (
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{product.title}</p>
                          <p className="text-xs text-gray-500">ID: {product.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{product.seller_name}</p>
                        <p className="text-xs text-gray-500">{product.seller_email}</p>
                      </div>
                    </td>
                    <td className="p-4 font-medium">${product.price.toLocaleString("es-AR")}</td>
                    <td className="p-4">{getStatusBadge(product.status)}</td>
                    <td className="p-4 text-sm">
                      <p>{product.stock} en stock</p>
                      <p className="text-gray-500">{product.sold_count} vendidos</p>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/product/${product.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver producto"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        {product.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateProductStatus(product.id, "active")}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Aprobar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateProductStatus(product.id, "rejected")}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Rechazar"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {product.status === "active" && (
                          <button
                            onClick={() => updateProductStatus(product.id, "inactive")}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Desactivar"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
