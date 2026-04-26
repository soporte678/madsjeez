"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  ShoppingBag,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  status: string;
  total_amount: number;
  shipping_cost: number;
  created_at: string;
  seller_name: string;
  items_count: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  paid: { label: "Pagado", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  preparing: { label: "Preparando", color: "bg-purple-100 text-purple-800", icon: Package },
  shipped: { label: "Enviado", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered: { label: "Entregado", color: "bg-green-100 text-green-800", icon: CheckCircle },
  completed: { label: "Completado", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: XCircle },
  refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-800", icon: XCircle },
};

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { data: session, status } = useSession();

  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("purchases");

  const success = searchParams.get("status") === "success";

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?redirect=/orders");
    }
  }, [status, router]);

  useEffect(() => {
    if (success) {
      toast.success("¡Pedido realizado con éxito!");
    }
  }, [success]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchOrders(session.user.id);
    }
  }, [session]);

  const fetchOrders = async (userId: string) => {
    setLoading(true);

    // Fetch buy orders
    const { data: buys } = await supabase
      .from("orders")
      .select(`
        *,
        seller:profiles!seller_id(full_name),
        items:order_items(count)
      `)
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false });

    if (buys) {
      setBuyOrders(buys.map((o: any) => ({
        ...o,
        seller_name: o.seller?.full_name || "Vendedor",
        items_count: o.items?.[0]?.count || 0,
      })));
    }

    // Fetch sell orders
    const { data: sells } = await supabase
      .from("orders")
      .select(`
        *,
        buyer:profiles!buyer_id(full_name),
        items:order_items(count)
      `)
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    if (sells) {
      setSellOrders(sells.map((o: any) => ({
        ...o,
        seller_name: o.buyer?.full_name || "Comprador",
        items_count: o.items?.[0]?.count || 0,
      })));
    }

    setLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const OrderCard = ({ order, type }: { order: Order; type: "buy" | "sell" }) => {
    const status = statusConfig[order.status] || statusConfig.pending;
    const StatusIcon = status.icon;

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Pedido #{order.id.slice(0, 8)}</p>
              <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
            </div>
            <Badge className={status.color}>
              <StatusIcon className="h-3 w-3 mr-1 inline" />
              {status.label}
            </Badge>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <p className="font-medium">
                {type === "buy" ? `Vendedor: ${order.seller_name}` : `Comprador: ${order.seller_name}`}
              </p>
              <p className="text-sm text-gray-500">{order.items_count} producto(s)</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-lg font-semibold">${order.total_amount.toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/orders/${order.id}`}>
                <Button variant="outline" size="sm">
                  Ver detalle
                </Button>
              </Link>
              <Link href={`/messages?order=${order.id}`}>
                <Button variant="ghost" size="sm">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Mis Pedidos</h1>
              <Link href="/search">
                <Button className="bg-[#3483FA]">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Seguir comprando
                </Button>
              </Link>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="purchases">
                  Mis Compras ({buyOrders.length})
                </TabsTrigger>
                <TabsTrigger value="sales">
                  Mis Ventas ({sellOrders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="purchases">
                {loading ? (
                  <div className="text-center py-12">Cargando...</div>
                ) : buyOrders.length > 0 ? (
                  buyOrders.map((order) => (
                    <OrderCard key={order.id} order={order} type="buy" />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <h2 className="text-xl font-semibold mb-2">No tienes compras</h2>
                      <p className="text-gray-500 mb-4">Explora productos y haz tu primera compra</p>
                      <Link href="/search">
                        <Button className="bg-[#3483FA]">Explorar productos</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="sales">
                {loading ? (
                  <div className="text-center py-12">Cargando...</div>
                ) : sellOrders.length > 0 ? (
                  sellOrders.map((order) => (
                    <OrderCard key={order.id} order={order} type="sell" />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <h2 className="text-xl font-semibold mb-2">No tienes ventas</h2>
                      <p className="text-gray-500 mb-4">Publica productos para comenzar a vender</p>
                      <Link href="/sell">
                        <Button className="bg-[#3483FA]">Publicar producto</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Header user={null} />
        <div className="flex-1 bg-[#EBEBEB] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
