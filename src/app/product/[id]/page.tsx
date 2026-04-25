import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { ReputationBadge } from "@/components/ReputationBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Truck,
  RotateCcw,
  Store,
  MessageCircle,
  Heart,
  Share2,
  MapPin,
  Check,
  Star,
  Package,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductImage, Profile, ReputationScore, Category } from "@/types";

interface ProductWithDetails extends Product {
  product_images: ProductImage[];
  profiles: Profile;
  reputation_scores: ReputationScore | null;
  categories: Category | null;
}

async function getProduct(id: string): Promise<ProductWithDetails | null> {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(`
      *,
      product_images(*),
      profiles:seller_id(*),
      reputation_scores:seller_id(*),
      categories:category_id(*)
    `)
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!product) return null;

  // Increment view count
  await supabase
    .from("products")
    .update({ view_count: (product.view_count || 0) + 1 })
    .eq("id", id);

  return product as ProductWithDetails;
}

async function getRelatedProducts(categoryId: string | null, currentProductId: string) {
  if (!categoryId) return [];

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      product_images(url, is_primary),
      profiles:seller_id(full_name),
      reputation_scores:seller_id(color)
    `)
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .neq("id", currentProductId)
    .limit(6);

  return products?.map((product: any) => ({
    ...product,
    primary_image: product.product_images?.find((img: { is_primary: boolean }) => img.is_primary)?.url ||
                   product.product_images?.[0]?.url,
    seller_name: product.profiles?.full_name,
    seller_reputation: product.reputation_scores?.color,
  })) || [];
}

async function getSellerProducts(sellerId: string, currentProductId: string) {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      product_images(url, is_primary),
      reputation_scores:seller_id(color)
    `)
    .eq("seller_id", sellerId)
    .eq("is_active", true)
    .neq("id", currentProductId)
    .limit(4);

  return products?.map((product: any) => ({
    ...product,
    primary_image: product.product_images?.find((img: { is_primary: boolean }) => img.is_primary)?.url ||
                   product.product_images?.[0]?.url,
    seller_reputation: product.reputation_scores?.color,
  })) || [];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Producto no encontrado | MADSJEEZ",
    };
  }

  return {
    title: `${product.title} | MADSJEEZ`,
    description: product.description?.slice(0, 160) || "Compra este producto en MADSJEEZ",
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const [relatedProducts, sellerProducts] = await Promise.all([
    getRelatedProducts(product.category_id, product.id),
    getSellerProducts(product.seller_id, product.id),
  ]);

  const primaryImage = product.product_images?.find((img) => img.is_primary) || product.product_images?.[0];
  const otherImages = product.product_images?.filter((img) => !img.is_primary) || [];
  const allImages = primaryImage ? [primaryImage, ...otherImages] : [];

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={null} />

      <main className="flex-1 bg-[#EBEBEB]">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-[#3483FA]">Inicio</Link>
              <span>/</span>
              {product.categories && (
                <>
                  <Link href={`/category/${product.categories.slug}`} className="hover:text-[#3483FA]">
                    {product.categories.name}
                  </Link>
                  <span>/</span>
                </>
              )}
              <span className="text-gray-700 truncate max-w-xs">{product.title}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Images */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-5 gap-4">
                    {/* Thumbnails */}
                    <div className="md:col-span-1 flex md:flex-col gap-2 order-2 md:order-1">
                      {allImages.slice(0, 5).map((image, index) => (
                        <div
                          key={image.id}
                          className={`w-16 h-16 border-2 rounded-lg overflow-hidden cursor-pointer ${
                            index === 0 ? "border-[#3483FA]" : "border-gray-200"
                          }`}
                        >
                          <img
                            src={image.url}
                            alt={image.alt || `${product.title} - ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Main Image */}
                    <div className="md:col-span-4 order-1 md:order-2">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={primaryImage.alt || product.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="h-24 w-24" />
                          </div>
                        )}
                        {discount && (
                          <Badge className="absolute top-4 left-4 bg-green-500 text-white">
                            {discount}% OFF
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Description */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Descripción</h2>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                    {product.description || "Este producto no tiene descripción."}
                  </div>

                  {product.attributes && Object.keys(product.attributes).length > 0 && (
                    <>
                      <Separator className="my-6" />
                      <h3 className="font-semibold mb-4">Características</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {Object.entries(product.attributes).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">{key}</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Seller Other Products */}
              {sellerProducts.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Más del vendedor</h2>
                      <Link href={`/seller/${product.seller_id}`}>
                        <Button variant="ghost" className="text-[#3483FA]">
                          Ver todos
                        </Button>
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {sellerProducts.map((item: any) => (
                        <Link key={item.id} href={`/product/${item.id}`}>
                          <Card className="hover:shadow-md transition-shadow">
                            <div className="aspect-square bg-gray-100">
                              {item.primary_image ? (
                                <img
                                  src={item.primary_image}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Package className="h-12 w-12" />
                                </div>
                              )}
                            </div>
                            <CardContent className="p-3">
                              <p className="font-semibold text-lg">${item.price.toLocaleString()}</p>
                              <p className="text-sm text-gray-600 line-clamp-2">{item.title}</p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Productos similares</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {relatedProducts.map((item: any) => (
                        <Link key={item.id} href={`/product/${item.id}`}>
                          <Card className="hover:shadow-md transition-shadow">
                            <div className="aspect-square bg-gray-100">
                              {item.primary_image ? (
                                <img
                                  src={item.primary_image}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Package className="h-12 w-12" />
                                </div>
                              )}
                            </div>
                            <CardContent className="p-3">
                              <p className="font-semibold text-lg">${item.price.toLocaleString()}</p>
                              <p className="text-sm text-gray-600 line-clamp-2">{item.title}</p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Purchase Info */}
            <div className="space-y-4">
              {/* Price Card */}
              <Card className="sticky top-4">
                <CardContent className="p-6 space-y-4">
                  {/* Condition */}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {product.condition === "new" ? "Nuevo" :
                       product.condition === "used" ? "Usado" :
                       product.condition === "refurbished" ? "Reacondicionado" : "Nuevo"}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {product.sold_count} vendidos
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-xl font-semibold leading-tight">{product.title}</h1>

                  {/* Price */}
                  <div className="space-y-1">
                    {product.original_price && (
                      <p className="text-sm text-gray-500 line-through">
                        ${product.original_price.toLocaleString()}
                      </p>
                    )}
                    <p className="text-3xl font-bold">${product.price.toLocaleString()}</p>
                    {discount && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        {discount}% OFF
                      </Badge>
                    )}
                  </div>

                  {/* Shipping */}
                  <div className="flex items-start gap-3 py-3 border-y">
                    <Truck className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-700">
                        {product.shipping_free ? "Envío gratis" : "Envío a calcular"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.shipping_free
                          ? "Llega mañana o pasado"
                          : "Ver opciones de envío"}
                      </p>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-700">Stock disponible</span>
                    <span className="text-gray-500">({product.stock} unidades)</span>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <Link href={`/checkout?product=${product.id}`}>
                      <Button className="w-full bg-[#3483FA] hover:bg-[#2968C8] h-12 text-lg">
                        Comprar ahora
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full h-12 text-lg">
                      Agregar al carrito
                    </Button>
                  </div>

                  {/* Seller Info */}
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <Store className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{product.profiles?.full_name || "Vendedor"}</p>
                        {product.reputation_scores && (
                          <ReputationBadge color={product.reputation_scores.color} />
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/messages?seller=${product.seller_id}&product=${product.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Preguntar
                        </Button>
                      </Link>
                      <Link href={`/seller/${product.seller_id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Store className="h-4 w-4 mr-2" />
                          Ver tienda
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Protection */}
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-[#3483FA]" />
                      <span className="font-medium text-sm">Compra Protegida</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Recibí el producto que esperabas o te devolvemos tu dinero.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Heart className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartir
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardContent className="p-4">
                  <p className="font-medium mb-3">Medios de pago</p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Tarjetas de crédito</p>
                    <p>Tarjetas de débito</p>
                    <p>Efectivo en puntos de pago</p>
                    <p>Transferencia bancaria</p>
                  </div>
                  <Link href="/payment-methods">
                    <Button variant="link" className="p-0 h-auto text-[#3483FA] text-sm">
                      Conocer otros medios de pago
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Return Policy */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <RotateCcw className="h-5 w-5 text-[#3483FA] mt-0.5" />
                    <div>
                      <p className="font-medium">Devolución gratis</p>
                      <p className="text-sm text-gray-600">
                        Tenés 10 días desde que lo recibís.
                      </p>
                      <Link href="/help/returns">
                        <Button variant="link" className="p-0 h-auto text-[#3483FA] text-sm">
                          Conocer más
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
