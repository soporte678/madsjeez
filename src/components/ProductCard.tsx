"use client"

import Link from "next/link"
import Image from "next/image"
import { Heart, Truck, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ProductCardProps {
  id: string
  title: string
  price: number
  originalPrice?: number | null
  image: string
  seller: string
  rating: number
  sales: number
  freeShipping?: boolean
  discount?: string
  installments?: string
}

export function ProductCard({
  id,
  title,
  price,
  originalPrice,
  image,
  seller,
  rating,
  sales,
  freeShipping,
  discount,
  installments
}: ProductCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const discountPercentage = originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 overflow-hidden group">
      <div className="relative">
        <Link href={`/products/${id}`}>
          <div className="relative h-48 w-full overflow-hidden bg-gray-50">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          </div>
        </Link>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discountPercentage > 0 && (
            <Badge className="bg-orange-500 text-white px-2 py-1 text-xs font-bold">
              {discountPercentage}% OFF
            </Badge>
          )}
          {freeShipping && (
            <Badge className="bg-green-600 text-white px-2 py-1 text-xs font-bold">
              Envío gratis
            </Badge>
          )}
        </div>
        
        {/* Botón de favoritos */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">{seller}</div>
            <Link href={`/products/${id}`}>
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer">
                {title}
              </h3>
            </Link>
          </div>
        </div>
        
        {/* Rating y ventas */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(rating) 
                    ? 'text-primary fill-primary' 
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-xs text-gray-600 ml-1">({rating})</span>
          </div>
          <span className="text-xs text-gray-500">|</span>
          <span className="text-xs text-gray-500">{sales} vendidos</span>
        </div>
        
        {/* Precios */}
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(price)}
            </span>
            {originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>
          {installments && (
            <div className="text-xs text-green-600 font-medium">
              {installments} sin interés
            </div>
          )}
        </div>
        
        {/* Envío */}
        {freeShipping && (
          <div className="flex items-center gap-1 text-xs text-green-600 mb-3">
            <Truck className="w-3 h-3" />
            <span>Envío gratis</span>
          </div>
        )}
        
        {/* Botón de compra */}
        <Button className="w-full bg-primary hover:bg-primary-hover text-sm py-2">
          Comprar ahora
        </Button>
      </div>
    </div>
  )
}
