// ============================================
// TIPOS DE LA APLICACIÓN MADSJEEZ
// ============================================

export type UserRole = "buyer" | "seller" | "admin";

export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

export type SubscriptionTierType = "free" | "plata" | "gold" | "platinum";

export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "expired";

export type ReputationColor = "red" | "orange" | "yellow" | "light_green" | "dark_green";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type PaymentMethod = "stripe" | "mercadopago" | "crypto";

// ============================================
// INTERFACES
// ============================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  is_verified: boolean;
  document_type: string | null;
  document_number: string | null;
  tax_id: string | null;
  business_name: string | null;
  address: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  meli_id: string | null;
  name: string;
  slug: string;
  parent_id: string | null;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  path: string;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface Product {
  id: string;
  seller_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  condition: "new" | "used" | "refurbished" | null;
  price: number;
  original_price: number | null;
  currency: string;
  stock: number;
  sold_count: number;
  view_count: number;
  is_active: boolean;
  is_promoted: boolean;
  promoted_until: string | null;
  shipping_free: boolean;
  shipping_methods: Record<string, unknown>[];
  attributes: Record<string, unknown>;
  meli_item_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  thumbnail_url: string | null;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_cost: number;
  discount_amount: number;
  commission_amount: number;
  shipping_address: Record<string, unknown> | null;
  tracking_code: string | null;
  tracking_url: string | null;
  notes: string | null;
  cancelled_reason: string | null;
  cancelled_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  commission_rate: number;
  commission_amount: number;
  product?: Product;
}

export interface SubscriptionTier {
  id: string;
  tier_type: SubscriptionTierType;
  name: string;
  description: string | null;
  price_ars: number;
  price_usd: number | null;
  commission_rate: number;
  features: string[];
  max_products: number | null;
  max_images_per_product: number;
  analytics_level: number;
  support_level: string;
  has_priority_search: boolean;
  monthly_promotions_included: number;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  payment_method: PaymentMethod | null;
  external_subscription_id: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  tier?: SubscriptionTier;
}

export interface ReputationScore {
  id: string;
  seller_id: string;
  color: ReputationColor;
  total_sales: number;
  total_orders: number;
  positive_reviews: number;
  neutral_reviews: number;
  negative_reviews: number;
  claims_count: number;
  claims_percentage: number;
  delays_count: number;
  delays_percentage: number;
  cancellations_count: number;
  cancellations_percentage: number;
  average_rating: number;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  reviewer_id: string;
  seller_id: string;
  product_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_positive: boolean;
  is_claim: boolean;
  claim_reason: string | null;
  claim_resolved_at: string | null;
  is_delay: boolean;
  delay_days: number | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  reviewer?: Profile;
  product?: Product;
}

export interface PromotedProduct {
  id: string;
  product_id: string;
  seller_id: string;
  base_price: number;
  multiplier: number;
  final_price: number;
  start_date: string;
  end_date: string;
  payment_status: PaymentStatus;
  payment_transaction_id: string | null;
  impressions: number;
  clicks: number;
  created_at: string;
  product?: Product;
}

export interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string | null;
  order_id: string | null;
  last_message_at: string | null;
  buyer_unread_count: number;
  seller_unread_count: number;
  is_active: boolean;
  created_at: string;
  buyer?: Profile;
  seller?: Profile;
  product?: Product;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments: Record<string, unknown>[];
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender?: Profile;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  type: "subscription" | "promotion" | "order";
  reference_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod | null;
  status: PaymentStatus;
  external_payment_id: string | null;
  external_payment_url: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  refund_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================
// TIPOS DE FORMULARIOS
// ============================================

export interface CreateProductInput {
  title: string;
  description: string;
  condition: "new" | "used" | "refurbished";
  price: number;
  original_price?: number;
  stock: number;
  category_id: string;
  shipping_free: boolean;
  attributes: Record<string, string>;
  images?: File[];
}

export interface CreateOrderInput {
  seller_id: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  notes?: string;
}

export interface CreateReviewInput {
  order_id: string;
  rating: number;
  title?: string;
  comment: string;
  is_claim: boolean;
  claim_reason?: string;
  is_delay: boolean;
  delay_days?: number;
}

// ============================================
// TIPOS DE API
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
  } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SearchFilters {
  query?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  condition?: "new" | "used" | "refurbished";
  seller_id?: string;
  is_promoted?: boolean;
  sort_by?: "relevance" | "price_asc" | "price_desc" | "newest";
}
