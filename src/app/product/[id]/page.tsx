import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ReputationBadge } from "@/components/ReputationBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Truck,
  RotateCcw,
  Store,
  MessageCircle,
  Heart,
  Share2,
  Check,
  Package,
  CreditCard,
  Award,
  ThumbsUp,
  Clock,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ImageGallery } from "@/components/product/ImageGallery";
import { AdBanner } from "@/components/product/AdBanner";

// Supabase returns snake_case fields
interface ProductWithDetails {
  id: string;
  title: string;
  description: string | null;
  price: number;
  original_price: number | null;
  stock: number;
  condition: string;
  is_active: boolean;
  shipping_free: boolean;
  shipping_cost: number;
  sold_count: number;
  view_count: number;
  seller_id: string;
  category_id: string | null;
  quality_score: number;
  attributes: Record<string, any> | null;
  video_url: string | null;
  warranty_type: string | null;
  warranty_time: string | null;
  product_images: { id: string; url: string; alt: string | null; order: number; is_primary?: boolean }[];
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null;
  reputation_scores: { color: string } | null;
  categories: { id: string; name: string; slug: string } | null;
  [key: string]: any;
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

async function getSellerStats(sellerId: string) {
  const supabase = await createClient();
  const { count: productCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", sellerId)
    .eq("is_active", true);

  const { data: totalSales } = await supabase
    .from("products")
    .select("sold_count")
    .eq("seller_id", sellerId);

  const sales = totalSales?.reduce((sum: number, p: any) => sum + (p.sold_count || 0), 0) || 0;

  return { productCount: productCount || 0, totalSales: sales };
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

const fmt = (v: number) => `$ ${v.toLocaleString("es-AR")}`;

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const [relatedProducts, sellerProducts, sellerStats] = await Promise.all([
    getRelatedProducts(product.category_id, product.id),
    getSellerProducts(product.seller_id, product.id),
    getSellerStats(product.seller_id),
  ]);

  const primaryImage = product.product_images?.find((img: any) => img.is_primary) || product.product_images?.[0];
  const otherImages = product.product_images?.filter((img: any) => !img.is_primary) || [];
  const allImages = primaryImage ? [primaryImage, ...otherImages] : [];

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  const cuotas6 = Math.ceil(product.price / 6);
  const warranty = product.warranty_type || null;
  const warrantyTime = product.warranty_time || null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

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
            {/* ===== LEFT COLUMN ===== */}
            <div className="lg:col-span-2 space-y-4">
              {/* Image Gallery + Title */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{product.condition === "new" ? "Nuevo" : product.condition === "used" ? "Usado" : "Reacondicionado"}</span>
                      <span>|</span>
                      <span>{product.sold_count || 0} vendidos</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="text-[#3483FA] text-sm hover:underline">Compartir</button>
                    </div>
                  </div>

                  <h1 className="text-2xl font-semibold leading-tight mb-6">{product.title}</h1>

                  <ImageGallery
                    images={allImages}
                    title={product.title}
                    videoUrl={product.video_url || null}
                  />
                </CardContent>
              </Card>

              {/* Description & Attributes */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Descripción</h2>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {product.description || "Este producto no tiene descripción."}
                  </div>
                </CardContent>
              </Card>

              {product.attributes && Object.keys(product.attributes).length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Características del producto</h2>
                    <div className="grid md:grid-cols-2 gap-x-8">
                      {Object.entries(product.attributes).map(([key, value], i) => (
                        <div key={key} className={`flex justify-between py-3 ${i % 2 === 0 ? "bg-gray-50" : ""} px-3 rounded`}>
                          <span className="text-gray-500 text-sm">{key}</span>
                          <span className="font-medium text-sm">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Preguntas y Respuestas */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Preguntas y respuestas</h2>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Escribí tu pregunta..."
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#3483FA] focus:ring-1 focus:ring-[#3483FA]"
                      readOnly
                    />
                    <Link href={`/messages?seller=${product.seller_id}&product=${product.id}`}>
                      <Button className="bg-[#3483FA] hover:bg-[#2968C8] h-12 px-6">
                        Preguntar
                      </Button>
                    </Link>
                  </div>
                  <Link href={`/messages?seller=${product.seller_id}&product=${product.id}`} className="text-[#3483FA] text-sm mt-3 inline-block hover:underline">
                    Ver todas las preguntas
                  </Link>
                </CardContent>
              </Card>

              {/* Productos del vendedor */}
              {sellerProducts.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Productos del vendedor</h2>
                      <Link href={`/seller/${product.seller_id}`} className="text-[#3483FA] text-sm hover:underline flex items-center gap-1">
                        Ver más productos del vendedor <ChevronRight size={14} />
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {sellerProducts.map((item: any) => (
                        <Link key={item.id} href={`/product/${item.id}`}>
                          <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
                            <div className="aspect-square bg-gray-50">
                              {item.primary_image ? (
                                <img src={item.primary_image} alt={item.title} className="w-full h-full object-contain p-2" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <Package className="h-10 w-10" />
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="font-semibold text-lg">{fmt(item.price)}</p>
                              {item.shipping_free && <p className="text-xs text-green-600 font-medium">Envío gratis</p>}
                              <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.title}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ad Banner Horizontal */}
              <AdBanner variant="horizontal" />

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Productos relacionados</h2>
                      <span className="text-[10px] font-bold text-gray-400 tracking-widest">Ad</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {relatedProducts.map((item: any) => (
                        <Link key={item.id} href={`/product/${item.id}`}>
                          <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
                            <div className="aspect-square bg-gray-50">
                              {item.primary_image ? (
                                <img src={item.primary_image} alt={item.title} className="w-full h-full object-contain p-2" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <Package className="h-10 w-10" />
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="font-semibold">{fmt(item.price)}</p>
                              {item.original_price && item.original_price > item.price && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 line-through">{fmt(item.original_price)}</span>
                                  <span className="text-xs text-green-600 font-medium">{Math.round(((item.original_price - item.price) / item.original_price) * 100)}% OFF</span>
                                </div>
                              )}
                              <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.title}</p>
                              {item.shipping_free && <p className="text-xs text-green-600 font-medium mt-1">Envío gratis</p>}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* ===== RIGHT COLUMN ===== */}
            <div className="space-y-4">
              {/* Shipping Banner */}
              {product.shipping_free && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
                  <Truck className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Llega gratis mañana</p>
                    <p className="text-xs text-green-600">Más detalles y formas de entrega</p>
                  </div>
                </div>
              )}

              {/* Price Card */}
              <Card className="sticky top-4">
                <CardContent className="p-6 space-y-4">
                  {/* Price */}
                  <div className="space-y-1">
                    {product.original_price && (
                      <p className="text-sm text-gray-400 line-through">
                        {fmt(product.original_price)}
                      </p>
                    )}
                    <div className="flex items-baseline gap-3">
                      <p className="text-[32px] font-light">{fmt(product.price)}</p>
                      {discount && (
                        <span className="text-lg font-medium text-green-600">{discount}% OFF</span>
                      )}
                    </div>
                    <p className="text-sm text-[#3483FA]">
                      Mismo precio en 6 cuotas de {fmt(cuotas6)}
                    </p>
                    <Link href="#" className="text-xs text-[#3483FA] hover:underline">Ver los medios de pago</Link>
                  </div>

                  {/* Shipping */}
                  <div className="flex items-start gap-3 py-3 border-y">
                    <Truck className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-green-700">
                        {product.shipping_free ? "Envío gratis" : "Envío a calcular"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.shipping_free ? "Llega mañana o pasado" : "Ver opciones de envío"}
                      </p>
                    </div>
                  </div>

                  {/* Return */}
                  <div className="flex items-start gap-3">
                    <RotateCcw className="h-5 w-5 text-[#3483FA] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm"><span className="text-[#3483FA]">Devolución gratis</span> Tenés 30 días desde que lo recibís.</p>
                    </div>
                  </div>

                  {/* Protection */}
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-[#3483FA] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm"><span className="text-[#3483FA]">Compra Protegida.</span> Recibí el producto que esperabas o te devolvemos tu dinero.</p>
                    </div>
                  </div>

                  {/* Warranty */}
                  {warranty && warranty !== "none" && (
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-gray-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-600">
                        {warrantyTime || "30 días"} de garantía de {warranty === "factory" ? "fábrica" : "vendedor"}.
                      </p>
                    </div>
                  )}

                  {/* Stock */}
                  <div>
                    <p className="text-sm font-medium">Stock disponible</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">Cantidad: <strong>1 unidad</strong></span>
                      <span className="text-xs text-gray-400">({product.stock} disponibles)</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <Link href={`/checkout?product=${product.id}`}>
                      <Button className="w-full bg-[#3483FA] hover:bg-[#2968C8] h-12 text-lg font-medium rounded-md">
                        Comprar ahora
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full h-12 text-lg text-[#3483FA] border-[#3483FA] hover:bg-blue-50 rounded-md">
                      Agregar al carrito
                    </Button>
                  </div>

                  {/* Seller Info */}
                  <Separator />
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Vendido por</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#3483FA] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {(product.profiles?.full_name || "V")[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <Link href={`/seller/${product.seller_id}`} className="font-medium text-sm text-[#3483FA] hover:underline">
                          {product.profiles?.full_name || "Vendedor"}
                        </Link>
                        {product.reputation_scores && (
                          <ReputationBadge color={product.reputation_scores.color} />
                        )}
                      </div>
                    </div>

                    {/* Seller Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-3 bg-gray-50 rounded-lg p-3">
                      <div className="text-center">
                        <p className="text-sm font-bold">{sellerStats.totalSales}+</p>
                        <p className="text-[10px] text-gray-500">Ventas</p>
                      </div>
                      <div className="text-center border-x border-gray-200">
                        <ThumbsUp className="h-4 w-4 mx-auto text-green-600" />
                        <p className="text-[10px] text-gray-500">Buena atención</p>
                      </div>
                      <div className="text-center">
                        <Clock className="h-4 w-4 mx-auto text-green-600" />
                        <p className="text-[10px] text-gray-500">Entrega a tiempo</p>
                      </div>
                    </div>

                    <Link href={`/seller/${product.seller_id}`}>
                      <Button variant="outline" className="w-full mt-3 text-[#3483FA] border-[#3483FA] hover:bg-blue-50 text-sm">
                        Ver más productos del vendedor
                      </Button>
                    </Link>
                  </div>

                  {/* Wish / Share */}
                  <div className="flex gap-2 pt-1">
                    <Button variant="ghost" size="sm" className="flex-1 text-[#3483FA]">
                      <Heart className="h-4 w-4 mr-1" />
                      Agregar a lista
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 text-[#3483FA]">
                      <Share2 className="h-4 w-4 mr-1" />
                      Compartir
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardContent className="p-5">
                  <p className="font-semibold mb-4">Medios de pago</p>

                  <div className="bg-green-50 rounded-lg p-3 mb-4 flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-green-800 font-medium">¡Pagá el mismo precio en hasta 6 cuotas!</p>
                  </div>

                  <p className="text-xs text-gray-500 font-medium mb-2">Cuotas sin Tarjeta</p>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-100 text-[#3483FA] px-3 py-1 rounded text-xs font-bold">Madsjeez Pago</div>
                  </div>

                  <p className="text-xs text-gray-500 font-medium mb-2">Tarjetas de crédito</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="bg-[#1a1f71] text-white px-3 py-1 rounded text-xs font-bold">VISA</div>
                    <div className="bg-[#ff5f00] text-white px-3 py-1 rounded text-xs font-bold">MC</div>
                    <div className="bg-[#006fcf] text-white px-3 py-1 rounded text-xs font-bold">AMEX</div>
                    <div className="bg-[#f26122] text-white px-3 py-1 rounded text-xs font-bold">NaranjaX</div>
                  </div>

                  <p className="text-xs text-gray-500 font-medium mb-2">Tarjetas de débito</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="bg-[#1a1f71] text-white px-3 py-1 rounded text-xs font-bold">VISA Débito</div>
                    <div className="bg-[#ff5f00] text-white px-3 py-1 rounded text-xs font-bold">MC Débito</div>
                    <div className="bg-[#0072ce] text-white px-3 py-1 rounded text-xs font-bold">Cabal</div>
                  </div>

                  <p className="text-xs text-gray-500 font-medium mb-2">Efectivo</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <div className="bg-[#00b9f1] text-white px-3 py-1 rounded text-xs font-bold">Rapipago</div>
                    <div className="bg-[#009ee3] text-white px-3 py-1 rounded text-xs font-bold">PagoFácil</div>
                  </div>

                  <Link href="#" className="text-[#3483FA] text-sm hover:underline">
                    Conocé otros medios de pago
                  </Link>
                </CardContent>
              </Card>

              {/* Sidebar Ad */}
              <AdBanner variant="sidebar" />

              {/* Related in sidebar */}
              {relatedProducts.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <p className="font-semibold mb-3">Productos relacionados</p>
                    <div className="space-y-3">
                      {relatedProducts.slice(0, 4).map((item: any) => (
                        <Link key={item.id} href={`/product/${item.id}`} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                          <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                            {item.primary_image ? (
                              <img src={item.primary_image} alt={item.title} className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Package className="h-6 w-6 text-gray-300" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 line-clamp-2">{item.title}</p>
                            <p className="text-sm font-semibold">{fmt(item.price)}</p>
                            {item.shipping_free && <p className="text-xs text-green-600">Envío gratis</p>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
