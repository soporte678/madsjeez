import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureStoreSlugForUser } from "@/lib/public-store";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/product/ProductCard";
import { ReputationBadge } from "@/components/ReputationBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Store,
  MapPin,
  Calendar,
  Star,
  Package,
  MessageSquare,
  Shield,
  CheckCircle,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface SellerProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_verified: boolean;
}

interface ReputationData {
  color: string;
  total_sales: number;
  total_orders: number;
  positive_reviews: number;
  neutral_reviews: number;
  negative_reviews: number;
  average_rating: number;
}

async function getSeller(id: string): Promise<(SellerProfile & { reputation: ReputationData | null }) | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) return null;

  const { data: reputation } = await supabase
    .from("reputation_scores")
    .select("*")
    .eq("seller_id", id)
    .single();

  return {
    ...profile,
    reputation: reputation as ReputationData | null,
  };
}

async function getSellerProducts(sellerId: string) {
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
    .order("created_at", { ascending: false });

  return products?.map((product: any) => ({
    ...product,
    primary_image: product.product_images?.find((img: { is_primary: boolean }) => img.is_primary)?.url ||
                   product.product_images?.[0]?.url,
    seller_reputation: product.reputation_scores?.color,
  })) || [];
}

async function getSellerReviews(sellerId: string) {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      *,
      reviewer:profiles!reviewer_id(full_name),
      product:products(title)
    `)
    .eq("seller_id", sellerId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(10);

  return reviews || [];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const seller = await getSeller(id);

  if (!seller) {
    return { title: "Vendedor no encontrado | MADSJEEZ" };
  }

  return {
    title: `${seller.full_name || "Vendedor"} | MADSJEEZ`,
    description: `Tienda oficial de ${seller.full_name || "vendedor"} en MADSJEEZ`,
  };
}

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const slug = await ensureStoreSlugForUser(id);
  if (slug) redirect(`/tienda/${slug}`);

  const seller = await getSeller(id);

  if (!seller) {
    notFound();
  }

  const [products, reviews] = await Promise.all([
    getSellerProducts(id),
    getSellerReviews(id),
  ]);

  const memberSince = new Date(seller.created_at).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const positiveRate = seller.reputation
    ? Math.round(
        (seller.reputation.positive_reviews /
          (seller.reputation.positive_reviews +
            seller.reputation.neutral_reviews +
            seller.reputation.negative_reviews || 1)) *
          100
      )
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={null} />

      <main className="flex-1 bg-[#EBEBEB]">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl">
                {seller.avatar_url ? (
                  <img
                    src={seller.avatar_url}
                    alt={seller.full_name || ""}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Store className="h-12 w-12 text-gray-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{seller.full_name || "Vendedor"}</h1>
                  {seller.is_verified && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Miembro desde {memberSince}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {products.length} productos
                  </span>
                  {seller.reputation && (
                    <>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {seller.reputation.average_rating.toFixed(1)} de calificación
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {seller.reputation.total_sales} ventas
                      </span>
                    </>
                  )}
                </div>

                {seller.reputation && (
                  <div className="flex items-center gap-3 mt-3">
                    <ReputationBadge color={seller.reputation.color} />
                    <span className="text-sm text-gray-500">{positiveRate}% opiniones positivas</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Link href={`/messages?seller=${seller.id}`}>
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contactar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <Tabs defaultValue="products">
            <TabsList className="mb-6">
              <TabsTrigger value="products">Productos ({products.length})</TabsTrigger>
              <TabsTrigger value="reviews">Opiniones ({reviews.length})</TabsTrigger>
              <TabsTrigger value="info">Información</TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              {products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Este vendedor no tiene productos activos</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="reviews">
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{review.reviewer?.full_name || "Usuario"}</span>
                              <Badge
                                variant={review.is_positive ? "default" : "secondary"}
                                className={review.is_positive ? "bg-green-100 text-green-800" : ""}
                              >
                                {review.is_positive ? "Positiva" : "Negativa"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{review.comment}</p>
                            {review.product && (
                              <p className="text-sm text-gray-400 mt-2">
                                Producto: {review.product.title}
                              </p>
                            )}
                          </div>
                          <span className="text-sm text-gray-400">
                            {new Date(review.created_at).toLocaleDateString("es-AR")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Star className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Aún no hay opiniones</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="info">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Sobre el vendedor</h3>
                  
                  {seller.reputation && (
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">{positiveRate}%</p>
                        <p className="text-sm text-gray-500">Opiniones positivas</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold">{seller.reputation.total_sales}</p>
                        <p className="text-sm text-gray-500">Ventas concretadas</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold">
                          {seller.reputation.average_rating.toFixed(1)}
                        </p>
                        <p className="text-sm text-gray-500">Calificación promedio</p>
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4" />
                    <span>Este vendedor está protegido por MADSJEEZ</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
