"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  MapPin,
  Shield,
  Check,
  ChevronRight,
  Package,
  Lock,
} from "lucide-react";
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

function mapApiCartToItems(cart: {
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      title: string;
      price: number;
      freeShipping: boolean;
      seller: { id: string; name: string };
      images: Array<{ url: string }>;
    };
  }>;
}): CartItem[] {
  return cart.items.map((item) => ({
    id: item.id,
    product_id: item.productId,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      title: item.product.title,
      price: item.price,
      shipping_free: item.product.freeShipping,
      seller_id: item.product.seller.id,
      primary_image: item.product.images?.[0]?.url ?? null,
      seller_name: item.product.seller.name,
    },
  }));
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

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

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.cart) {
        setCartItems([]);
        return;
      }
      setCartItems(mapApiCartToItems(data.cart));
    } catch {
      toast.error("No se pudo cargar el carrito");
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const qpProduct = searchParams.get("product");
  const qpQty = searchParams.get("quantity");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?redirect=/checkout");
      return;
    }
    if (status === "loading") return;

    if (qpProduct && qpQty) {
      const qty = Math.max(1, parseInt(qpQty, 10) || 1);
      let cancelled = false;

      (async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/cart", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: qpProduct, quantity: qty }),
          });
          const errBody = await res.json().catch(() => ({}));
          if (!res.ok) {
            toast.error(errBody.error || "No se pudo agregar el producto");
          }
        } finally {
          if (!cancelled) {
            router.replace("/checkout");
            await fetchCart();
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    fetchCart();
  }, [status, qpProduct, qpQty, router, fetchCart]);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const shipping = cartItems.some((item) => !item.product.shipping_free)
    ? 2500
    : 0;
  const total = subtotal + shipping;

  const sellerIds = new Set(cartItems.map((i) => i.product.seller_id));
  const multiSeller = sellerIds.size > 1;

  const handleSubmitOrder = async () => {
    if (!session?.user || cartItems.length === 0) return;

    setProcessing(true);

    try {
      const res = await fetch("/api/checkout/mp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping: shippingAddress,
          buyer_email: session.user.email ?? undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "No se pudo iniciar el pago");
        return;
      }

      const url = data.init_point || data.sandbox_init_point;
      if (url) {
        window.location.href = url;
        return;
      }

      toast.error("Respuesta de pago incompleta");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al procesar el pedido");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const user = session!.user as { id?: string; email?: string | null };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={user.id ? { id: user.id, email: user.email ?? undefined } : null} />
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
      <Header user={{ id: user.id!, email: user.email ?? undefined }} />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {multiSeller && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Tu carrito tiene productos de más de un vendedor. Para pagar con Mercado Pago solo podés
                incluir un vendedor por compra. Eliminá ítems hasta dejar un solo vendedor o hacé pedidos
                por separado.
              </div>
            )}

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
                        Pago con Mercado Pago
                      </h2>

                      <p className="text-sm text-gray-600 mb-4">
                        Al confirmar serás redirigido a Mercado Pago para abonar con tarjeta, efectivo u otros medios
                        disponibles.
                      </p>

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
                          <p className="font-medium mb-2">Pago</p>
                          <p className="text-sm text-gray-600">Mercado Pago (redirección segura)</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep(2)}>
                          Volver
                        </Button>
                        <Button
                          className="flex-1 bg-[#3483FA]"
                          onClick={handleSubmitOrder}
                          disabled={processing || multiSeller}
                        >
                          {processing ? (
                            <>
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Pagar con Mercado Pago
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

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
      <CheckoutContent />
    </Suspense>
  );
}
