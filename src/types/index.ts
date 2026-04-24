export type ReputationColor = "ROJO" | "NARANJA" | "AMARILLO" | "VERDE" | "VERDE_OSCURO"
export type SubscriptionTier = "FREE" | "PLATA" | "GOLD" | "PLATINUM"

export interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  isSeller: boolean
  sellerName: string | null
  sellerDescription: string | null
  sellerSince: Date | null
  reputationColor: ReputationColor
  totalSales: number
  successfulSales: number
  canceledSales: number
  delayedShipments: number
  claimRate: number
  subscriptionTier: SubscriptionTier
  subscriptionExpiry: Date | null
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  parentId: string | null
  children?: Category[]
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  comparePrice: number | null
  stock: number
  sku: string | null
  condition: string
  isActive: boolean
  isFeatured: boolean
  isBoosted: boolean
  boostExpiry: Date | null
  views: number
  sales: number
  sellerId: string
  seller: {
    id: string
    name: string | null
    sellerName: string | null
    reputationColor: ReputationColor
  }
  categoryId: string
  category: {
    id: string
    name: string
    slug: string
  }
  images: ProductImage[]
  attributes: ProductAttribute[]
  reviews: Review[]
  _count: {
    reviews: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface ProductImage {
  id: string
  url: string
  alt: string | null
  order: number
}

export interface ProductAttribute {
  id: string
  name: string
  value: string
}

export interface Review {
  id: string
  rating: number
  comment: string | null
  reviewer: {
    name: string | null
    image: string | null
  }
  createdAt: Date
}

export interface Order {
  id: string
  orderNumber: string
  status: string
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  shippingName: string
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  shippingPhone: string
  items: OrderItem[]
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: string
  quantity: number
  price: number
  product: Product
}

export interface Subscription {
  id: string
  tier: SubscriptionTier
  status: string
  price: number
  startDate: Date
  endDate: Date
  stripeId: string | null
}

export interface ProductBoost {
  id: string
  cost: number
  duration: number
  startDate: Date
  endDate: Date
  productId: string
  sellerId: string
}
