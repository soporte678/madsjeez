import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, Package, Grid3X3, List, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  icon: string | null;
}

async function getCategory(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  return data;
}

async function getCategoryProducts(categoryId: string) {
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
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  return products?.map((product: any) => ({
    ...product,
    primary_image: product.product_images?.find((img: { is_primary: boolean }) => img.is_primary)?.url ||
                   product.product_images?.[0]?.url,
    seller_name: product.profiles?.full_name,
    seller_reputation: product.reputation_scores?.color,
  })) || [];
}

async function getSubcategories(parentId: string | null) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .eq("parent_id", parentId)
    .eq("is_active", true)
    .order("name");

  return data || [];
}

async function getParentCategory(parentId: string | null) {
  if (!parentId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("id", parentId)
    .single();

  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return { title: "Categoría no encontrada | MADSJEEZ" };
  }

  return {
    title: `${category.name} | MADSJEEZ`,
    description: category.description || `Encuentra los mejores ${category.name} en MADSJEEZ`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const [products, subcategories, parentCategory] = await Promise.all([
    getCategoryProducts(category.id),
    getSubcategories(category.id),
    getParentCategory(category.parent_id),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={null} />

      <main className="flex-1 bg-[#EBEBEB]">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-[#3483FA]">Inicio</Link>
              <ChevronRight className="h-4 w-4" />
              {parentCategory && (
                <>
                  <Link href={`/category/${parentCategory.slug}`} className="hover:text-[#3483FA]">
                    {parentCategory.name}
                  </Link>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
              <span className="text-gray-900 font-medium">{category.name}</span>
            </nav>
          </div>
        </div>

        {/* Category Header */}
        <div className="bg-white">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4">
              {category.icon && (
                <div className="w-16 h-16 bg-[#EBEBEB] rounded-full flex items-center justify-center text-3xl">
                  {category.icon}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">{category.name}</h1>
                {category.description && (
                  <p className="text-gray-600 mt-1">{category.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {products.length} productos disponibles
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="space-y-4">
              {/* Subcategories */}
              {subcategories.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Subcategorías</h3>
                    <div className="space-y-2">
                      {subcategories.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/category/${sub.slug}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {sub.icon && <span className="text-xl">{sub.icon}</span>}
                          <span>{sub.name}</span>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Filters Placeholder */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Precio</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Mín"
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Máx"
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-sm font-medium mb-2">Condición</p>
                      <div className="space-y-2">
                        {["Nuevo", "Usado", "Reacondicionado"].map((condition) => (
                          <label key={condition} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            {condition}
                          </label>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-sm font-medium mb-2">Envío</p>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded" />
                        Envío gratis
                      </label>
                    </div>
                  </div>

                  <Button className="w-full mt-4 bg-[#3483FA]">
                    Aplicar filtros
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  Mostrando {products.length} resultados
                </p>
                <div className="flex items-center gap-2">
                  <select className="px-3 py-2 border rounded-md text-sm">
                    <option>Ordenar por relevancia</option>
                    <option>Menor precio</option>
                    <option>Mayor precio</option>
                    <option>Más recientes</option>
                  </select>
                </div>
              </div>

              {/* Products */}
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
                    <h2 className="text-xl font-semibold mb-2">No hay productos</h2>
                    <p className="text-gray-500 mb-6">
                      Aún no hay productos en esta categoría
                    </p>
                    <Link href="/sell">
                      <Button className="bg-[#3483FA]">Sé el primero en vender</Button>
                    </Link>
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
