import Link from "next/link";
import Image from "next/image";
import { Heart, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReputationBadge } from "@/components/seller/ReputationBadge";
import type { Product, ReputationColor } from "@/types";

interface ProductCardProps {
  product: Product & {
    primary_image?: string | null;
    seller_reputation?: ReputationColor;
    seller_name?: string;
  };
  showReputation?: boolean;
}

export function ProductCard({ product, showReputation = true }: ProductCardProps) {
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  return (
    <div className="group bg-white rounded-lg border hover:shadow-lg transition-shadow duration-200">
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          {product.primary_image ? (
            <Image
              src={product.primary_image}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400">Sin imagen</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_promoted && (
              <Badge className="bg-[#FEE500] text-[#333333] hover:bg-[#FEE500]">
                DESTACADO
              </Badge>
            )}
            {hasDiscount && (
              <Badge className="bg-green-500 text-white hover:bg-green-500">
                {discountPercentage}% OFF
              </Badge>
            )}
            {product.condition === "new" && (
              <Badge variant="secondary">Nuevo</Badge>
            )}
          </div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
            onClick={(e) => {
              e.preventDefault();
              // TODO: Add to favorites
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>

          {/* Free Shipping Badge */}
          {product.shipping_free && (
            <div className="absolute bottom-2 left-2">
              <Badge
                variant="secondary"
                className="flex items-center gap-1 bg-green-100 text-green-700"
              >
                <Truck className="h-3 w-3" />
                Envío gratis
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <div className="p-3">
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-sm text-gray-700 line-clamp-2 mb-1 hover:text-[#3483FA]">
            {product.title}
          </h3>
        </Link>

        {/* Price */}
        <div className="mb-2">
          {hasDiscount && (
            <p className="text-sm text-gray-400 line-through">
              ${product.original_price?.toLocaleString()}
            </p>
          )}
          <p className="text-xl font-medium text-[#333333]">
            ${product.price.toLocaleString()}
          </p>
          <p className="text-xs text-green-600">
            en {product.price >= 50000 ? "6" : "12"} cuotas de ${Math.round(product.price / (product.price >= 50000 ? 6 : 12)).toLocaleString()}
          </p>
        </div>

        {/* Seller Info */}
        {showReputation && product.seller_reputation && (
          <div className="flex items-center justify-between">
            <ReputationBadge
              color={product.seller_reputation}
              size="sm"
              showLabel={false}
            />
            {product.seller_name && (
              <span className="text-xs text-gray-500 truncate max-w-[100px]">
                {product.seller_name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Versión skeleton para loading states
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border animate-pulse">
      <div className="aspect-square bg-gray-200 rounded-t-lg" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}
