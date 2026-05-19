"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
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
  Plus,
  Minus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  ANALYTICS_CURRENCY,
  buildAnalyticsItem,
  trackEvent,
} from "@/lib/analytics";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    stock: number;
    shipping_free: boolean;
    seller_id: string;
    primary_image: string | null;
    seller_name: string;
  };
}

type ShippingAddress = {
  street: string;
  number: string;
  apartment: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  recipient: string;
};

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
      stock: number;
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
      stock: item.product.stock ?? 0,
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
  const [itemUpdatingId, setItemUpdatingId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: "",
    number: "",
    apartment: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    recipient: "",
  });

  /** Cotización servidor (Zipnova o monto legacy); null = aún no cotizado o dirección incompleta. */
  const [shippingQuote, setShippingQuote] = useState<{
    shipping_full: number;
    buyer_shipping_share: number;
    used_zipnova: boolean;
  } | null>(null);
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);
  const [shippingQuoteError, setShippingQuoteError] = useState<string | null>(null);
  const quoteAbortRef = useRef<AbortController | null>(null);
  const beginCheckoutTrackedRef = useRef(false);
  const viewCartTrackedRef = useRef<string | null>(null);

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

  const needsPaidShipping = cartItems.some((item) => !item.product.shipping_free);
  const cartQuoteFingerprint = useMemo(
    () =>
      cartItems
        .map((i) => `${i.id}:${i.quantity}:${i.product.shipping_free ? 1 : 0}`)
        .join("|"),
    [cartItems]
  );

  const addressEnoughForQuote =
    shippingAddress.city.trim().length > 0 &&
    shippingAddress.state.trim().length > 0 &&
    shippingAddress.zip.trim().length > 0 &&
    shippingAddress.street.trim().length > 0 &&
    shippingAddress.number.trim().length > 0;

  useEffect(() => {
    if (status !== "authenticated") return;

    if (!needsPaidShipping) {
      quoteAbortRef.current?.abort();
      setShippingQuote({ shipping_full: 0, buyer_shipping_share: 0, used_zipnova: false });
      setShippingQuoteError(null);
      setShippingQuoteLoading(false);
      return;
    }

    if (!addressEnoughForQuote) {
      quoteAbortRef.current?.abort();
      setShippingQuote(null);
      setShippingQuoteError(null);
      setShippingQuoteLoading(false);
      return;
    }

    const handle = setTimeout(() => {
      const ac = new AbortController();
      quoteAbortRef.current?.abort();
      quoteAbortRef.current = ac;
      setShippingQuoteLoading(true);
      setShippingQuoteError(null);

      void (async () => {
        try {
          const res = await fetch("/api/shipping/zipnova/quote", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            signal: ac.signal,
            body: JSON.stringify({
              shipping: {
                city: shippingAddress.city,
                state: shippingAddress.state,
                zip: shippingAddress.zip,
                street: shippingAddress.street,
                number: shippingAddress.number,
              },
            }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            shipping_full?: number;
            buyer_shipping_share?: number;
            used_zipnova?: boolean;
          };
          if (!res.ok) {
            throw new Error(
              typeof data.error === "string" && data.error.trim()
                ? data.error
                : `Error ${res.status} al cotizar envío`
            );
          }
          if (ac.signal.aborted) return;
          setShippingQuote({
            shipping_full: Number(data.shipping_full ?? 0),
            buyer_shipping_share: Number(data.buyer_shipping_share ?? 0),
            used_zipnova: Boolean(data.used_zipnova),
          });
        } catch (e: unknown) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          if (ac.signal.aborted) return;
          const msg = e instanceof Error ? e.message : "No se pudo cotizar el envío";
          setShippingQuoteError(msg);
          setShippingQuote(null);
        } finally {
          if (!ac.signal.aborted) setShippingQuoteLoading(false);
        }
      })();
    }, 550);

    return () => {
      clearTimeout(handle);
      quoteAbortRef.current?.abort();
    };
  }, [
    status,
    needsPaidShipping,
    addressEnoughForQuote,
    cartQuoteFingerprint,
    shippingAddress.city,
    shippingAddress.state,
    shippingAddress.zip,
    shippingAddress.street,
    shippingAddress.number,
  ]);

  const shippingFull = !needsPaidShipping
    ? 0
    : shippingQuote != null
      ? shippingQuote.shipping_full
      : null;
  /** Coherente con checkout MP (escrow): el comprador abona el 50% del envío (o lo que devuelva la API). */
  const buyerShippingShare =
    shippingFull != null && shippingFull > 0
      ? shippingQuote?.buyer_shipping_share ??
        Math.round((shippingFull / 2) * 100) / 100
      : 0;
  const totalKnown =
    shippingFull != null ? subtotal + (shippingFull > 0 ? buyerShippingShare : 0) : null;
  const quoteUnresolved =
    needsPaidShipping && (shippingQuote === null || shippingQuoteLoading);

  const sellerIds = new Set(cartItems.map((i) => i.product.seller_id));
  const multiSeller = sellerIds.size > 1;

  useEffect(() => {
    if (
      loading ||
      status !== "authenticated" ||
      cartItems.length === 0 ||
      beginCheckoutTrackedRef.current
    ) {
      return;
    }

    beginCheckoutTrackedRef.current = true;
    trackEvent("begin_checkout", {
      currency: ANALYTICS_CURRENCY,
      value: Number(subtotal || 0),
      ecommerce: {
        currency: ANALYTICS_CURRENCY,
        value: Number(subtotal || 0),
        items: cartItems.map((item) =>
          buildAnalyticsItem({
            id: item.product.id,
            name: item.product.title,
            price: item.product.price,
            quantity: item.quantity,
            brand: item.product.seller_name,
          })
        ),
      },
    });
  }, [cartItems, loading, status, subtotal]);

  useEffect(() => {
    if (loading || cartItems.length === 0) return;

    const fingerprint = cartItems
      .map((item) => `${item.product.id}:${item.quantity}`)
      .join("|");

    if (viewCartTrackedRef.current === fingerprint) return;
    viewCartTrackedRef.current = fingerprint;

    trackEvent("view_cart", {
      currency: ANALYTICS_CURRENCY,
      value: Number(subtotal || 0),
      ecommerce: {
        currency: ANALYTICS_CURRENCY,
        value: Number(subtotal || 0),
        items: cartItems.map((item) =>
          buildAnalyticsItem({
            id: item.product.id,
            name: item.product.title,
            price: item.product.price,
            quantity: item.quantity,
            brand: item.product.seller_name,
          })
        ),
      },
    });
  }, [cartItems, loading, subtotal]);

  const shippingDraftKey = `madsjeez_checkout_shipping_${
    session?.user?.email?.toLowerCase() || "anon"
  }`;

  useEffect(() => {
    if (status !== "authenticated") return;
    try {
      const saved = localStorage.getItem(shippingDraftKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<ShippingAddress>;
      setShippingAddress((prev) => ({
        ...prev,
        street: String(parsed.street ?? ""),
        number: String(parsed.number ?? ""),
        apartment: String(parsed.apartment ?? ""),
        city: String(parsed.city ?? ""),
        state: String(parsed.state ?? ""),
        zip: String(parsed.zip ?? ""),
        phone: String(parsed.phone ?? ""),
        recipient: String(parsed.recipient ?? ""),
      }));
    } catch {
      // ignore malformed local draft
    }
  }, [shippingDraftKey, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    try {
      localStorage.setItem(shippingDraftKey, JSON.stringify(shippingAddress));
    } catch {
      // ignore storage quota/availability errors
    }
  }, [shippingAddress, shippingDraftKey, status]);

  const handleSubmitOrder = async () => {
    if (!session?.user || cartItems.length === 0) return;

    setCheckoutError(null);
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

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        details?: unknown;
      };

      if (!res.ok) {
        const base =
          typeof data.error === "string" && data.error.trim()
            ? data.error
            : `Error ${res.status}: no se pudo iniciar el pago`;
        let detail = "";
        if (data.details != null && typeof data.details === "object") {
          try {
            const msg = (data.details as { message?: string }).message;
            if (msg) detail = ` (${msg})`;
            else detail = ` (${JSON.stringify(data.details).slice(0, 280)})`;
          } catch {
            /* ignore */
          }
        }
        const full = `${base}${detail}`;
        setCheckoutError(full);
        toast.error(base, {
          description: data.code ? `${data.code}${detail}` : detail || undefined,
          duration: 14_000,
        });
        console.warn("[checkout/mp]", res.status, data);
        return;
      }

      const url = (data as { init_point?: string; sandbox_init_point?: string }).init_point ||
        (data as { sandbox_init_point?: string }).sandbox_init_point;
      if (url) {
        window.location.href = url as string;
        return;
      }

      const incomplete = "Respuesta de pago incompleta (sin URL de Mercado Pago)";
      setCheckoutError(incomplete);
      toast.error(incomplete, { duration: 12_000 });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al procesar el pedido";
      setCheckoutError(msg);
      toast.error(msg, { duration: 12_000 });
    } finally {
      setProcessing(false);
    }
  };

  const updateCartItemQuantity = async (itemId: string, quantity: number) => {
    setItemUpdatingId(itemId);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "No se pudo actualizar la cantidad");
        return;
      }
      await fetchCart();
    } finally {
      setItemUpdatingId(null);
    }
  };

  const removeCartItem = async (itemId: string) => {
    const item = cartItems.find((entry) => entry.id === itemId);
    setItemUpdatingId(itemId);
    try {
      if (item) {
        trackEvent("remove_from_cart", {
          currency: ANALYTICS_CURRENCY,
          value: Number(item.product.price * item.quantity),
          ecommerce: {
            currency: ANALYTICS_CURRENCY,
            value: Number(item.product.price * item.quantity),
            items: [
              buildAnalyticsItem({
                id: item.product.id,
                name: item.product.title,
                price: item.product.price,
                quantity: item.quantity,
                brand: item.product.seller_name,
              }),
            ],
          },
        });
      }
      const res = await fetch(`/api/cart?itemId=${encodeURIComponent(itemId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "No se pudo eliminar el producto");
        return;
      }
      await fetchCart();
    } finally {
      setItemUpdatingId(null);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
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
              <Button className="bg-primary hover:bg-primary-hover">Explorar productos</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const handleAdvanceToPayment = () => {
    trackEvent("add_shipping_info", {
      currency: ANALYTICS_CURRENCY,
      value: Number(subtotal || 0),
      shipping_tier: shippingQuote?.used_zipnova ? "zipnova" : "standard",
      ecommerce: {
        currency: ANALYTICS_CURRENCY,
        value: Number(subtotal || 0),
        items: cartItems.map((item) =>
          buildAnalyticsItem({
            id: item.product.id,
            name: item.product.title,
            price: item.product.price,
            quantity: item.quantity,
            brand: item.product.seller_name,
          })
        ),
      },
    });
    setStep(2);
  };

  const handleAdvanceToConfirmation = () => {
    trackEvent("add_payment_info", {
      currency: ANALYTICS_CURRENCY,
      value: Number(totalKnown ?? subtotal ?? 0),
      payment_type: "mercado_pago",
      ecommerce: {
        currency: ANALYTICS_CURRENCY,
        value: Number(totalKnown ?? subtotal ?? 0),
        items: cartItems.map((item) =>
          buildAnalyticsItem({
            id: item.product.id,
            name: item.product.title,
            price: item.product.price,
            quantity: item.quantity,
            brand: item.product.seller_name,
          })
        ),
      },
    });
    setStep(3);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={{ id: user.id!, email: user.email ?? undefined }} />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {multiSeller && (
              <div className="mb-6 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
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
                        ? "bg-primary text-white"
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
                          className="w-full mt-6 bg-primary hover:bg-primary-hover"
                          onClick={handleAdvanceToPayment}
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
                        <Button
                          className="flex-1 bg-primary hover:bg-primary-hover"
                          onClick={handleAdvanceToConfirmation}
                        >
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

                      {checkoutError && (
                        <div
                          role="alert"
                          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
                        >
                          <p className="font-semibold mb-1">No se pudo iniciar el pago</p>
                          <p className="leading-snug">{checkoutError}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep(2)}>
                          Volver
                        </Button>
                        <Button
                          className="flex-1 bg-primary hover:bg-primary-hover"
                          onClick={handleSubmitOrder}
                          disabled={
                            processing ||
                            multiSeller ||
                            quoteUnresolved ||
                            Boolean(shippingQuoteError)
                          }
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
                            <div className="mt-1 flex items-center gap-2">
                              <button
                                type="button"
                                className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-40"
                                onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                                disabled={itemUpdatingId === item.id || processing}
                                aria-label="Restar cantidad"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm text-gray-600 min-w-[18px] text-center">{item.quantity}</span>
                              <button
                                type="button"
                                className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-40"
                                onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                disabled={
                                  itemUpdatingId === item.id ||
                                  processing ||
                                  item.quantity >= item.product.stock
                                }
                                aria-label="Sumar cantidad"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                className="ml-2 text-red-600 hover:text-red-700 disabled:opacity-40"
                                onClick={() => removeCartItem(item.id)}
                                disabled={itemUpdatingId === item.id || processing}
                                aria-label="Eliminar producto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {item.quantity >= item.product.stock && (
                              <p className="text-[11px] text-amber-600 mt-1">Llegaste al stock disponible</p>
                            )}
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
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-gray-600 shrink-0">Envío (total logística)</span>
                        <span className="text-right">
                          {!needsPaidShipping && "Gratis"}
                          {needsPaidShipping && !addressEnoughForQuote && (
                            <span className="text-gray-500 text-sm">Completá calle, ciudad, CP…</span>
                          )}
                          {needsPaidShipping && addressEnoughForQuote && shippingQuoteLoading && (
                            <span className="text-gray-500 text-sm inline-flex items-center gap-2">
                              <span className="inline-block h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              Cotizando…
                            </span>
                          )}
                          {needsPaidShipping &&
                            addressEnoughForQuote &&
                            !shippingQuoteLoading &&
                            shippingQuoteError && (
                              <span className="text-red-600 text-sm leading-snug">{shippingQuoteError}</span>
                            )}
                          {needsPaidShipping &&
                            addressEnoughForQuote &&
                            !shippingQuoteLoading &&
                            !shippingQuoteError &&
                            shippingFull === 0 &&
                            "Gratis"}
                          {needsPaidShipping &&
                            addressEnoughForQuote &&
                            !shippingQuoteLoading &&
                            !shippingQuoteError &&
                            shippingFull != null &&
                            shippingFull > 0 && (
                              <span>${shippingFull.toLocaleString("es-AR")}</span>
                            )}
                        </span>
                      </div>
                      {shippingFull != null && shippingFull > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Pagás ahora (parte del envío)</span>
                          <span>${buyerShippingShare.toLocaleString("es-AR")}</span>
                        </div>
                      )}
                      {shippingQuote?.used_zipnova && shippingFull != null && shippingFull > 0 && (
                        <p className="text-[11px] text-gray-500">Cotización en vivo vía Zipnova.</p>
                      )}
                      {!shippingQuote?.used_zipnova &&
                        needsPaidShipping &&
                        shippingFull != null &&
                        shippingFull > 0 &&
                        !shippingQuoteLoading &&
                        !shippingQuoteError && (
                          <p className="text-[11px] text-gray-500">
                            Monto fijo de respaldo: falta Zipnova en el servidor o el vendedor no conectó Zipnova
                            (OAuth) para cotizar por CP/zona.
                          </p>
                        )}
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total a pagar</span>
                      <span>
                        {totalKnown != null
                          ? `$${totalKnown.toLocaleString("es-AR")}`
                          : `$${subtotal.toLocaleString("es-AR")} + envío`}
                      </span>
                    </div>

                    {shippingFull != null && shippingFull > 0 && (
                      <p className="mt-2 text-xs text-gray-500 leading-snug">
                        El otro 50% del envío lo absorbe el vendedor desde su liquidación. Si viniste por un afiliado,
                        su comisión queda retenida en escrow hasta cumplir la política de devoluciones.
                      </p>
                    )}

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
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
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
