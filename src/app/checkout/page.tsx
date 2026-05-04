"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Truck,
  MapPin,
  Shield,
  Check,
  ChevronRight,
  Package,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    shipping_free: boolean;
    seller_id: string;
    primary_image: string | null;
    seller_name: string;
  };
}

const paymentMethods = [
  { id: "mercadopago", name: "MercadoPago", icon: "💳" },
  { id: "card", name: "Tarjeta de crédito/débito", icon: "💳" },
  { id: "transfer", name: "Transferencia bancaria", icon: "🏦" },
  { id: "cash", name: "Efectivo en puntos de pago", icon: "💵" },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    number: "",
    apartment: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    recipient: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("mercadopago");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth/login?redirect=/checkout");
      return;
    }
    setUser(session.user);
    fetchCart(session.user.id);
  };

  const fetchCart = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("cart_items")
      .select(`
        *,
        product:products(
          id, title, price, shipping_free, seller_id,
          product_images(url, is_primary),
          seller:profiles(full_name)
        )
      `)
      .eq("user_id", userId);

    if (data) {
      const mappedItems = data.map((item: any) => ({
        ...item,
        product: {
          ...item.product,
          primary_image: item.product?.product_images?.[0]?.url,
          seller_name: item.product?.seller?.full_name,
        },
      }));
      setCartItems(mappedItems);
    }
    setLoading(false);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shipping = cartItems.some((item) => !item.product.shipping_free) ? 2500 : 0;
  const total = subtotal + shipping;

  const handleSubmitOrder = async () => {
    if (!user || cartItems.length === 0) return;

    setProcessing(true);

    try {
      // Group items by seller
      const itemsBySeller = cartItems.reduce((acc, item) => {
        const sellerId = item.product.seller_id;
        if (!acc[sellerId]) acc[sellerId] = [];
        acc[sellerId].push(item);
        return acc;
      }, {} as Record<string, CartItem[]>);

      // Create orders for each seller and collect order IDs
      const createdOrders: { orderId: string; sellerId: string; items: CartItem[]; orderShipping: number }[] = [];

      for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        const orderTotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
        const orderShipping = items.some((item) => !item.product.shipping_free) ? 2500 : 0;

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            buyer_id: user.id,
            seller_id: sellerId,
            status: "pending",
            total_amount: orderTotal,
            shipping_cost: orderShipping,
            discount_amount: 0,
            commission_amount: orderTotal * 0.1,
            shipping_address: shippingAddress,
            notes: null,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        for (const item of items) {
          await supabase.from("order_items").insert({
            order_id: order.id,
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.product.price,
            total_price: item.product.price * item.quantity,
            commission_rate: 10,
            commission_amount: item.product.price * item.quantity * 0.1,
          });
        }

        createdOrders.push({ orderId: order.id, sellerId, items, orderShipping });
      }

      // MercadoPago: create preference and redirect
      if (paymentMethod === "mercadopago") {
        // Use the first order (single seller flow for now)
        const { orderId, sellerId, items: orderItems, orderShipping } = createdOrders[0];

        const mpItems = orderItems.map((item) => ({
          id: item.product.id,
          title: item.product.title,
          quantity: item.quantity,
          unit_price: item.product.price,
          seller_id: sellerId,
        }));

        const prefResponse = await fetch("/api/seller/payment-gateway/mercadopago/create-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: mpItems,
            shipping_cost: orderShipping,
            buyer_email: user.email,
            order_id: orderId,
          }),
        });

        if (!prefResponse.ok) {
          const err = await prefResponse.json();
          throw new Error(err.error || "Error al crear preferencia de pago");
        }

        const prefData = await prefResponse.json();

        // Clear cart before redirecting
        await supabase.from("cart_items").delete().eq("user_id", user.id);

        // Redirect to MercadoPago checkout
        window.location.href = prefData.init_point;
        return;
      }

      // Other payment methods: clear cart and redirect
      await supabase.from("cart_items").delete().eq("user_id", user.id);

      toast.success("¡Pedido realizado con éxito!");
      router.push("/orders?status=success");
    } catch (error: any) {
      toast.error(error.message || "Error al procesar el pedido");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={user ? { id: user.id, email: user.email } : null} />
        <main className="flex-1 bg-[#EBEBEB] flex items-center justify-center">
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
              <p className="text-gray-500 mb-4">Agrega productos para continuar</p>
              <Link href="/search">
                <Button className="bg-[#3483FA]">Explorar productos</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={{ id: user.id, email: user.email }} />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Progress */}
            <div className="flex items-center justify-center mb-8">
              {[
                { num: 1, label: "Envío" },
                { num: 2, label: "Pago" },
                { num: 3, label: "Confirmación" },
              ].map((s, i) => (
                <div key={s.num} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step >= s.num
                        ? "bg-[#3483FA] text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step > s.num ? <Check className="h-5 w-5" /> : s.num}
                  </div>
                  <span className="ml-2 mr-4 text-sm hidden sm:block">{s.label}</span>
                  {i < 2 && <ChevronRight className="h-5 w-5 text-gray-400 mx-2" />}
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {step === 1 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Dirección de envío
                      </h2>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label>Nombre del destinatario *</Label>
                            <Input
                              value={shippingAddress.recipient}
                              onChange={(e) =>
                                setShippingAddress({ ...shippingAddress, recipient: e.target.value })
                              }
                              placeholder="Nombre y apellido"
                            />
                          </div>

                          <div className="col-span-2">
                            <Label>Calle *</Label>
                            <Input
                              value={shippingAddress.street}
                              onChange={(e) =>
                                setShippingAddress({ ...shippingAddress, street: e.target.value })
                              }
                              placeholder="Nombre de la calle"
                            />
                          </div>

                          <div>
                            <Label>Número *</Label>
                            <Input
                              value={shippingAddress.number}
                              onChange={(e) =>
                                setShippingAddress({ ...shippingAddress, number: e.target.value })
                              }
                              placeholder="123"
                            />
                          </div>

                          <div>
                            <Label>Depto/Piso (opcional)</Label>
                            <Input
                              value={shippingAddress.apartment}
                              onChange={(e) =>
                                setShippingAddress({ ...shippingAddress, apartment: e.target.value })
                              }
                              placeholder="4B"
                            />
                          </div>

                          <div>
                            <Label>Ciudad *</Label>
                            <Input
                              value={shippingAddress.city}
                              onChange={(e) =>
                                setShippingAddress({ ...shippingAddress, city: e.target.value })
                              }
                              placeholder="Ciudad"
                            />
                          </div>

                          <div>
                            <Label>Provincia *</Label>
                            <Input
                              value={shippingAddress.state}
                              onChange={(e) =>
                                setShippingAddress({ ...shippingAddress, state: e.target.value })
                              }
                              placeholder="Provincia"
                            />
                          </div>

                          <div>
                            <Label>Código postal *</Label>
                            <Input
                              value={shippingAddress.zip}
                              onChange={(e) =>
                                setShippingAddress({ ...shippingAddress, zip: e.target.value })
                              }
                              placeholder="1000"
                            />
                          </div>

                          <div>
                            <Label>Teléfono *</Label>
                            <Input
                              value={shippingAddress.phone}
                              onChange={(e) =>
                                setShippingAddress({ ...shippingAddress, phone: e.target.value })
                              }
                              placeholder="+54 11 1234-5678"
                            />
                          </div>
                        </div>

                        <Button
                          className="w-full mt-6 bg-[#3483FA]"
                          onClick={() => setStep(2)}
                          disabled={
                            !shippingAddress.recipient ||
                            !shippingAddress.street ||
                            !shippingAddress.number ||
                            !shippingAddress.city ||
                            !shippingAddress.state ||
                            !shippingAddress.zip ||
                            !shippingAddress.phone
                          }
                        >
                          Continuar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {step === 2 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Método de pago
                      </h2>

                      <div className="space-y-3">
                        {paymentMethods.map((method) => (
                          <div
                            key={method.id}
                            className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                              paymentMethod === method.id
                                ? "border-[#3483FA] bg-blue-50"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => setPaymentMethod(method.id)}
                          >
                            <input
                              type="radio"
                              name="payment"
                              value={method.id}
                              checked={paymentMethod === method.id}
                              onChange={() => setPaymentMethod(method.id)}
                              className="h-4 w-4 text-[#3483FA]"
                            />
                            <Label className="flex-1 cursor-pointer">
                              <span className="mr-2">{method.icon}</span>
                              {method.name}
                            </Label>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3 mt-6">
                        <Button variant="outline" onClick={() => setStep(1)}>
                          Volver
                        </Button>
                        <Button className="flex-1 bg-[#3483FA]" onClick={() => setStep(3)}>
                          Continuar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {step === 3 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Confirmar pedido
                      </h2>

                      <div className="space-y-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="font-medium mb-2">Dirección de envío</p>
                          <p className="text-sm text-gray-600">{shippingAddress.recipient}</p>
                          <p className="text-sm text-gray-600">
                            {shippingAddress.street} {shippingAddress.number}
                            {shippingAddress.apartment && `, ${shippingAddress.apartment}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {shippingAddress.zip}, {shippingAddress.city}, {shippingAddress.state}
                          </p>
                          <p className="text-sm text-gray-600">Tel: {shippingAddress.phone}</p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="font-medium mb-2">Método de pago</p>
                          <p className="text-sm text-gray-600">
                            {paymentMethods.find((m) => m.id === paymentMethod)?.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep(2)}>
                          Volver
                        </Button>
                        <Button
                          className="flex-1 bg-[#3483FA]"
                          onClick={handleSubmitOrder}
                          disabled={processing}
                        >
                          {processing ? (
                            <>
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Confirmar compra
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Summary */}
              <div>
                <Card className="sticky top-4">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Resumen de compra</h3>

                    <div className="space-y-3 mb-4">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                            {item.product.primary_image ? (
                              <img
                                src={item.product.primary_image}
                                alt={item.product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-full h-full p-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-2">{item.product.title}</p>
                            <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                            <p className="font-semibold">
                              ${(item.product.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span>${subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Envío</span>
                        <span>{shipping === 0 ? "Gratis" : `$${shipping.toLocaleString()}`}</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>${total.toLocaleString()}</span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                      <Shield className="h-4 w-4" />
                      <span>Compra protegida por MADSJEEZ</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
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
      <CheckoutContent />
    </Suspense>
  );
}
