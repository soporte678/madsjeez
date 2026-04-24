import { z } from "zod";

// ============================================
// ENUMS
// ============================================

export const UserRoleEnum = z.enum(["buyer", "seller", "admin"]);
export const OrderStatusEnum = z.enum([
  "pending",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "refunded",
]);
export const SubscriptionTierEnum = z.enum([
  "free",
  "plata",
  "gold",
  "platinum",
]);
export const SubscriptionStatusEnum = z.enum([
  "active",
  "inactive",
  "cancelled",
  "expired",
]);
export const ReputationColorEnum = z.enum([
  "red",
  "orange",
  "yellow",
  "light_green",
  "dark_green",
]);
export const PaymentStatusEnum = z.enum([
  "pending",
  "completed",
  "failed",
  "refunded",
]);
export const PaymentMethodEnum = z.enum(["stripe", "mercadopago", "crypto"]);

// ============================================
// TIPOS BASE
// ============================================

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  phone: z.string().nullable(),
  role: UserRoleEnum,
  is_verified: z.boolean(),
  document_type: z.string().nullable(),
  document_number: z.string().nullable(),
  tax_id: z.string().nullable(),
  business_name: z.string().nullable(),
  address: z.record(z.any()).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CategorySchema = z.object({
  id: z.string().uuid(),
  meli_id: z.string().nullable(),
  name: z.string(),
  slug: z.string(),
  parent_id: z.string().uuid().nullable(),
  icon: z.string().nullable(),
  image_url: z.string().nullable(),
  is_active: z.boolean(),
  sort_order: z.number(),
  path: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  seller_id: z.string().uuid(),
  category_id: z.string().uuid().nullable(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  condition: z.enum(["new", "used", "refurbished"]).nullable(),
  price: z.number(),
  original_price: z.number().nullable(),
  currency: z.string(),
  stock: z.number(),
  sold_count: z.number(),
  view_count: z.number(),
  is_active: z.boolean(),
  is_promoted: z.boolean(),
  promoted_until: z.string().datetime().nullable(),
  shipping_free: z.boolean(),
  shipping_methods: z.array(z.record(z.any())),
  attributes: z.record(z.any()),
  meli_item_id: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ProductImageSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  url: z.string(),
  thumbnail_url: z.string().nullable(),
  alt: z.string().nullable(),
  sort_order: z.number(),
  is_primary: z.boolean(),
  created_at: z.string().datetime(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  status: OrderStatusEnum,
  total_amount: z.number(),
  shipping_cost: z.number(),
  discount_amount: z.number(),
  commission_amount: z.number(),
  shipping_address: z.record(z.any()).nullable(),
  tracking_code: z.string().nullable(),
  tracking_url: z.string().nullable(),
  notes: z.string().nullable(),
  cancelled_reason: z.string().nullable(),
  cancelled_at: z.string().datetime().nullable(),
  paid_at: z.string().datetime().nullable(),
  shipped_at: z.string().datetime().nullable(),
  delivered_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number(),
  unit_price: z.number(),
  total_price: z.number(),
  commission_rate: z.number(),
  commission_amount: z.number(),
});

// ============================================
// SUSCRIPCIONES
// ============================================

export const SubscriptionTierSchema = z.object({
  id: z.string().uuid(),
  tier_type: SubscriptionTierEnum,
  name: z.string(),
  description: z.string().nullable(),
  price_ars: z.number(),
  price_usd: z.number().nullable(),
  commission_rate: z.number(),
  features: z.array(z.string()),
  max_products: z.number().nullable(),
  max_images_per_product: z.number(),
  analytics_level: z.number(),
  support_level: z.string(),
  has_priority_search: z.boolean(),
  monthly_promotions_included: z.number(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
});

export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  tier_id: z.string().uuid(),
  status: SubscriptionStatusEnum,
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  auto_renew: z.boolean(),
  payment_method: PaymentMethodEnum.nullable(),
  external_subscription_id: z.string().nullable(),
  cancelled_at: z.string().datetime().nullable(),
  cancellation_reason: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ============================================
// REPUTACIÓN
// ============================================

export const ReputationScoreSchema = z.object({
  id: z.string().uuid(),
  seller_id: z.string().uuid(),
  color: ReputationColorEnum,
  total_sales: z.number(),
  total_orders: z.number(),
  positive_reviews: z.number(),
  neutral_reviews: z.number(),
  negative_reviews: z.number(),
  claims_count: z.number(),
  claims_percentage: z.number(),
  delays_count: z.number(),
  delays_percentage: z.number(),
  cancellations_count: z.number(),
  cancellations_percentage: z.number(),
  average_rating: z.number(),
  last_calculated_at: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  product_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  title: z.string().nullable(),
  comment: z.string().nullable(),
  is_positive: z.boolean(),
  is_claim: z.boolean(),
  claim_reason: z.string().nullable(),
  claim_resolved_at: z.string().datetime().nullable(),
  is_delay: z.boolean(),
  delay_days: z.number().nullable(),
  is_visible: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ============================================
// PROMOCIONES
// ============================================

export const PromotedProductSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  base_price: z.number(),
  multiplier: z.number(),
  final_price: z.number(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  payment_status: PaymentStatusEnum,
  payment_transaction_id: z.string().uuid().nullable(),
  impressions: z.number(),
  clicks: z.number(),
  created_at: z.string().datetime(),
});

// ============================================
// MENSAJERÍA
// ============================================

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  product_id: z.string().uuid().nullable(),
  order_id: z.string().uuid().nullable(),
  last_message_at: z.string().datetime().nullable(),
  buyer_unread_count: z.number(),
  seller_unread_count: z.number(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
});

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  content: z.string(),
  attachments: z.array(z.record(z.any())),
  is_read: z.boolean(),
  read_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

// ============================================
// PAGOS
// ============================================

export const PaymentTransactionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.enum(["subscription", "promotion", "order"]),
  reference_id: z.string().uuid(),
  amount: z.number(),
  currency: z.string(),
  payment_method: PaymentMethodEnum.nullable(),
  status: PaymentStatusEnum,
  external_payment_id: z.string().nullable(),
  external_payment_url: z.string().nullable(),
  paid_at: z.string().datetime().nullable(),
  refunded_at: z.string().datetime().nullable(),
  refund_reason: z.string().nullable(),
  metadata: z.record(z.any()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ============================================
// TIPOS DERIVADOS
// ============================================

export type Profile = z.infer<typeof ProfileSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ProductImage = z.infer<typeof ProductImageSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
export type ReputationScore = z.infer<typeof ReputationScoreSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type PromotedProduct = z.infer<typeof PromotedProductSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type PaymentTransaction = z.infer<typeof PaymentTransactionSchema>;

export type UserRole = z.infer<typeof UserRoleEnum>;
export type OrderStatus = z.infer<typeof OrderStatusEnum>;
export type SubscriptionTierType = z.infer<typeof SubscriptionTierEnum>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;
export type ReputationColor = z.infer<typeof ReputationColorEnum>;
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

// ============================================
// TIPOS DE FORMULARIOS
// ============================================

export const CreateProductSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  condition: z.enum(["new", "used", "refurbished"]),
  price: z.number().positive(),
  original_price: z.number().positive().optional(),
  stock: z.number().int().min(0),
  category_id: z.string().uuid(),
  shipping_free: z.boolean().default(false),
  attributes: z.record(z.string()).default({}),
});

export const CreateOrderSchema = z.object({
  seller_id: z.string().uuid(),
  items: z.array(
    z.object({
      product_id: z.string().uuid(),
      quantity: z.number().int().min(1),
    })
  ),
  shipping_address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string().default("Argentina"),
  }),
  notes: z.string().optional(),
});

export const CreateReviewSchema = z.object({
  order_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(100).optional(),
  comment: z.string().min(10).max(1000),
  is_claim: z.boolean().default(false),
  claim_reason: z.string().optional(),
  is_delay: z.boolean().default(false),
  delay_days: z.number().int().optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
