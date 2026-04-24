import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Star, 
  MessageSquare,
  Plus,
  BarChart3,
  Zap
} from "lucide-react";

async function getDashboardData(userId: string) {
  const supabase = await createClient();
  
  // Obtener datos del vendedor
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, reputation_scores(*)")
    .eq("id", userId)
    .single();
  
  // Contar productos
  const { count: productsCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", userId);
  
  // Contar órdenes
  const { count: ordersCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", userId);
  
  // Obtener suscripción activa
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, tier:subscription_tiers(*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();
  
  return {
    profile,
    productsCount: productsCount || 0,
    ordersCount: ordersCount || 0,
    subscription,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?redirect=/dashboard");
  }

  const { profile, productsCount, ordersCount, subscription } = await getDashboardData(session.user.id) as any;

  // Si no es vendedor, redirigir a convertirse en vendedor
  if (profile?.role === "buyer") {
    redirect("/become-seller");
  }

  const tierName = subscription?.tier?.name || "Gratis";
  const commissionRate = subscription?.tier?.commission_rate || 10;

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={session.user} />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8">
          {/* Header del Dashboard */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold">Panel de Vendedor</h1>
              <p className="text-gray-600">
                Bienvenido, {profile?.full_name || session.user.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-base px-3 py-1">
                Plan {tierName}
              </Badge>
              <Link href="/products/new">
                <Button className="bg-[#3483FA]">
                  <Plus className="h-4 w-4 mr-2" />
                  Publicar producto
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Productos</CardTitle>
                <Package className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productsCount}</div>
                <p className="text-xs text-gray-500">Publicaciones activas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ventas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ordersCount}</div>
                <p className="text-xs text-gray-500">Órdenes totales</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Comisión</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{commissionRate}%</div>
                <p className="text-xs text-gray-500">Por venta</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Reputación</CardTitle>
                <Star className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {profile?.reputation_scores?.color?.replace("_", " ") || "Nueva"}
                </div>
                <p className="text-xs text-gray-500">
                  {profile?.reputation_scores?.total_sales || 0} ventas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Acciones Rápidas */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Link href="/products">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Mis Productos</h3>
                      <p className="text-sm text-gray-500">Gestionar publicaciones</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/orders/sales">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Mis Ventas</h3>
                      <p className="text-sm text-gray-500">Ver órdenes y envíos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/messages">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Mensajes</h3>
                      <p className="text-sm text-gray-500">Chat con compradores</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Suscripción y Mejoras */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Tu Suscripción
                </CardTitle>
                <CardDescription>
                  Plan actual: {tierName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm mb-4">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Publicaciones ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {subscription?.tier?.max_images_per_product || 5} imágenes por producto
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Comisión del {commissionRate}%
                  </li>
                </ul>
                <Link href="/subscriptions">
                  <Button variant="outline" className="w-full">
                    {tierName === "Gratis" ? "Mejorar plan" : "Gestionar suscripción"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Estadísticas
                </CardTitle>
                <CardDescription>
                  Resumen de tu desempeño
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ventas este mes</span>
                    <span className="font-semibold">--</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ingresos estimados</span>
                    <span className="font-semibold">--</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Calificación promedio</span>
                    <span className="font-semibold">
                      {profile?.reputation_scores?.average_rating?.toFixed(1) || "--"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
