export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: "buyer" | "seller" | "admin";
          is_verified: boolean;
          document_type: string | null;
          document_number: string | null;
          tax_id: string | null;
          business_name: string | null;
          address: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: "buyer" | "seller" | "admin";
          is_verified?: boolean;
          document_type?: string | null;
          document_number?: string | null;
          tax_id?: string | null;
          business_name?: string | null;
          address?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: "buyer" | "seller" | "admin";
          is_verified?: boolean;
          document_type?: string | null;
          document_number?: string | null;
          tax_id?: string | null;
          business_name?: string | null;
          address?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
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
        };
        Insert: {
          id?: string;
          meli_id?: string | null;
          name: string;
          slug: string;
          parent_id?: string | null;
          icon?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          path?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meli_id?: string | null;
          name?: string;
          slug?: string;
          parent_id?: string | null;
          icon?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          path?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
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
          shipping_methods: Json;
          attributes: Json;
          meli_item_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          category_id?: string | null;
          title: string;
          slug: string;
          description?: string | null;
          condition?: "new" | "used" | "refurbished" | null;
          price: number;
          original_price?: number | null;
          currency?: string;
          stock?: number;
          sold_count?: number;
          view_count?: number;
          is_active?: boolean;
          is_promoted?: boolean;
          promoted_until?: string | null;
          shipping_free?: boolean;
          shipping_methods?: Json;
          attributes?: Json;
          meli_item_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          category_id?: string | null;
          title?: string;
          slug?: string;
          description?: string | null;
          condition?: "new" | "used" | "refurbished" | null;
          price?: number;
          original_price?: number | null;
          currency?: string;
          stock?: number;
          sold_count?: number;
          view_count?: number;
          is_active?: boolean;
          is_promoted?: boolean;
          promoted_until?: string | null;
          shipping_free?: boolean;
          shipping_methods?: Json;
          attributes?: Json;
          meli_item_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          thumbnail_url: string | null;
          alt: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          thumbnail_url?: string | null;
          alt?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          thumbnail_url?: string | null;
          alt?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          buyer_id: string;
          seller_id: string;
          status: "pending" | "paid" | "preparing" | "shipped" | "delivered" | "completed" | "cancelled" | "refunded";
          total_amount: number;
          shipping_cost: number;
          discount_amount: number;
          commission_amount: number;
          shipping_address: Json | null;
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
        };
        Insert: {
          id?: string;
          buyer_id: string;
          seller_id: string;
          status?: "pending" | "paid" | "preparing" | "shipped" | "delivered" | "completed" | "cancelled" | "refunded";
          total_amount: number;
          shipping_cost?: number;
          discount_amount?: number;
          commission_amount?: number;
          shipping_address?: Json | null;
          tracking_code?: string | null;
          tracking_url?: string | null;
          notes?: string | null;
          cancelled_reason?: string | null;
          cancelled_at?: string | null;
          paid_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          seller_id?: string;
          status?: "pending" | "paid" | "preparing" | "shipped" | "delivered" | "completed" | "cancelled" | "refunded";
          total_amount?: number;
          shipping_cost?: number;
          discount_amount?: number;
          commission_amount?: number;
          shipping_address?: Json | null;
          tracking_code?: string | null;
          tracking_url?: string | null;
          notes?: string | null;
          cancelled_reason?: string | null;
          cancelled_at?: string | null;
          paid_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscription_tiers: {
        Row: {
          id: string;
          tier_type: "free" | "plata" | "gold" | "platinum";
          name: string;
          description: string | null;
          price_ars: number;
          price_usd: number | null;
          commission_rate: number;
          features: Json;
          max_products: number | null;
          max_images_per_product: number;
          analytics_level: number;
          support_level: string;
          has_priority_search: boolean;
          monthly_promotions_included: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tier_type: "free" | "plata" | "gold" | "platinum";
          name: string;
          description?: string | null;
          price_ars: number;
          price_usd?: number | null;
          commission_rate?: number;
          features?: Json;
          max_products?: number | null;
          max_images_per_product?: number;
          analytics_level?: number;
          support_level?: string;
          has_priority_search?: boolean;
          monthly_promotions_included?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tier_type?: "free" | "plata" | "gold" | "platinum";
          name?: string;
          description?: string | null;
          price_ars?: number;
          price_usd?: number | null;
          commission_rate?: number;
          features?: Json;
          max_products?: number | null;
          max_images_per_product?: number;
          analytics_level?: number;
          support_level?: string;
          has_priority_search?: boolean;
          monthly_promotions_included?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier_id: string;
          status: "active" | "inactive" | "cancelled" | "expired";
          start_date: string;
          end_date: string;
          auto_renew: boolean;
          payment_method: "stripe" | "mercadopago" | "crypto" | null;
          external_subscription_id: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier_id: string;
          status?: "active" | "inactive" | "cancelled" | "expired";
          start_date: string;
          end_date: string;
          auto_renew?: boolean;
          payment_method?: "stripe" | "mercadopago" | "crypto" | null;
          external_subscription_id?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tier_id?: string;
          status?: "active" | "inactive" | "cancelled" | "expired";
          start_date?: string;
          end_date?: string;
          auto_renew?: boolean;
          payment_method?: "stripe" | "mercadopago" | "crypto" | null;
          external_subscription_id?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reputation_scores: {
        Row: {
          id: string;
          seller_id: string;
          color: "red" | "orange" | "yellow" | "light_green" | "dark_green";
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
        };
        Insert: {
          id?: string;
          seller_id: string;
          color?: "red" | "orange" | "yellow" | "light_green" | "dark_green";
          total_sales?: number;
          total_orders?: number;
          positive_reviews?: number;
          neutral_reviews?: number;
          negative_reviews?: number;
          claims_count?: number;
          claims_percentage?: number;
          delays_count?: number;
          delays_percentage?: number;
          cancellations_count?: number;
          cancellations_percentage?: number;
          average_rating?: number;
          last_calculated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          color?: "red" | "orange" | "yellow" | "light_green" | "dark_green";
          total_sales?: number;
          total_orders?: number;
          positive_reviews?: number;
          neutral_reviews?: number;
          negative_reviews?: number;
          claims_count?: number;
          claims_percentage?: number;
          delays_count?: number;
          delays_percentage?: number;
          cancellations_count?: number;
          cancellations_percentage?: number;
          average_rating?: number;
          last_calculated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
