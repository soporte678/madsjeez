import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ChevronRight,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  Undo,
  Award,
  Share2,
  ChevronDown,
  MapPin,
  CreditCard,
  MessageCircle,
  Clock,
  Package,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";

async function getProduct(id: string) {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      product_images(*),
      seller:seller_id(*),
      categories:category_id(id, name, slug)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("getProduct error:", error.message, error.details);
  }
  if (!product) return null;

  // Increment view count
  await supabase
    .from("products")
    .update({ views: (product.views || 0) + 1 })
    .eq("id", id);

  return product;
}

async function getRelatedProducts(categoryId: string | null, currentProductId: string) {
  if (!categoryId) return [];

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      product_images(url, is_primary),
      seller:seller_id(*)
    `)
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .neq("id", currentProductId)
    .limit(6);

  return products?.map((p: any) => ({
    ...p,
    primary_image: p.product_images?.find((img: any) => img.is_primary)?.url || p.product_images?.[0]?.url,
  })) || [];
}

async function getSellerProducts(sellerId: string, currentProductId: string) {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      product_images(url, is_primary)
    `)
    .eq("seller_id", sellerId)
    .eq("is_active", true)
    .neq("id", currentProductId)
    .limit(5);

  return products?.map((p: any) => ({
    ...p,
    primary_image: p.product_images?.find((img: any) => img.is_primary)?.url || p.product_images?.[0]?.url,
  })) || [];
}

