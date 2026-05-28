"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  Package,
  Truck,
  Shield,
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

type GuestCartLine = {
  id: string;
  productId: string;
  quantity: number;
  product: CartItem["product"];
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

export default function CartPage() {
  const { status } = useSession();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const guestMergedRef = useRef(false);

  const loadGuestCart = useCallback(() => {
    const guestCart = localStorage.getItem("guestCart");
    if (guestCart) {
      const parsed = JSON.parse(guestCart) as GuestCartLine[];
      setCartItems(
        parsed.map((line) => ({
          id: line.id,
          product_id: line.productId,
          quantity: line.quantity,
          product: line.product,
        }))
      );
    } else {
      setCartItems([]);
    }
    setLoading(false);
  }, []);

  const fetchCartApi = useCallback(async () => {
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

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      guestMergedRef.current = false;
      loadGuestCart();
      return;
    }

    let cancelled = false;

    (async () => {
      if (!guestMergedRef.current) {
        guestMergedRef.current = true;
        const raw = localStorage.getItem("guestCart");
        if (raw) {
          setLoading(true);
          try {
            const guestItems = JSON.parse(raw) as GuestCartLine[];
            for (const line of guestItems) {
              await fetch("/api/cart", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  productId: line.productId,
                  quantity: line.quantity,
                }),
              });
            }
            localStorage.removeItem("guestCart");
          } catch {
            toast.error("No se pudieron migrar los productos del carrito invitado");
          }
        }
      }

      if (!cancelled) await fetchCartApi();
    })();

    return () => {
      cancelled = true;
    };
  }, [status, fetchCartApi, loadGuestCart]);

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    if (status === "unauthenticated") {
      const updatedItems = cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedItems);
      localStorage.setItem(
        "guestCart",
        JSON.stringify(
          updatedItems.map((i) => ({
            id: i.id,
            productId: i.product_id,
            quantity: i.quantity,
            product: i.product,
          }))
        )
      );
      return;
    }

    const res = await fetch("/api/cart", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity: newQuantity }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Error al actualizar cantidad");
      return;
    }
    fetchCartApi();
  };

  const removeItem = async (itemId: string) => {
    if (status === "unauthenticated") {
      const updatedItems = cartItems.filter((item) => item.id !== itemId);
      setCartItems(updatedItems);
      if (updatedItems.length === 0) {
        localStorage.removeItem("guestCart");
      } else {
        localStorage.setItem(
          "guestCart",
          JSON.stringify(
            updatedItems.map((i) => ({
              id: i.id,
              productId: i.product_id,
              quantity: i.quantity,
              product: i.product,
            }))
          )
        );
      }
      toast.success("Producto eliminado del carrito");
      return;
    }

    const res = await fetch(`/api/cart?itemId=${encodeURIComponent(itemId)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      toast.error("Error al eliminar producto");
      return;
    }
    toast.success("Producto eliminado del carrito");
    fetchCartApi();
  };

  const clearCart = async () => {
    if (status === "unauthenticated") {
      setCartItems([]);
      localStorage.removeItem("guestCart");
      return;
    }

    const res = await fetch("/api/cart?clearAll=true", {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      toast.error("No se pudo vaciar el carrito");
      return;
    }
    fetchCartApi();
  };

  const itemsBySeller = cartItems.reduce(
    (acc, item) => {
      const sellerId = item.product.seller_id;
      if (!acc[sellerId]) {
        acc[sellerId] = {
          sellerName: item.product.seller_name,
          items: [],
        };
      }
      acc[sellerId].items.push(item);
      return acc;
    },
    {} as Record<string, { sellerName: string; items: CartItem[] }>
  );

  const subtotal = cartItems.reduce(
    (acc, item) => acc + Number(item.product.price) * item.quantity,
    0
  );
  const shipping = cartItems.some((item) => !item.product.shipping_free)
    ? 2500
    : 0;
  const total = subtotal + shipping;

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const isLoggedIn = status === "authenticated";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Carrito de compras</h1>

          {cartItems.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {Object.entries(itemsBySeller).map(([sellerId, { sellerName, items }]) => (
                  <Card key={sellerId}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{sellerName}</span>
                      </div>

                      <div className="space-y-4">
                        {items.map((item) => (
                          <div key={item.id} className="flex gap-4">
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {item.product.primary_image ? (
                                <img
                                  src={item.product.primary_image}
                                  alt={item.product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Package className="h-8 w-8" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <Link href={`/product/${item.product.id}`}>
                                <h3 className="font-medium hover:text-[#3483FA]">{item.product.title}</h3>
                              </Link>
                              <p className="text-lg font-semibold mt-1">
                                ${item.product.price.toLocaleString()}
                              </p>
                              {item.product.shipping_free && (
                                <Badge variant="secondary" className="text-green-600">Envío gratis</Badge>
                              )}

                              <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center border rounded-md">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="px-4">{item.quantity}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Eliminar
                                </Button>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="font-semibold">
                                ${(Number(item.product.price) * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button variant="outline" onClick={clearCart}>
                  Vaciar carrito
                </Button>
              </div>

              <div>
                <Card className="sticky top-4">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Resumen de compra</h2>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Productos ({cartItems.length})</span>
                        <span>${subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Envío</span>
                        <span>{shipping === 0 ? "Gratis" : `$${shipping.toLocaleString()}`}</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between text-lg font-semibold mb-6">
                      <span>Total</span>
                      <span>${total.toLocaleString()}</span>
                    </div>

                    <Link href={isLoggedIn ? "/checkout" : "/auth/login?redirect=/checkout"}>
                      <Button className="w-full h-12 bg-[#3483FA] hover:bg-[#2968C8]">
                        Continuar compra
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Shield className="h-4 w-4" />
                        <span>Compra protegida</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Truck className="h-4 w-4" />
                        <span>Envíos a todo el país</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
                <p className="text-gray-500 mb-6">Explora nuestros productos y encuentra lo que buscas</p>
                <Link href="/search">
                  <Button className="bg-[#3483FA]">Explorar productos</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
