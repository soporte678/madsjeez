"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function CartPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      fetchCart(session.user.id);
    } else {
      // Load from localStorage for guests
      loadGuestCart();
    }
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

  const loadGuestCart = () => {
    const guestCart = localStorage.getItem("guestCart");
    if (guestCart) {
      setCartItems(JSON.parse(guestCart));
    }
    setLoading(false);
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    if (user) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId);

      if (error) {
        toast.error("Error al actualizar cantidad");
        return;
      }

      fetchCart(user.id);
    } else {
      // Update localStorage
      const updatedItems = cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedItems);
      localStorage.setItem("guestCart", JSON.stringify(updatedItems));
    }
  };

  const removeItem = async (itemId: string) => {
    if (user) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) {
        toast.error("Error al eliminar producto");
        return;
      }

      fetchCart(user.id);
    } else {
      const updatedItems = cartItems.filter((item) => item.id !== itemId);
      setCartItems(updatedItems);
      localStorage.setItem("guestCart", JSON.stringify(updatedItems));
    }

    toast.success("Producto eliminado del carrito");
  };

  const clearCart = async () => {
    if (user) {
      await supabase.from("cart_items").delete().eq("user_id", user.id);
      fetchCart(user.id);
    } else {
      setCartItems([]);
      localStorage.removeItem("guestCart");
    }
  };

  // Group items by seller
  const itemsBySeller = cartItems.reduce((acc, item) => {
    const sellerId = item.product.seller_id;
    if (!acc[sellerId]) {
      acc[sellerId] = {
        sellerName: item.product.seller_name,
        items: [],
      };
    }
    acc[sellerId].items.push(item);
    return acc;
  }, {} as Record<string, { sellerName: string; items: CartItem[] }>);

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shipping = cartItems.some((item) => !item.product.shipping_free) ? 2500 : 0;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user ? { id: user.id, email: user.email } : null} />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Carrito de compras</h1>

          {cartItems.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Cart Items */}
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
                                ${(item.product.price * item.quantity).toLocaleString()}
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

              {/* Summary */}
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

                    <Link href={user ? "/checkout" : "/auth/login?redirect=/checkout"}>
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
