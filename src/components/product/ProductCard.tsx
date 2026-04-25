import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string
  title: string
  price: number
  images: { url: string }[]
  seller?: {
    id: string
    full_name: string
  }
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
            {product.images?.[0]?.url ? (
              <img
                src={product.images[0].url}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Sin imagen
              </div>
            )}
          </div>
          <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.title}</h3>
          <p className="text-lg font-bold text-[#3483FA]">
            ${product.price.toLocaleString("es-AR")}
          </p>
          {product.seller && (
            <Badge variant="secondary" className="mt-2 text-xs">
              {product.seller.full_name}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="aspect-square bg-gray-200 rounded-lg mb-3 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
      </CardContent>
    </Card>
  )
}