async function getProductReviews(productId: string) {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      comment,
      created_at,
      reviewer_id
    `)
    .eq("product_id", productId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(20);

  return reviews || [];
}

async function getTopRatedProducts(categoryId: string | null, currentProductId: string) {
  if (!categoryId) return [];

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      product_images(url, is_primary)
    `)
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .neq("id", currentProductId)
    .order("sales", { ascending: false })
    .limit(6);

  return products?.map((p: any) => ({
    ...p,
    primary_image: p.product_images?.find((img: any) => img.is_primary)?.url || p.product_images?.[0]?.url,
  })) || [];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: "Producto no encontrado | MADSJEEZ" };
  }

  return {
    title: `${product.title} | MADSJEEZ`,
    description: product.description?.slice(0, 160) || "Compra este producto en MADSJEEZ",
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const [relatedProducts, sellerProducts, productReviews, topRatedProducts] = await Promise.all([
    getRelatedProducts(product.category_id, product.id),
    getSellerProducts(product.seller_id, product.id),
    getProductReviews(product.id),
    getTopRatedProducts(product.category_id, product.id),
  ]);

  const totalReviews = productReviews.length;
  const avgRating = totalReviews > 0
    ? productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
    : 0;
  const ratingCounts = [0, 0, 0, 0, 0];
  productReviews.forEach((r: any) => { if (r.rating >= 1 && r.rating <= 5) ratingCounts[r.rating - 1]++; });
  const ratingPercents = ratingCounts.map((c) => totalReviews > 0 ? Math.round((c / totalReviews) * 100) : 0);

  const seller = product.seller as any;
  const sellerName = seller?.sellerName || seller?.name || "Vendedor";
  const sellerTotalSales = seller?.total_sales || 0;
  const sellerRepLevel = seller?.reputation_level || "VENDEDOR NUEVO";
  const sellerRepColor = seller?.reputation_color || "VERDE";
  const sellerProductCount = sellerProducts.length;
  const isNewSeller = sellerTotalSales === 0;
  const conditionLabel = product.condition === "new" ? "Nuevo" : product.condition === "used" ? "Usado" : "Reacondicionado";
  const salesCount = product.sales || 0;
  const cuotas6 = Math.ceil(product.price / 6);
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  const images = product.product_images?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((img: any) => img.url) || [];

  const categoryName = product.categories?.name || "Productos";
  const categorySlug = product.categories?.slug || "";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="min-h-screen bg-[#ededed] font-sans text-[#333] pb-20">
        {/* Top Banner */}
        <div className="bg-white border-b border-gray-200 py-3 px-4 text-sm justify-center hidden md:flex">
          <span className="text-gray-600">También puede interesarte: </span>
          <Link href={`/category/${categorySlug}`} className="font-semibold text-gray-800 ml-1 hover:text-blue-600 transition-colors">
            {categoryName}
          </Link>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 pt-4">
          {/* Breadcrumbs */}
          <div className="flex justify-between items-center text-[13px] mb-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Link href="/" className="hover:underline">Inicio</Link>
              <ChevronRight size={12} className="text-gray-400" />
              {product.categories && (
                <>
                  <Link href={`/category/${product.categories.slug}`} className="hover:underline">
                    {product.categories.name}
                  </Link>
                  <ChevronRight size={12} className="text-gray-400" />
                </>
              )}
              <span className="text-gray-500 font-medium truncate max-w-[200px]">{product.title}</span>
            </div>
            <div className="flex items-center gap-4 text-[13px] text-blue-600">
              <Link href={`/seller/${product.seller_id}`} className="hover:underline">Vender uno igual</Link>
              <button className="hover:underline flex items-center gap-1"><Share2 size={14}/> Compartir</button>
            </div>
          </div>

          {/* MAIN CONTAINER */}
          <div className="bg-white rounded-lg shadow-sm flex flex-col lg:flex-row p-0 lg:p-4 gap-6">

            {/* LEFT COLUMN */}
            <div className="flex-[2] flex flex-col min-w-0">

              {/* Gallery + Title Section */}
              <div className="flex flex-col md:flex-row gap-6 p-4 lg:p-0">
                {/* Image Gallery - Client Component */}
                <ProductDetailClient images={images} title={product.title} />

                {/* Product Info */}
                <div className="flex-1 flex flex-col pt-2 md:pt-0">
                  <span className="text-[13px] text-gray-500 mb-1">{conditionLabel}  |  +{salesCount} vendidos</span>
                  <h1 className="text-[22px] font-normal text-gray-800 leading-tight mb-2 pr-8">{product.title}</h1>

                  <div className="flex flex-col mb-4">
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-[15px] text-gray-400 line-through">$ {product.original_price.toLocaleString("es-AR")}</span>
                    )}
                    <span className="text-[36px] font-light text-gray-800 leading-none">$ {product.price.toLocaleString("es-AR")}</span>
                    {discount && <span className="text-[15px] font-medium text-emerald-500 mt-1">{discount}% OFF</span>}
                    <span className="text-[15px] font-medium text-emerald-500 mt-1">Mismo precio en 6 cuotas de $ {cuotas6.toLocaleString("es-AR")}</span>
                    <Link href="#" className="text-[13px] text-blue-500 hover:underline mt-1">Ver los medios de pago</Link>
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-gray-200 my-8 hidden md:block"></div>

              {/* Description */}
              {product.description && (
                <>
                  <div className="px-4 lg:px-0">
                    <h2 className="text-[24px] font-semibold text-gray-800 mb-6">Descripción</h2>
                    <div className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {product.description}
                    </div>
                  </div>
                  <div className="w-full h-px bg-gray-200 my-8 hidden md:block"></div>
                </>
              )}

              {/* Related Products Carousel */}
              {relatedProducts.length > 0 && (
                <>
                  <div className="px-4 lg:px-0">
                    <h2 className="text-[20px] font-normal text-gray-800 mb-5">Relacionado con esta publicación</h2>
                    <div className="relative group bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex gap-0 overflow-x-auto scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                        {relatedProducts.map((item: any) => (
                          <Link key={item.id} href={`/product/${item.id}`} className="min-w-[160px] max-w-[160px] px-3 py-2 cursor-pointer flex flex-col hover:opacity-80 transition-opacity border-r border-gray-100 last:border-r-0">
                            <div className="h-[140px] mb-3 flex items-center justify-center">
                              {item.primary_image ? (
                                <img src={item.primary_image} alt={item.title} className="max-h-full max-w-full object-contain" />
                              ) : (
                                <Package className="h-16 w-16 text-gray-300" />
                              )}
                            </div>
                            <h4 className="text-[13px] text-[#3483fa] leading-snug mb-2 line-clamp-2 min-h-[36px]">{item.title}</h4>
                            <div className="mt-auto">
                              <span className="text-[18px] font-normal text-gray-800">$ {item.price.toLocaleString("es-AR")}</span>
                              <span className="text-[12px] text-emerald-500 block mt-1">Llega mañana</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                      {/* Right arrow */}
                      <button className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:shadow-lg">
                        <ChevronRight size={20} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-px bg-gray-200 my-8 hidden md:block"></div>
                </>
              )}

              {/* Questions */}
              <div className="px-4 lg:px-0 mb-10">
                <h2 className="text-[24px] font-semibold text-gray-800 mb-6">Preguntas y respuestas</h2>
                <div className="flex gap-4 mb-8">
                  <input
                    type="text"
                    placeholder="Escribí tu pregunta..."
                    className="flex-1 py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                    readOnly
                  />
                  <Link href={`/messages?seller=${product.seller_id}&product=${product.id}`} className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                    Preguntar
                  </Link>
                </div>
                <Link href={`/messages?seller=${product.seller_id}&product=${product.id}`} className="text-blue-500 font-semibold text-[14px] hover:underline">
                  Ver todas las preguntas
                </Link>
              </div>

              <div className="w-full h-px bg-gray-200 my-8 hidden md:block"></div>

              {/* OPINIONES Y CALIFICACIONES */}
              <div className="px-4 lg:px-0 mb-10">
                <h2 className="text-[24px] font-semibold text-gray-800 mb-6">Opiniones del producto</h2>
                <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-12">
                  {/* Rating General */}
                  <div className="flex flex-col w-full md:w-64 shrink-0">
                    <div className="flex items-end gap-3 mb-3">
                      <span className="text-[54px] font-semibold leading-none text-blue-900 tracking-tight">
                        {totalReviews > 0 ? avgRating.toFixed(1) : '—'}
                      </span>
                      <div className="flex flex-col mb-1.5">
                        <div className="flex text-blue-600 mb-1">
                          {[1, 2, 3, 4, 5].map((s) => {
                            const filled = avgRating >= s;
                            const partial = !filled && avgRating > s - 1;
                            return (
                              <div key={s} className="relative">
                                <Star size={16} className="text-blue-200" fill="currentColor" />
                                {filled && (
                                  <div className="absolute top-0 left-0 overflow-hidden w-full">
                                    <Star size={16} className="text-blue-600" fill="currentColor" />
                                  </div>
                                )}
                                {partial && (
                                  <div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${((avgRating - (s - 1)) * 100)}%` }}>
                                    <Star size={16} className="text-blue-600" fill="currentColor" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <span className="text-[12px] text-gray-500 font-medium">{totalReviews} calificaciones</span>
                      </div>
                    </div>

                    {/* Barras de progreso */}
                    <div className="flex flex-col gap-1.5 mt-2">
                      {[5, 4, 3, 2, 1].map((s) => (
                        <div key={s} className="flex items-center gap-3 text-[13px] text-gray-500">
                          <span className="w-2 text-right">{s}</span>
                          <Star size={12} fill="currentColor" className="text-gray-400" />
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${ratingPercents[s - 1]}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Opiniones con comentarios */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 mb-5 text-[15px]">Opiniones destacadas</h3>
                    {totalReviews === 0 ? (
                      <p className="text-gray-400 text-[14px]">Este producto aún no tiene opiniones. ¡Sé el primero en opinar!</p>
                    ) : (
                      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                        {productReviews.slice(0, 5).map((review: any) => (
                          <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex text-blue-600">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} size={12} fill="currentColor" className={s <= review.rating ? "text-blue-600" : "text-gray-200"} />
                                ))}
                              </div>
                              <span className="text-[11px] text-gray-400">
                                {new Date(review.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-[13px] text-gray-600 leading-relaxed">{review.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-gray-200 my-8 hidden md:block"></div>

              {/* CON 4 ESTRELLAS O MÁS */}
              {topRatedProducts.length > 0 && (
                <>
                  <div className="px-4 lg:px-0">
                    <div className="bg-white p-6 rounded-lg border border-gray-200 relative group">
                      <h2 className="text-[22px] font-semibold text-gray-800 mb-6">Con 4 estrellas o más</h2>
                      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
                        {topRatedProducts.map((item: any) => (
                          <Link key={item.id} href={`/product/${item.id}`} className="min-w-[200px] max-w-[200px] border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col bg-white">
                            <div className="h-32 mb-4 flex items-center justify-center">
                              {item.primary_image ? (
                                <img src={item.primary_image} alt={item.title} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                              ) : (
                                <Package className="h-12 w-12 text-gray-300" />
                              )}
                            </div>
                            <h4 className="text-[13px] text-gray-700 leading-snug mb-3 line-clamp-2 min-h-[36px] font-medium">{item.title}</h4>
                            <div className="mt-auto flex flex-col gap-1">
                              <span className="text-[18px] font-medium text-gray-800">$ {item.price.toLocaleString("es-AR")}</span>
                              <span className="text-[12px] text-emerald-500 font-medium">Llega mañana</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <button className="absolute -right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-50">
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-px bg-gray-200 my-8 hidden md:block"></div>
                </>
              )}

              {/* FOOTER - CATEGORÍAS DESTACADAS */}
              <div className="px-4 lg:px-0 mb-10">
                <div className="bg-white p-8 rounded-lg border border-gray-200">
                  <h3 className="text-[18px] font-semibold text-gray-800 mb-6">Destacado en {categoryName}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 text-[13px] text-gray-500">
                    <div className="flex flex-col gap-3">
                      <h4 className="font-bold text-gray-800 mb-1">Más vendidos</h4>
                      <Link href={`/category/${categorySlug}?sort=sales`} className="hover:text-blue-600 transition-colors">Los más vendidos de la categoría</Link>
                      <Link href={`/category/${categorySlug}?sort=price_asc`} className="hover:text-blue-600 transition-colors">Precios más bajos</Link>
                      <Link href={`/category/${categorySlug}?sort=newest`} className="hover:text-blue-600 transition-colors">Recién llegados</Link>
                      <Link href={`/category/${categorySlug}`} className="text-blue-500 hover:underline flex items-center gap-1 mt-1 font-medium">Ver todo <ChevronDown size={14}/></Link>
                    </div>
                    <div className="flex flex-col gap-3">
                      <h4 className="font-bold text-gray-800 mb-1">Mejores opiniones</h4>
                      <Link href={`/category/${categorySlug}?sort=rating`} className="hover:text-blue-600 transition-colors">Mejor calificados</Link>
                      <Link href={`/category/${categorySlug}?filter=free_shipping`} className="hover:text-blue-600 transition-colors">Con envío gratis</Link>
                      <Link href={`/category/${categorySlug}?filter=discount`} className="hover:text-blue-600 transition-colors">En oferta</Link>
                      <Link href={`/category/${categorySlug}`} className="text-blue-500 hover:underline flex items-center gap-1 mt-1 font-medium">Ver todo <ChevronDown size={14}/></Link>
                    </div>
                    <div className="flex flex-col gap-3">
                      <h4 className="font-bold text-gray-800 mb-1">Por precio</h4>
                      <Link href={`/category/${categorySlug}?price=0-10000`} className="hover:text-blue-600 transition-colors">Hasta $ 10.000</Link>
                      <Link href={`/category/${categorySlug}?price=10000-50000`} className="hover:text-blue-600 transition-colors">$ 10.000 a $ 50.000</Link>
                      <Link href={`/category/${categorySlug}?price=50000-`} className="hover:text-blue-600 transition-colors">Más de $ 50.000</Link>
                      <Link href={`/category/${categorySlug}`} className="text-blue-500 hover:underline flex items-center gap-1 mt-1 font-medium">Ver todo <ChevronDown size={14}/></Link>
                    </div>
                    <div className="flex flex-col gap-3">
                      <h4 className="font-bold text-gray-800 mb-1">Marcas populares</h4>
                      <Link href={`/category/${categorySlug}?brand=premium`} className="hover:text-blue-600 transition-colors">Marcas Premium</Link>
                      <Link href={`/category/${categorySlug}?condition=new`} className="hover:text-blue-600 transition-colors">Solo nuevos</Link>
                      <Link href={`/category/${categorySlug}?condition=used`} className="hover:text-blue-600 transition-colors">Usados y reacondicionados</Link>
                      <Link href={`/category/${categorySlug}`} className="text-blue-500 hover:underline flex items-center gap-1 mt-1 font-medium">Ver todo <ChevronDown size={14}/></Link>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN - Buy Box */}
            <div className="w-full lg:w-[350px] flex-shrink-0 flex flex-col gap-4 px-4 lg:px-0">

              {/* BUY BOX */}
              <div className="border border-gray-200 rounded-lg p-5">
                <div className="flex flex-col gap-1 mb-6">
                  {product.free_shipping ? (
                    <>
                      <span className="text-emerald-500 font-semibold text-[15px] flex items-center gap-1"><Truck size={18}/> Llega gratis mañana</span>
                      <span className="text-emerald-500 text-[13px] mt-0.5">Llega mañana entre las 10 y 12 hs.</span>
                      <Link href="#" className="text-blue-500 text-[13px] hover:underline mt-1">Más detalles y formas de entrega</Link>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-700 font-semibold text-[15px] flex items-center gap-1"><Truck size={18}/> Envío a calcular</span>
                      <Link href="#" className="text-blue-500 text-[13px] hover:underline mt-1">Ver opciones de envío</Link>
                    </>
                  )}
                </div>

                <div className="mb-6">
                  <span className="font-semibold text-gray-800 text-[15px] block mb-2">Stock disponible</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] text-gray-800">Cantidad: <strong>1 unidad</strong></span>
                    <ChevronDown size={14} className="text-blue-500" />
                    <span className="text-[13px] text-gray-400">(+{product.stock} disponibles)</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mb-6">
                  <Link href={`/checkout?product=${product.id}`} className="w-full bg-[#3483fa] text-white font-semibold py-3.5 rounded-md hover:bg-[#2968c8] transition-colors text-center text-[16px]">
                    Comprar ahora
                  </Link>
                  <button className="w-full bg-[#d7e7ff] text-[#3483fa] font-semibold py-3.5 rounded-md hover:bg-[#c5dcfa] transition-colors text-[16px]">
                    Agregar al carrito
                  </button>
                </div>

                {/* Seller info */}
                <div className="mb-6 border-b border-gray-200 pb-6">
                  <p className="text-[13px] text-gray-800 mb-0.5">Vendido por <Link href={`/seller/${product.seller_id}`} className="text-blue-500 font-semibold hover:underline">{sellerName}</Link></p>
                  <p className="text-[13px] text-gray-800 mb-0.5">{sellerRepLevel} | +{sellerTotalSales} ventas</p>
                  <p className="text-[12px] text-gray-400">Hace Factura A</p>
                </div>

                <div className="flex flex-col gap-4 text-[13px] text-gray-500 mb-6">
                  <div className="flex items-start gap-3">
                    <Undo size={18} className="text-gray-400 shrink-0 mt-0.5" />
                    <p><span className="text-blue-500">Devolución gratis.</span> Tenés 30 días desde que lo recibís.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={18} className="text-gray-400 shrink-0 mt-0.5" />
                    <p><span className="text-blue-500">Compra Protegida.</span> Recibí el producto que esperabas o te devolvemos tu dinero.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award size={18} className="text-gray-400 shrink-0 mt-0.5" />
                    <p>30 días de garantía de fábrica.</p>
                  </div>
                </div>

                <button className="w-full py-2 flex items-center justify-center gap-2 text-[#3483fa] font-semibold text-[14px] hover:bg-blue-50 rounded-md transition-colors">
                  <Heart size={16} /> Agregar a una lista
                </button>
              </div>

              {/* SELLER REPUTATION BOX */}
              <div className="border border-gray-200 rounded-lg p-5">
                <h3 className="text-[16px] font-semibold text-gray-800 mb-4">Vendido por {sellerName}</h3>
                <p className="text-[14px] font-semibold text-gray-800 mb-1">+{sellerProductCount} Productos</p>
                <div className={`flex items-center gap-2 font-bold text-[13px] mb-1 ${isNewSeller ? "text-gray-400" : "text-emerald-500"}`}>
                  <Award size={16} fill="currentColor" /> {sellerRepLevel}
                </div>
                <p className="text-[12px] text-gray-500 mb-4">{isNewSeller ? "Vendedor nuevo en MADSJEEZ" : "¡Uno de los mejores del sitio!"}</p>

                {/* Thermometer */}
                <div className="flex h-2 rounded-full overflow-hidden gap-1 mb-4">
                  {isNewSeller ? (
                    <>
                      <div className="flex-1 bg-gray-200"></div>
                      <div className="flex-1 bg-gray-200"></div>
                      <div className="flex-1 bg-gray-200"></div>
                      <div className="flex-1 bg-gray-200"></div>
                      <div className="flex-1 bg-gray-200"></div>
                    </>
                  ) : (
                    <>
                      <div className={`flex-1 ${sellerRepColor === "ROJO" ? "bg-red-500" : "bg-red-200"}`}></div>
                      <div className={`flex-1 ${sellerRepColor === "NARANJA" ? "bg-orange-500" : "bg-orange-200"}`}></div>
                      <div className={`flex-1 ${sellerRepColor === "AMARILLO" ? "bg-yellow-500" : "bg-yellow-200"}`}></div>
                      <div className={`flex-1 ${sellerRepColor === "VERDE" ? "bg-lime-500" : "bg-lime-200"}`}></div>
                      <div className={`flex-1 ${sellerRepColor === "VERDE_OSCURO" ? "bg-emerald-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]" : "bg-emerald-200"}`}></div>
                    </>
                  )}
                </div>

                <div className="flex justify-between text-center mb-6">
                  <div className="flex flex-col items-center flex-1 border-r border-gray-200">
                    <span className={`text-[18px] font-bold ${isNewSeller ? "text-gray-400" : "text-gray-800"}`}>+{sellerTotalSales}</span>
                    <span className="text-[10px] text-gray-500 leading-tight">Ventas</span>
                  </div>
                  <div className="flex flex-col items-center flex-1 border-r border-gray-200 px-2">
                    <MessageCircle size={20} className={`mb-1 ${isNewSeller ? "text-gray-300" : "text-emerald-500"}`} />
                    <span className="text-[10px] text-gray-500 leading-tight">{isNewSeller ? "Calibrando" : "Buena atención"}</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <Clock size={20} className={`mb-1 ${isNewSeller ? "text-gray-300" : "text-emerald-500"}`} />
                    <span className="text-[10px] text-gray-500 leading-tight">{isNewSeller ? "Calculando" : "Entrega a tiempo"}</span>
                  </div>
                </div>

                <Link href={`/seller/${product.seller_id}`} className="block text-center text-blue-500 font-semibold text-[14px] hover:underline">
                  Ver más datos de este vendedor
                </Link>
              </div>

              {/* PAYMENT METHODS */}
              <div className="border border-gray-200 rounded-lg p-5">
                <h3 className="text-[16px] font-semibold text-gray-800 mb-4">Medios de pago</h3>

                <div className="bg-emerald-500 text-white p-3 rounded-lg mb-4 text-[13px] font-bold flex items-center gap-2">
                  <CreditCard size={18} /> ¡Pagá el mismo precio en hasta 6 cuotas!
                </div>

                <div className="mb-4">
                  <p className="text-[13px] font-semibold text-gray-800 mb-2">Cuotas sin Tarjeta</p>
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-500 text-white text-[10px] px-1 py-0.5 rounded font-bold italic">Mads Pago</div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-[13px] font-semibold text-gray-800 mb-2">Tarjetas de crédito</p>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-6 bg-blue-900 rounded flex items-center justify-center text-white text-[8px] font-bold italic">VISA</div>
                    <div className="w-10 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-[8px] font-bold italic">AMEX</div>
                    <div className="w-10 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-[8px] font-bold italic">MASTER</div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-[13px] font-semibold text-gray-800 mb-2">Efectivo</p>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-6 bg-yellow-400 rounded flex items-center justify-center text-blue-900 text-[10px] font-bold italic">PagoFácil</div>
                  </div>
                </div>

                <Link href="#" className="text-blue-500 font-semibold text-[13px] hover:underline">Conocé otros medios de pago</Link>
              </div>

            </div>
          </div>

          {/* Seller Products Carousel */}
          {sellerProducts.length > 0 && (
            <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200 relative group">
              <h2 className="text-[20px] font-normal text-gray-800 mb-5">Elegidos para vos de {sellerName}</h2>
              <div className="flex gap-0 overflow-x-auto scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                {sellerProducts.map((item: any) => (
                  <Link key={item.id} href={`/product/${item.id}`} className="min-w-[160px] max-w-[160px] px-3 py-2 cursor-pointer flex flex-col hover:opacity-80 transition-opacity border-r border-gray-100 last:border-r-0">
                    <div className="h-[140px] mb-3 flex items-center justify-center">
                      {item.primary_image ? (
                        <img src={item.primary_image} alt={item.title} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <Package className="h-16 w-16 text-gray-300" />
                      )}
                    </div>
                    <h4 className="text-[13px] text-[#3483fa] leading-snug mb-2 line-clamp-2 min-h-[36px]">{item.title}</h4>
                    <div className="mt-auto">
                      <span className="text-[18px] font-normal text-gray-800">$ {item.price.toLocaleString("es-AR")}</span>
                      <span className="text-[12px] text-emerald-500 block mt-1">Llega mañana</span>
                    </div>
                  </Link>
                ))}
              </div>
              {/* Right arrow */}
              <button className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:shadow-lg">
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
