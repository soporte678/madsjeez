"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Ban,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  reportedProducts: number;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  is_active: boolean;
}

interface Product {
  id: string;
  title: string;
  seller_name: string;
  is_active: boolean;
  is_reported: boolean;
  created_at: string;
}

function AdminDashboardContent() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    reportedProducts: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth/login");
      return;
    }

    setUser(session.user);

    // Verificar si es admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      toast.error("No tienes permisos de administrador");
      router.push("/");
      return;
    }

    setIsAdmin(true);
    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    setLoading(true);

    // Stats
    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    const { count: ordersCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    const { count: pendingOrdersCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { data: revenueData } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "completed");

    const totalRevenue =
      revenueData?.reduce((acc, order) => acc + order.total_amount, 0) || 0;

    setStats({
      totalUsers: usersCount || 0,
      totalProducts: productsCount || 0,
      totalOrders: ordersCount || 0,
      totalRevenue,
      pendingOrders: pendingOrdersCount || 0,
      reportedProducts: 0,
    });

    // Recent users
    const { data: usersData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (usersData) setUsers(usersData);

    // Recent products
    const { data: productsData } = await supabase
      .from("products")
      .select(`
        *,
        seller:profiles(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (productsData) {
      setProducts(
        productsData.map((p: any) => ({
          ...p,
          seller_name: p.seller?.full_name,
        }))
      );
    }

    setLoading(false);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !currentStatus })
      .eq("id", userId);

    if (error) {
      toast.error("Error al actualizar usuario");
    } else {
      toast.success(currentStatus ? "Usuario desactivado" : "Usuario activado");
      fetchDashboardData();
    }
  };

  const toggleProductStatus = async (
    productId: string,
    currentStatus: boolean
  ) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !currentStatus })
      .eq("id", productId);

    if (error) {
      toast.error("Error al actualizar producto");
    } else {
      toast.success(
        currentStatus ? "Producto desactivado" : "Producto activado"
      );
      fetchDashboardData();
    }
  };

  if (!isAdmin) {
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Panel de Administración</h1>
              <p className="text-gray-600">Gestiona usuarios, productos y pedidos</p>
            </div>
            <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Usuarios</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Productos</p>
                    <p className="text-2xl font-bold">{stats.totalProducts}</p>
                  </div>
                  <Package className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pedidos</p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Ingresos</p>
                    <p className="text-2xl font-bold">
                      ${stats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {(stats.pendingOrders > 0 || stats.reportedProducts > 0) && (
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {stats.pendingOrders > 0 && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-800">
                          {stats.pendingOrders} pedidos pendientes
                        </p>
                        <Link href="/admin/orders">
                          <Button variant="link" className="p-0 h-auto text-yellow-700">
                            Ver pedidos
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="users">
            <TabsList className="mb-6">
              <TabsTrigger value="users">Usuarios</TabsTrigger>
              <TabsTrigger value="products">Productos</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Usuarios recientes</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar usuarios..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Usuario</th>
                          <th className="text-left py-3 px-4">Email</th>
                          <th className="text-left py-3 px-4">Registro</th>
                          <th className="text-left py-3 px-4">Estado</th>
                          <th className="text-left py-3 px-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b">
                            <td className="py-3 px-4">{u.full_name || "N/A"}</td>
                            <td className="py-3 px-4">{u.email}</td>
                            <td className="py-3 px-4">
                              {new Date(u.created_at).toLocaleDateString("es-AR")}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={u.is_active ? "default" : "secondary"}
                              >
                                {u.is_active ? "Activo" : "Inactivo"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toggleUserStatus(u.id, u.is_active)
                                }
                              >
                                {u.is_active ? (
                                  <Ban className="h-4 w-4 text-red-500" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Productos recientes</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar productos..."
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Producto</th>
                          <th className="text-left py-3 px-4">Vendedor</th>
                          <th className="text-left py-3 px-4">Fecha</th>
                          <th className="text-left py-3 px-4">Estado</th>
                          <th className="text-left py-3 px-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id} className="border-b">
                            <td className="py-3 px-4">{p.title}</td>
                            <td className="py-3 px-4">{p.seller_name}</td>
                            <td className="py-3 px-4">
                              {new Date(p.created_at).toLocaleDateString("es-AR")}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={p.is_active ? "default" : "secondary"}
                              >
                                {p.is_active ? "Activo" : "Inactivo"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Link href={`/product/${p.id}`}>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleProductStatus(p.id, p.is_active)
                                  }
                                >
                                  {p.is_active ? (
                                    <Ban className="h-4 w-4 text-red-500" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <Header user={null} />
          <div className="flex-1 bg-[#EBEBEB] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Cargando...</p>
            </div>
          </div>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
