"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Eye,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  totalViews: number;
  conversionRate: number;
  salesChange: number;
  ordersChange: number;
  viewsChange: number;
  topProducts: any[];
  recentOrders: any[];
  salesByDay: any[];
}

function AnalyticsContent() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<AnalyticsData>({
    totalSales: 0,
    totalOrders: 0,
    totalViews: 0,
    conversionRate: 0,
    salesChange: 0,
    ordersChange: 0,
    viewsChange: 0,
    topProducts: [],
    recentOrders: [],
    salesByDay: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, period]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth/login?redirect=/dashboard/analytics");
      return;
    }
    setUser(session.user);
  };

  const fetchAnalytics = async () => {
    setLoading(true);

    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total sales
    const { data: salesData } = await supabase
      .from("orders")
      .select("total_amount, created_at")
      .eq("seller_id", user.id)
      .eq("status", "completed")
      .gte("created_at", startDate.toISOString());

    const totalSales =
      salesData?.reduce((acc, order) => acc + order.total_amount, 0) || 0;

    // Total orders
    const { count: ordersCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", user.id)
      .gte("created_at", startDate.toISOString());

    // Total views
    const { data: productsData } = await supabase
      .from("products")
      .select("view_count")
      .eq("seller_id", user.id);

    const totalViews =
      productsData?.reduce((acc, p) => acc + (p.view_count || 0), 0) || 0;

    // Top products
    const { data: topProductsData } = await supabase
      .from("products")
      .select(`
        id, title, price, sold_count, view_count,
        product_images(url)
      `)
      .eq("seller_id", user.id)
      .order("sold_count", { ascending: false })
      .limit(5);

    // Recent orders
    const { data: recentOrdersData } = await supabase
      .from("orders")
      .select(`
        *,
        buyer:profiles(full_name)
      `)
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setData({
      totalSales,
      totalOrders: ordersCount || 0,
      totalViews,
      conversionRate: totalViews > 0 ? (ordersCount || 0) / totalViews : 0,
      salesChange: 12.5, // Mock data
      ordersChange: 8.3,
      viewsChange: -2.1,
      topProducts:
        topProductsData?.map((p: any) => ({
          ...p,
          primary_image: p.product_images?.[0]?.url,
        })) || [],
      recentOrders:
        recentOrdersData?.map((o: any) => ({
          ...o,
          buyer_name: o.buyer?.full_name,
        })) || [],
      salesByDay: [],
    });

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value);
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold">Análisis y Reportes</h1>
              <p className="text-gray-600">Estadísticas de tu tienda</p>
            </div>
            <div className="flex gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 3 meses</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Cargando...</div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Ventas totales</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(data.totalSales)}
                        </p>
                        <div
                          className={`flex items-center text-sm ${
                            data.salesChange >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {data.salesChange >= 0 ? (
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                          )}
                          {Math.abs(data.salesChange)}%
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Pedidos</p>
                        <p className="text-2xl font-bold">{data.totalOrders}</p>
                        <div
                          className={`flex items-center text-sm ${
                            data.ordersChange >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {data.ordersChange >= 0 ? (
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                          )}
                          {Math.abs(data.ordersChange)}%
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Vistas</p>
                        <p className="text-2xl font-bold">
                          {data.totalViews.toLocaleString()}
                        </p>
                        <div
                          className={`flex items-center text-sm ${
                            data.viewsChange >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {data.viewsChange >= 0 ? (
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                          )}
                          {Math.abs(data.viewsChange)}%
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Eye className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Conversión</p>
                        <p className="text-2xl font-bold">
                          {(data.conversionRate * 100).toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-400">
                          Promedio del mercado: 2.5%
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-semibold mb-4">Productos más vendidos</h2>
                    
                    {data.topProducts.length > 0 ? (
                      <div className="space-y-4">
                        {data.topProducts.map((product, index) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-4"
                          >
                            <span className="text-2xl font-bold text-gray-300 w-8">
                              {index + 1}
                            </span>
                            
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                              {product.primary_image ? (
                                <img
                                  src={product.primary_image}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-full h-full p-4 text-gray-400" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <p className="font-medium line-clamp-1">
                                {product.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {product.sold_count} vendidos
                              </p>
                            </div>
                            
                            <p className="font-semibold">
                              ${product.price.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        Aún no tienes ventas
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold">Pedidos recientes</h2>
                      <Link href="/orders">
                        <Button variant="link">Ver todos</Button>
                      </Link>
                    </div>
                    
                    {data.recentOrders.length > 0 ? (
                      <div className="space-y-3">
                        {data.recentOrders.slice(0, 5).map((order) => (
                          <Link
                            key={order.id}
                            href={`/orders/${order.id}`}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                          >
                            <div>
                              <p className="font-medium">
                                Pedido #{order.id.slice(0, 8)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {order.buyer_name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                ${order.total_amount.toLocaleString()}
                              </p>
                              <Badge
                                variant={
                                  order.status === "completed"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {order.status}
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        No hay pedidos recientes
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AnalyticsPage() {
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
      <AnalyticsContent />
    </Suspense>
  );
}
