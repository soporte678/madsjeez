"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Search,
  Package,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface FavoriteItem {
  id: string;
  product_id: string;
  created_at: string;
  product: {
    id: string;
    title: string;
    price: number;
    original_price: number | null;
    condition: string;
    shipping_free: boolean;
    stock: number;
    primary_image: string | null;
    seller_name: string;
    seller_reputation: string | null;
  };
}

function FavoritesContent() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth/login?redirect=/favorites");
      return;
    }
    setUser(session.user);
    fetchFavorites(session.user.id);
  };

  const fetchFavorites = async (userId: string) => {
    const supabase = createClient();
    setLoading(true);
    const { data } = await supabase
      .from("favorites")
      .select(`
        *,
        product:products(
          id, title, price, original_price, condition, shipping_free, stock,
          product_images(url, is_primary),
          seller:profiles(full_name),
          reputation_scores:seller_id(color)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      const mappedItems = data.map((item: any) => ({
        ...item,
        product: {
          ...item.product,
          primary_image: item.product?.product_images?.[0]?.url,
          seller_name: item.product?.seller?.full_name,
          seller_reputation: item.product?.reputation_scores?.color,
        },
      }));
      setFavorites(mappedItems);
    }
    setLoading(false);
  };

  const removeFromFavorites = async (favoriteId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", favoriteId);

    if (error) {
      toast.error("Error al eliminar de favoritos");
    } else {
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      toast.success("Eliminado de favoritos");
    }
  };

  const addToCart = async (productId: string) => {
    if (!user) {
      router.push("/auth/login?redirect=/favorites");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("cart_items").insert({
      user_id: user.id,
      product_id: productId,
      quantity: 1,
    });

    if (error) {
      if (error.code === "23505") {
        toast.info("Este producto ya está en tu carrito");
      } else {
        toast.error("Error al agregar al carrito");
      }
    } else {
      toast.success("Agregado al carrito");
    }
  };

  const filteredFavorites = favorites.filter((item) =>
    item.product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = favorites.reduce(
    (acc, item) => acc + item.product.price,
    0
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Heart className="h-6 w-6 text-red-500" />
                  Mis Favoritos
                </h1>
                <p className="text-gray-600">
                  {favorites.length} productos guardados
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/cart">
                  <Button variant="outline">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Ver carrito
                  </Button>
                </Link>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar en favoritos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="text-center py-12">Cargando...</div>
            ) : filteredFavorites.length > 0 ? (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Products List */}
                <div className="lg:col-span-2 space-y-4">
                  {filteredFavorites.map((item) => {
                    const discount = item.product.original_price
                      ? Math.round(
                          ((item.product.original_price - item.product.price) /
                            item.product.original_price) *
                            100
                        )
                      : null;

                    return (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {/* Image */}
                            <Link href={`/product/${item.product.id}`}>
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
                            </Link>

                            {/* Info */}
                            <div className="flex-1">
                              <Link href={`/product/${item.product.id}`}>
                                <h3 className="font-medium hover:text-[#3483FA] line-clamp-2">
                                  {item.product.title}
                                </h3>
                              </Link>

                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary">
                                  {item.product.condition === "new"
                                    ? "Nuevo"
                                    : item.product.condition === "used"
                                    ? "Usado"
                                    : "Reacondicionado"}
                                </Badge>
                                {item.product.shipping_free && (
                                  <Badge className="bg-green-100 text-green-800">
                                    Envío gratis
                                  </Badge>
                                )}
                              </div>

                              <p className="text-sm text-gray-500 mt-1">
                                Vendedor: {item.product.seller_name}
                              </p>

                              <div className="flex items-center gap-2 mt-2">
                                <p className="text-lg font-semibold">
                                  ${item.product.price.toLocaleString()}
                                </p>
                                {item.product.original_price && (
                                  <p className="text-sm text-gray-500 line-through">
                                    ${item.product.original_price.toLocaleString()}
                                  </p>
                                )}
                                {discount && (
                                  <Badge className="bg-green-100 text-green-800">
                                    {discount}% OFF
                                  </Badge>
                                )}
                              </div>

                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  className="bg-[#3483FA]"
                                  onClick={() => addToCart(item.product.id)}
                                  disabled={item.product.stock === 0}
                                >
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Agregar al carrito
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFromFavorites(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Summary */}
                <div>
                  <Card className="sticky top-4">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Resumen</h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Productos</span>
                          <span>{favorites.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Valor total</span>
                          <span className="font-semibold">
                            ${totalValue.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <Link href="/search">
                        <Button variant="outline" className="w-full">
                          Seguir comprando
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">
                    No tienes favoritos
                  </h2>
                  <p className="text-gray-500 mb-6">
                    Guarda los productos que te interesen para verlos después
                  </p>
                  <Link href="/search">
                    <Button className="bg-[#3483FA]">
                      Explorar productos
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-1 bg-[#EBEBEB] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-[#3483FA] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Cargando...</p>
            </div>
          </div>
        </div>
      }
    >
      <FavoritesContent />
    </Suspense>
  );
}
