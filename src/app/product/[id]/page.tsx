import { Metadata } from "next";
import { SITE_URL } from "@/lib/seo/site";
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
import { prisma } from "@/lib/prisma";
import { ProductQuestions } from "@/components/product/ProductQuestions";
import { getPrismaProductDetailBundle } from "@/lib/product/prisma-detail-for-page";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { BuyBox } from "@/components/product/BuyBox";
import { Reveal } from "@/components/premium";
import { ProductViewTracker } from "@/components/analytics/ProductViewTracker";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { RecentlyViewedProducts } from "@/components/product/RecentlyViewedProducts";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";

function hasValidSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (key === "undefined" || key === "null") return false;
  return true;
}

/** IDs Prisma (cuid) — catálogo ML / panel; no están en la tabla legacy de Supabase. */
function isPrismaCatalogId(id: string): boolean {
  return /^c[a-z0-9]{20,}$/i.test(id);
}

function isBenignSupabaseEmptyRow(error: { code?: string; message?: string }): boolean {
  const msg = String(error.message || "").toLowerCase();
  return (
    error.code === "PGRST116" ||
    msg.includes("0 rows") ||
    msg.includes("cannot coerce the result to a single json object")
  );
}

async function getProduct(id: string) {
  if (!hasValidSupabaseConfig()) return null;
  if (isPrismaCatalogId(id)) return null;

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
    .maybeSingle();

  if (error) {
    if (!isBenignSupabaseEmptyRow(error) && !String(error.message || "").toLowerCase().includes("invalid api key")) {
      console.error("getProduct error:", error.message, error.details);
    }
    return null;
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
  if (!hasValidSupabaseConfig()) return [];

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
  if (!hasValidSupabaseConfig()) return [];

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
  if (!hasValidSupabaseConfig()) return [];

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

/** Obtiene WhatsApp del seller (tabla stores) y si tiene MP conectado (tabla seller_mercadopago). */
async function getSellerContactInfo(sellerId: string): Promise<{ waPhone: string | null; hasMercadoPago: boolean }> {
  const store = await prisma.store.findUnique({
    where: { ownerUserId: sellerId },
    select: { whatsapp: true, phone: true },
  }).catch(() => null);
  const waPhone = store?.whatsapp || store?.phone || null;

  let hasMercadoPago = false;
  if (hasValidSupabaseConfig()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("seller_mercadopago")
        .select("mp_access_token, is_active")
        .eq("seller_id", sellerId)
        .eq("is_active", true)
        .maybeSingle();
      hasMercadoPago = Boolean((data as { mp_access_token?: string } | null)?.mp_access_token?.trim());
    } catch { /* sin MP */ }
  }

  return { waPhone, hasMercadoPago };
}

async function getTopRatedProducts(categoryId: string | null, currentProductId: string) {
  if (!categoryId) return [];
  if (!hasValidSupabaseConfig()) return [];

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

  if (product) {
    const desc =
      product.description?.slice(0, 160) ||
      `Comprá ${product.title} en el marketplace MadsJeez Argentina.`;
    const canonical = `/product/${id}`;
    const imgs = (product.product_images as { url: string }[] | undefined) || [];
    const ogImage =
      imgs.find((i) => i.url)?.url ||
      undefined;
    return {
      title: `${product.title} | Comprar en MadsJeez`,
      description: desc,
      alternates: { canonical },
      openGraph: {
        title: product.title,
        description: desc,
        url: `${SITE_URL}${canonical}`,
        type: "website",
        locale: "es_AR",
        ...(ogImage ? { images: [{ url: ogImage, alt: product.title }] } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: product.title,
        description: desc,
        ...(ogImage ? { images: [ogImage] } : {}),
      },
    };
  }

  const prismaProd = await prisma.product.findUnique({
    where: { id },
    select: { title: true, description: true },
  });

  if (!prismaProd) {
    return { title: "Producto no encontrado | MADSJEEZ" };
  }

  const desc =
    prismaProd.description?.slice(0, 160) ||
    `Comprá ${prismaProd.title} en el marketplace MadsJeez Argentina.`;
  const canonical = `/product/${id}`;
  return {
    title: `${prismaProd.title} | Comprar en MadsJeez`,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: prismaProd.title,
      description: desc,
      url: `${SITE_URL}${canonical}`,
      type: "website",
      locale: "es_AR",
    },
    twitter: {
      card: "summary_large_image",
      title: prismaProd.title,
      description: desc,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sbProduct = await getProduct(id);

  let product: any;
  let relatedProducts: any[];
  let sellerProducts: any[];
  let productReviews: any[];
  let topRatedProducts: any[];

  let sellerContactInfo: { waPhone: string | null; hasMercadoPago: boolean } = { waPhone: null, hasMercadoPago: false };

  if (sbProduct) {
    product = sbProduct;
    [relatedProducts, sellerProducts, productReviews, topRatedProducts, sellerContactInfo] = await Promise.all([
      getRelatedProducts(product.category_id, product.id),
      getSellerProducts(product.seller_id, product.id),
      getProductReviews(product.id),
      getTopRatedProducts(product.category_id, product.id),
      getSellerContactInfo(product.seller_id),
    ]);
  } else {
    const bundle = await getPrismaProductDetailBundle(id);
    if (!bundle) notFound();
    product = bundle.product;
    relatedProducts = bundle.relatedProducts;
    sellerProducts = bundle.sellerProducts;
    productReviews = bundle.productReviews;
    topRatedProducts = bundle.topRatedProducts;
    sellerContactInfo = await getSellerContactInfo(product.seller_id);
  }

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
  // Forzamos Number() porque Prisma puede devolver Decimal que rompe
  // toLocaleString (muestra "99619" en lugar de "99.619" formato es-AR).
  const priceNumber = Number(product.price) || 0;
  const originalPriceNumber = product.original_price != null ? Number(product.original_price) : null;
  const cuotas6 = Math.ceil(priceNumber / 6);
  const discount = originalPriceNumber && originalPriceNumber > priceNumber
    ? Math.round(((originalPriceNumber - priceNumber) / originalPriceNumber) * 100)
    : null;

  const images = product.product_images?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((img: any) => img.url) || [];

  const categoryName = product.categories?.name || "Productos";
  const categorySlug = product.categories?.slug || "";

  const stockQty = Number(product.stock ?? 0);

  return (
    <div className="min-h-screen flex flex-col">
      <ProductJsonLd
        product={{
          id: product.id,
          title: product.title,
          description: product.description || "",
          price: priceNumber,
          images,
          category: categoryName,
          availability: stockQty > 0 ? "InStock" : "OutOfStock",
          rating: avgRating || undefined,
          reviewCount: totalReviews || undefined,
        }}
        sellerName={sellerName}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", path: "/" },
          ...(categorySlug
            ? [{ name: categoryName, path: `/category/${categorySlug}` }]
            : []),
          { name: product.title, path: `/product/${product.id}` },
        ]}
      />
      <Navbar />
      <ProductViewTracker
        productId={product.id}
        title={product.title}
        price={Number(product.price || 0)}
        categoryName={product.categories?.name || null}
        sellerName={sellerName}
        primaryImage={images[0] || null}
        categorySlug={categorySlug}
      />

      <div className="min-h-screen bg-background font-sans text-foreground pb-20">
        {/* Top Banner */}
        <div className="bg-card border-b border-border py-3 px-4 text-sm justify-center hidden md:flex">
          <span className="text-muted-foreground">También puede interesarte: </span>
          <Link href={`/category/${categorySlug}`} className="font-semibold text-foreground ml-1 hover:text-primary transition-colors">
            {categoryName}
          </Link>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 pt-4">
          {/* Breadcrumbs */}
          <div className="flex justify-between items-center text-[13px] mb-4">
            <div className="flex items-center gap-2 text-primary">
              <Link href="/" className="hover:underline">Inicio</Link>
              <ChevronRight size={12} className="text-muted-foreground" />
              {product.categories && (
                <>
                  <Link href={`/category/${product.categories.slug}`} className="hover:underline">
                    {product.categories.name}
                  </Link>
                  <ChevronRight size={12} className="text-muted-foreground" />
                </>
              )}
              <span className="text-muted-foreground font-medium truncate max-w-[200px]">{product.title}</span>
            </div>
            <div className="flex items-center gap-4 text-[13px] text-primary">
              <Link href={`/seller/${product.seller_id}`} className="hover:underline">Vender uno igual</Link>
              <button className="hover:underline flex items-center gap-1"><Share2 size={14}/> Compartir</button>
            </div>
          </div>

          {/* MAIN CONTAINER */}
          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border flex flex-col lg:flex-row p-0 lg:p-4 gap-6">

            {/* LEFT COLUMN */}
            <div className="flex-[2] flex flex-col min-w-0">

              {/* Gallery + Title Section */}
              <div className="flex flex-col md:flex-row gap-6 p-4 lg:p-0 overflow-hidden">
                {/* Image Gallery - Client Component */}
                <ProductDetailClient images={images} title={product.title} />

                {/* Product Info */}
                <div className="flex-1 min-w-0 flex flex-col pt-2 md:pt-0 relative z-10">
                  <span className="text-[13px] text-muted-foreground mb-1">{conditionLabel}  |  +{salesCount} vendidos</span>
                  <h1 className="text-2xl font-semibold text-foreground leading-tight mb-2 pr-8">{product.title}</h1>

                  <div className="flex flex-col mb-4">
                    {originalPriceNumber && originalPriceNumber > priceNumber && (
                      <span className="text-[15px] text-muted-foreground line-through">$ {originalPriceNumber.toLocaleString("es-AR")}</span>
                    )}
                    <span className="text-4xl font-bold text-foreground leading-none">$ {priceNumber.toLocaleString("es-AR")}</span>
                    {discount && <span className="text-[15px] font-medium text-emerald-500 mt-1">{discount}% OFF</span>}
                    <span className="text-[15px] font-medium text-emerald-500 mt-1">Mismo precio en 6 cuotas de $ {cuotas6.toLocaleString("es-AR")}</span>
                    <Link href="#" className="text-[13px] text-primary hover:underline mt-1">Ver los medios de pago</Link>
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-border my-8 hidden md:block"></div>

              {/* Description */}
              {product.description && (
                <>
                  <div className="px-4 lg:px-0">
                    <h2 className="text-[24px] font-semibold text-foreground mb-6">Descripción</h2>
                    <div className="text-[15px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {product.description}
                    </div>
                  </div>
                  <div className="w-full h-px bg-border my-8 hidden md:block"></div>
                </>
              )}

              {/* Related Products Carousel */}
              {relatedProducts.length > 0 && (
                <>
                  <Reveal className="px-4 lg:px-0">
                    <h2 className="text-[20px] font-normal text-foreground mb-5">Relacionado con esta publicación</h2>
                    <div className="relative group bg-card border border-border rounded-lg p-4">
                      <div className="flex gap-0 overflow-x-auto scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                        {relatedProducts.map((item: any) => (
                          <Link key={item.id} href={`/product/${item.id}`} className="min-w-[170px] max-w-[170px] px-3 py-2 cursor-pointer flex flex-col hover:opacity-95 transition-opacity border-r border-border last:border-r-0">
                            <div className="h-[140px] mb-3 flex items-center justify-center rounded-lg bg-card border border-border p-2">
                              {item.primary_image ? (
                                <img src={item.primary_image} alt={item.title} className="max-h-full max-w-full object-contain" />
                              ) : (
                                <Package className="h-16 w-16 text-muted-foreground" />
                              )}
                            </div>
                            <h4 className="text-[13px] text-primary leading-snug mb-2 line-clamp-2 min-h-[36px]">{item.title}</h4>
                            <div className="mt-auto">
                              <span className="text-[18px] font-normal text-foreground">$ {item.price.toLocaleString("es-AR")}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                      {/* Right arrow */}
                      <button className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-10 h-10 bg-card border border-border rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:shadow-lg">
                        <ChevronRight size={20} className="text-muted-foreground" />
                      </button>
                    </div>
                  </Reveal>
                  <div className="w-full h-px bg-border my-8 hidden md:block"></div>
                </>
              )}

              <div id="preguntas" className="px-4 lg:px-0 mb-10 scroll-mt-24">
                <ProductQuestions productId={product.id} sellerId={product.seller_id} />
              </div>

              <div className="w-full h-px bg-border my-8 hidden md:block"></div>

              {/* OPINIONES Y CALIFICACIONES */}
              <div className="px-4 lg:px-0 mb-10">
                <h2 className="text-[24px] font-semibold text-foreground mb-6">Opiniones del producto</h2>
                <div className="bg-card p-6 rounded-lg border border-border flex flex-col md:flex-row gap-12">
                  {/* Rating General */}
                  <div className="flex flex-col w-full md:w-64 shrink-0">
                    <div className="flex items-end gap-3 mb-3">
                      <span className="text-[54px] font-semibold leading-none text-foreground tracking-tight">
                        {totalReviews > 0 ? avgRating.toFixed(1) : '—'}
                      </span>
                      <div className="flex flex-col mb-1.5">
                        <div className="flex text-primary mb-1">
                          {[1, 2, 3, 4, 5].map((s) => {
                            const filled = avgRating >= s;
                            const partial = !filled && avgRating > s - 1;
                            return (
                              <div key={s} className="relative">
                                <Star size={16} className="text-blue-200" fill="currentColor" />
                                {filled && (
                                  <div className="absolute top-0 left-0 overflow-hidden w-full">
                                    <Star size={16} className="text-primary" fill="currentColor" />
                                  </div>
                                )}
                                {partial && (
                                  <div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${((avgRating - (s - 1)) * 100)}%` }}>
                                    <Star size={16} className="text-primary" fill="currentColor" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <span className="text-[12px] text-muted-foreground font-medium">{totalReviews} calificaciones</span>
                      </div>
                    </div>

                    {/* Barras de progreso */}
                    <div className="flex flex-col gap-1.5 mt-2">
                      {[5, 4, 3, 2, 1].map((s) => (
                        <div key={s} className="flex items-center gap-3 text-[13px] text-muted-foreground">
                          <span className="w-2 text-right">{s}</span>
                          <Star size={12} fill="currentColor" className="text-muted-foreground/60" />
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${ratingPercents[s - 1]}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Opiniones con comentarios */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-5 text-[15px]">Opiniones destacadas</h3>
                    {totalReviews === 0 ? (
                      <p className="text-muted-foreground text-[14px]">Este producto aún no tiene opiniones. ¡Sé el primero en opinar!</p>
                    ) : (
                      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                        {productReviews.slice(0, 5).map((review: any) => (
                          <div key={review.id} className="border-b border-border pb-4 last:border-b-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex text-primary">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} size={12} fill="currentColor" className={s <= review.rating ? "text-primary" : "text-muted-foreground/30"} />
                                ))}
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-[13px] text-foreground/90 leading-relaxed">{review.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-border my-8 hidden md:block"></div>

              {/* CON 4 ESTRELLAS O MÁS */}
              {topRatedProducts.length > 0 && (
                <>
                  <div className="px-4 lg:px-0">
                    <div className="bg-card p-6 rounded-lg border border-border relative group">
                      <h2 className="text-[22px] font-semibold text-foreground mb-6">Con 4 estrellas o más</h2>
                      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
                        {topRatedProducts.map((item: any) => (
                          <Link key={item.id} href={`/product/${item.id}`} className="min-w-[200px] max-w-[200px] border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col bg-card">
                            <div className="h-32 mb-4 flex items-center justify-center rounded-lg bg-card border border-border p-2">
                              {item.primary_image ? (
                                <img src={item.primary_image} alt={item.title} className="max-h-full max-w-full object-contain" />
                              ) : (
                                <Package className="h-12 w-12 text-muted-foreground" />
                              )}
                            </div>
                            <h4 className="text-[13px] text-foreground leading-snug mb-3 line-clamp-2 min-h-[36px] font-medium">{item.title}</h4>
                            <div className="mt-auto flex flex-col gap-1">
                              <span className="text-[18px] font-medium text-foreground">$ {item.price.toLocaleString("es-AR")}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <button className="absolute -right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-card rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-muted">
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-px bg-border my-8 hidden md:block"></div>
                </>
              )}

              {/* FOOTER - CATEGORÍAS DESTACADAS */}
              <div className="px-4 lg:px-0 mb-10">
                <div className="bg-card p-8 rounded-lg border border-border">
                  <h3 className="text-[18px] font-semibold text-foreground mb-6">Destacado en {categoryName}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 text-[13px] text-muted-foreground">
                    <div className="flex flex-col gap-3">
                      <h4 className="font-bold text-foreground mb-1">Más vendidos</h4>
                      <Link href={`/category/${categorySlug}?sort=sales`} className="hover:text-primary transition-colors">Los más vendidos de la categoría</Link>
                      <Link href={`/category/${categorySlug}?sort=price_asc`} className="hover:text-primary transition-colors">Precios más bajos</Link>
                      <Link href={`/category/${categorySlug}?sort=newest`} className="hover:text-primary transition-colors">Recién llegados</Link>
                      <Link href={`/category/${categorySlug}`} className="text-primary hover:underline flex items-center gap-1 mt-1 font-medium">Ver todo <ChevronDown size={14}/></Link>
                    </div>
                    <div className="flex flex-col gap-3">
                      <h4 className="font-bold text-foreground mb-1">Mejores opiniones</h4>
                      <Link href={`/category/${categorySlug}?sort=rating`} className="hover:text-primary transition-colors">Mejor calificados</Link>
                      <Link href={`/category/${categorySlug}?filter=free_shipping`} className="hover:text-primary transition-colors">Con envío gratis</Link>
                      <Link href={`/category/${categorySlug}?filter=discount`} className="hover:text-primary transition-colors">En oferta</Link>
                      <Link href={`/category/${categorySlug}`} className="text-primary hover:underline flex items-center gap-1 mt-1 font-medium">Ver todo <ChevronDown size={14}/></Link>
                    </div>
                    <div className="flex flex-col gap-3">
                      <h4 className="font-bold text-foreground mb-1">Por precio</h4>
                      <Link href={`/category/${categorySlug}?price=0-10000`} className="hover:text-primary transition-colors">Hasta $ 10.000</Link>
                      <Link href={`/category/${categorySlug}?price=10000-50000`} className="hover:text-primary transition-colors">$ 10.000 a $ 50.000</Link>
                      <Link href={`/category/${categorySlug}?price=50000-`} className="hover:text-primary transition-colors">Más de $ 50.000</Link>
                      <Link href={`/category/${categorySlug}`} className="text-primary hover:underline flex items-center gap-1 mt-1 font-medium">Ver todo <ChevronDown size={14}/></Link>
                    </div>
                    <div className="flex flex-col gap-3">
                      <h4 className="font-bold text-foreground mb-1">Marcas populares</h4>
                      <Link href={`/category/${categorySlug}?brand=premium`} className="hover:text-primary transition-colors">Marcas Premium</Link>
                      <Link href={`/category/${categorySlug}?condition=new`} className="hover:text-primary transition-colors">Solo nuevos</Link>
                      <Link href={`/category/${categorySlug}?condition=used`} className="hover:text-primary transition-colors">Usados y reacondicionados</Link>
                      <Link href={`/category/${categorySlug}`} className="text-primary hover:underline flex items-center gap-1 mt-1 font-medium">Ver todo <ChevronDown size={14}/></Link>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN - Buy Box */}
            <div className="w-full lg:w-[350px] flex-shrink-0 flex flex-col gap-4 px-4 lg:px-0">
              <BuyBox
                productId={product.id}
                productTitle={product.title}
                productImage={images[0] ?? null}
                basePrice={priceNumber}
                originalPrice={originalPriceNumber}
                freeShipping={product.free_shipping}
                shippingCost={Number(product.shipping_cost) || 0}
                stock={product.stock}
                sellerId={product.seller_id}
                sellerName={sellerName}
                sellerRepLevel={sellerRepLevel}
                sellerRepColor={sellerRepColor}
                sellerTotalSales={sellerTotalSales}
                isNewSeller={isNewSeller}
                salesCount={salesCount}
                discount={discount}
                cuotas6={cuotas6}
                sellerProvince={product.seller?.seller_province ?? null}
                sellerLocality={product.seller?.seller_locality ?? null}
                sellerPartido={product.seller?.seller_partido ?? null}
                sellerWhatsapp={sellerContactInfo.waPhone}
                hasMercadoPago={sellerContactInfo.hasMercadoPago}
              />
            </div>
          </div>

          {/* Recently Viewed */}
          <div className="mt-8 px-4 lg:px-0">
            <RecentlyViewedProducts currentId={product.id} />
          </div>

          {/* Seller Products Carousel */}
          {sellerProducts.length > 0 && (
            <div className="mt-8 bg-card p-6 rounded-lg border border-border relative group">
              <h2 className="text-[20px] font-normal text-foreground mb-5">Elegidos para vos de {sellerName}</h2>
              <div className="flex gap-0 overflow-x-auto scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                {sellerProducts.map((item: any) => (
                  <Link key={item.id} href={`/product/${item.id}`} className="min-w-[170px] max-w-[170px] px-3 py-2 cursor-pointer flex flex-col hover:opacity-95 transition-opacity border-r border-border last:border-r-0">
                    <div className="h-[140px] mb-3 flex items-center justify-center rounded-lg bg-card border border-border p-2">
                      {item.primary_image ? (
                        <img src={item.primary_image} alt={item.title} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <Package className="h-16 w-16 text-muted-foreground" />
                      )}
                    </div>
                    <h4 className="text-[13px] text-primary leading-snug mb-2 line-clamp-2 min-h-[36px]">{item.title}</h4>
                    <div className="mt-auto">
                      <span className="text-[18px] font-normal text-foreground">$ {item.price.toLocaleString("es-AR")}</span>
                    </div>
                  </Link>
                ))}
              </div>
              {/* Right arrow */}
              <button className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-10 h-10 bg-card border border-border rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:shadow-lg">
                <ChevronRight size={20} className="text-muted-foreground" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
