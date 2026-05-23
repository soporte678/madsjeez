import Link from "next/link"
import Image from "next/image"
import { Package } from "lucide-react"
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
  const imageUrl = product.images?.[0]?.url

  return (
    <Link href={`/product/${product.id}`}>
      <div className="group flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#3483FA]/40 transition-all duration-200 overflow-hidden">
        <div className="relative aspect-square bg-slate-50">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              sizes="(max-width:768px) 50vw, (max-width:1200px) 33vw, 25vw"
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-8 w-8 text-slate-300" />
            </div>
          )}
        </div>
        <div className="flex flex-col flex-1 p-3 gap-1">
          <h3 className="text-xs font-medium text-slate-700 line-clamp-2 leading-snug min-h-[32px]">
            {product.title}
          </h3>
          <p className="text-base font-bold text-[#3483FA] mt-auto">
            ${product.price.toLocaleString("es-AR")}
          </p>
          {product.seller && (
            <Badge variant="secondary" className="mt-1 text-xs w-fit">
              {product.seller.full_name}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="aspect-square bg-slate-100 animate-pulse" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 bg-slate-100 rounded animate-pulse" />
        <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse mt-1" />
      </div>
    </div>
  )
}
