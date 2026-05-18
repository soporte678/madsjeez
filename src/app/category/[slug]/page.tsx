import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/product/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, Package, Search, SlidersHorizontal } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { seedCategoriesIfEmpty } from "@/lib/seed-categories";

type CategoryView = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
};

async function getCategory(slug: string): Promise<CategoryView | null> {
  await seedCategoriesIfEmpty();
  return prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
    },
  });
}

async function getCategoryProducts(categoryIds: string[]) {
  if (categoryIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: {
      categoryId: { in: categoryIds },
      isActive: true,
    },
    include: {
      seller: { select: { id: true, name: true, sellerName: true } },
      images: { orderBy: { order: "asc" }, take: 5 },
    },
    orderBy: [{ isBoosted: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
    take: 96,
  });

  return products.map((product) => ({
    id: product.id,
    title: product.title,
    price: product.price,
    images: product.images.map((image) => ({ url: image.url })),
    seller: {
      id: product.seller.id,
      full_name: product.seller.sellerName || product.seller.name || "Vendedor MADSJEEZ",
    },
  }));
}

async function getSubcategories(parentId: string | null) {
  return prisma.category.findMany({
    where: { parentId },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

async function getParentCategory(parentId: string | null) {
  if (!parentId) return null;
  return prisma.category.findUnique({
    where: { id: parentId },
    select: { name: true, slug: true },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return { title: "Categoria no encontrada | MADSJEEZ" };
  }

  return {
    title: `${category.name} | MADSJEEZ`,
    description: category.description || `Compra y vende ${category.name} en MADSJEEZ Argentina.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const [subcategories, parentCategory] = await Promise.all([
    getSubcategories(category.id),
    getParentCategory(category.parentId),
  ]);
  const categoryIds = [category.id, ...subcategories.map((subcategory) => subcategory.id)];
  const products = await getCategoryProducts(categoryIds);
  const searchHref = `/search?category=${encodeURIComponent(category.id)}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={null} />

      <main className="flex-1 bg-[#EBEBEB]">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-[#3483FA]">Inicio</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/categories" className="hover:text-[#3483FA]">Categorias</Link>
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

        <div className="bg-white">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">{category.name}</h1>
                {category.description && (
                  <p className="text-gray-600 mt-1">{category.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {products.length} productos disponibles
                  {subcategories.length > 0 ? ` en ${subcategories.length + 1} secciones` : ""}
                </p>
              </div>

              <Link href={searchHref}>
                <Button className="bg-[#3483FA] hover:bg-[#2968c8]">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar en esta categoria
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              {subcategories.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Subcategorias</h3>
                    <div className="space-y-2">
                      {subcategories.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/category/${sub.slug}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <span>{sub.name}</span>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros rapidos
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Explorar</p>
                      <div className="space-y-2">
                        <Link
                          href={searchHref}
                          className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:border-[#3483FA] hover:text-[#3483FA]"
                        >
                          <Search className="h-4 w-4" />
                          Abrir en buscador
                        </Link>
                        <Link
                          href={`${searchHref}&sort=price_asc`}
                          className="block rounded-md border px-3 py-2 text-sm hover:border-[#3483FA] hover:text-[#3483FA]"
                        >
                          Menor precio
                        </Link>
                        <Link
                          href={`${searchHref}&sort=newest`}
                          className="block rounded-md border px-3 py-2 text-sm hover:border-[#3483FA] hover:text-[#3483FA]"
                        >
                          Mas recientes
                        </Link>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-sm font-medium mb-2">Condicion</p>
                      <div className="space-y-2">
                        <Link href={`${searchHref}&condition=new`} className="block text-sm hover:text-[#3483FA]">
                          Nuevo
                        </Link>
                        <Link href={`${searchHref}&condition=used`} className="block text-sm hover:text-[#3483FA]">
                          Usado
                        </Link>
                        <Link href={`${searchHref}&condition=refurbished`} className="block text-sm hover:text-[#3483FA]">
                          Reacondicionado
                        </Link>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-sm font-medium mb-2">Envio</p>
                      <Link href={`${searchHref}&free_shipping=true`} className="block text-sm hover:text-[#3483FA]">
                        Envio gratis
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <p className="text-sm text-gray-500">
                  Mostrando {products.length} resultados
                </p>
                <div className="flex items-center gap-2">
                  <Link href={`${searchHref}&sort=price_asc`} className="text-sm text-[#3483FA] hover:underline">
                    Menor precio
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link href={`${searchHref}&sort=newest`} className="text-sm text-[#3483FA] hover:underline">
                    Mas recientes
                  </Link>
                </div>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No hay productos publicados</h2>
                    <p className="text-gray-500 mb-6">
                      Esta categoria esta lista para recibir vendedores. Publica el primer producto y empeza a captar demanda.
                    </p>
                    <Link href="/vender">
                      <Button className="bg-[#3483FA] hover:bg-[#2968c8]">Quiero vender en MADSJEEZ</Button>
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
