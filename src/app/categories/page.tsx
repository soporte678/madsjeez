import Link from "next/link"
import { Header } from "@/components/Header"
import { Card, CardContent } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

async function getCategories() {
  const categories = await prisma.categories.findMany({
    where: { parent_id: null },
    include: {
      children: true,
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: "asc" }
  })
  return categories
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Categorías</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/category/${category.slug}`}>
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#3483FA] rounded-lg flex items-center justify-center text-white text-2xl">
                      {category.icon || "📦"}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{category.name}</h2>
                      <p className="text-gray-500 text-sm">
                        {category._count.products} productos
                      </p>
                      {category.children.length > 0 && (
                        <p className="text-gray-400 text-xs mt-1">
                          {category.children.length} subcategorías
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        
        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay categorías disponibles</p>
          </div>
        )}
      </main>
    </div>
  )
}
