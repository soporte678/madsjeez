"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Package,
  Truck,
  MapPin,
  CreditCard,
  MessageSquare,
  Star,
  CheckCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  status: string;
  total_amount: number;
  shipping_cost: number;
  created_at: string;
  shipping_address: any;
  seller_id: string;
  seller_name: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_title: string;
  product_image: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  paid: { label: "Pagado", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  preparing: { label: "Preparando", color: "bg-purple-100 text-purple-800", icon: Package },
  shipped: { label: "Enviado", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered: { label: "Entregado", color: "bg-green-100 text-green-800", icon: CheckCircle },
  completed: { label: "Completado", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: Clock },
};

function OrderDetailContent() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const orderId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

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
    fetchOrder(session.user.id);
  };

  const fetchOrder = async (userId: string) => {
    setLoading(true);

    const { data: orderData } = await supabase
      .from("orders")
      .select(`
        *,
        seller:profiles!seller_id(full_name),
        items:order_items(
          *,
          product:products(title, product_images(url))
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderData) {
      const mappedOrder: Order = {
        ...orderData,
        seller_name: orderData.seller?.full_name || "Vendedor",
        items: orderData.items?.map((item: any) => ({
          ...item,
          product_title: item.product?.title,
          product_image: item.product?.product_images?.[0]?.url,
        })) || [],
      };
      setOrder(mappedOrder);
    }

    setLoading(false);
  };

  const submitReview = async () => {
    if (!user || !order) return;

    setSubmittingReview(true);

    const { error } = await supabase.from("reviews").insert({
      order_id: order.id,
      reviewer_id: user.id,
      seller_id: order.seller_id,
      rating: parseInt(reviewRating),
      comment: reviewComment,
      is_positive: parseInt(reviewRating) >= 4,
      is_visible: true,
    });

    if (error) {
      toast.error("Error al enviar la reseña");
    } else {
      toast.success("¡Gracias por tu reseña!");
      setShowReviewForm(false);
    }

    setSubmittingReview(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={null} />
        <main className="flex-1 bg-[#EBEBEB] flex items-center justify-center">
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Pedido no encontrado</h2>
              <Link href="/orders">
                <Button className="bg-[#3483FA]">Volver a pedidos</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={{ id: user.id, email: user.email }} />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back button */}
          <Link href="/orders">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a pedidos
            </Button>
          </Link>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        Pedido #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1 inline" />
                      {status.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold mb-4">Productos</h2>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt={item.product_title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-full h-full p-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.product_title}</p>
                          <p className="text-sm text-gray-500">
                            Cantidad: {item.quantity}
                          </p>
                          <p className="font-semibold">
                            ${item.total_price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <h2 className="font-semibold">Dirección de envío</h2>
                  </div>
                  <div className="text-gray-600">
                    <p className="font-medium">{order.shipping_address?.recipient}</p>
                    <p>
                      {order.shipping_address?.street}{" "}
                      {order.shipping_address?.number}
                    </p>
                    <p>
                      {order.shipping_address?.zip},{" "}
                      {order.shipping_address?.city}
                    </p>
                    <p>{order.shipping_address?.state}</p>
                    <p>Tel: {order.shipping_address?.phone}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Review Form */}
              {order.status === "completed" && !showReviewForm && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold">Calificar compra</h2>
                        <p className="text-sm text-gray-500">
                          Comparte tu experiencia con el vendedor
                        </p>
                      </div>
                      <Button onClick={() => setShowReviewForm(true)}>
                        <Star className="h-4 w-4 mr-2" />
                        Dejar reseña
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {showReviewForm && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-semibold mb-4">Dejar reseña</h2>

                    <div className="space-y-4">
                      <div>
                        <Label>Calificación</Label>
                        <div className="flex gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setReviewRating(star.toString())}
                              className={`text-2xl ${
                                parseInt(reviewRating) >= star
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="comment">Comentario</Label>
                        <Textarea
                          id="comment"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Describe tu experiencia..."
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowReviewForm(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={submitReview}
                          disabled={
                            submittingReview || reviewComment.length < 10
                          }
                          className="bg-[#3483FA]"
                        >
                          {submittingReview
                            ? "Enviando..."
                            : "Enviar reseña"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold mb-4">Resumen</h2>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>
                        ${(
                          order.total_amount - order.shipping_cost
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Envío</span>
                      <span>
                        {order.shipping_cost === 0
                          ? "Gratis"
                          : `$${order.shipping_cost.toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${order.total_amount.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold mb-4">Vendedor</h2>
                  <p className="font-medium">{order.seller_name}</p>
                  <Link href={`/messages?seller=${order.seller_id}`}>
                    <Button variant="outline" className="w-full mt-4">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contactar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OrderDetailPage() {
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
      <OrderDetailContent />
    </Suspense>
  );
}
