import Link from "next/link"
import Image from "next/image"
import { Package, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string
  title: string
  price: number
  images: { url: string }[]
  seller?: {
    id: string
    full_name: string
    sellerProvince?: string | null
    sellerLocality?: string | null
  }
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images?.[0]?.url

  return (
    <Link href={`/product/${product.id}`} className="marketplace-product-card group flex flex-col h-full">
      <div className="relative aspect-square bg-gradient-to-b from-slate-50 to-white">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            sizes="(max-width:768px) 50vw, (max-width:1200px) 33vw, 25vw"
            className="object-contain p-3 group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-8 w-8 text-slate-300" />
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-3.5 gap-1.5">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug min-h-[2.5rem] group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        <p className="text-lg font-bold text-primary mt-auto tracking-tight">
          ${product.price.toLocaleString("es-AR")}
        </p>
        {product.seller && (
          <Badge variant="secondary" className="mt-0.5 text-[11px] w-fit font-medium">
            {product.seller.full_name}
          </Badge>
        )}
        {(product.seller?.sellerLocality || product.seller?.sellerProvince) && (
          <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1 leading-tight">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {product.seller.sellerLocality
                ? `${product.seller.sellerLocality}${product.seller.sellerProvince ? `, ${product.seller.sellerProvince}` : ""}`
                : product.seller.sellerProvince}
            </span>
          </p>
        )}
      </div>
    </Link>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="marketplace-product-card flex flex-col overflow-hidden">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="p-3.5 flex flex-col gap-2">
        <div className="h-3 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
        <div className="h-5 bg-muted rounded w-1/2 animate-pulse mt-1" />
      </div>
    </div>
  )
}
