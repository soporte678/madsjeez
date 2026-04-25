"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  Search,
  Edit,
  Eye,
  Pause,
  Play,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  sold_count: number;
  view_count: number;
  is_active: boolean;
  is_promoted: boolean;
  created_at: string;
  primary_image: string | null;
}

export default function ProductsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth/login?redirect=/products");
      return;
    }
    setUser(session.user);
    fetchProducts(session.user.id);
  };

  const fetchProducts = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select(`
        *,
        product_images(url, is_primary)
      `)
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      const mappedProducts = data.map((p: any) => ({
        ...p,
        primary_image: p.product_images?.find((img: { is_primary: boolean }) => img.is_primary)?.url ||
                       p.product_images?.[0]?.url,
      }));
      setProducts(mappedProducts);
    }
    setLoading(false);
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !currentStatus })
      .eq("id", productId);

    if (error) {
      toast.error("Error al actualizar el producto");
    } else {
      toast.success(currentStatus ? "Producto pausado" : "Producto activado");
      fetchProducts(user.id);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.")) {
      return;
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      toast.error("Error al eliminar el producto");
    } else {
      toast.success("Producto eliminado");
      fetchProducts(user.id);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && p.is_active) ||
      (statusFilter === "inactive" && !p.is_active);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: products.length,
    active: products.filter((p) => p.is_active).length,
    sold: products.reduce((acc, p) => acc + p.sold_count, 0),
    views: products.reduce((acc, p) => acc + p.view_count, 0),
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={{ id: user.id, email: user.email }} />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold">Mis Productos</h1>
              <p className="text-gray-600">Gestiona tus publicaciones</p>
            </div>
            <Link href="/sell">
              <Button className="bg-[#3483FA]">
                <Plus className="h-4 w-4 mr-2" />
                Publicar nuevo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total publicaciones</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Activas</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Ventas</p>
                <p className="text-2xl font-bold">{stats.sold}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Vistas totales</p>
                <p className="text-2xl font-bold">{stats.views.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Pausados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className={!product.is_active ? "opacity-70" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Image */}
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.primary_image ? (
                          <img
                            src={product.primary_image}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{product.title}</h3>
                          {product.is_promoted && (
                            <Badge className="bg-yellow-100 text-yellow-800">Destacado</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="font-semibold text-gray-900">${product.price.toLocaleString()}</span>
                          <span>Stock: {product.stock}</span>
                          <span>Vendidos: {product.sold_count}</span>
                          <span>Vistas: {product.view_count}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Activo" : "Pausado"}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link href={`/product/${product.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleProductStatus(product.id, product.is_active)}
                        >
                          {product.is_active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => deleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold mb-2">No tienes productos</h2>
                <p className="text-gray-500 mb-6">Comienza publicando tu primer producto</p>
                <Link href="/sell">
                  <Button className="bg-[#3483FA]">
                    <Plus className="h-4 w-4 mr-2" />
                    Publicar producto
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
