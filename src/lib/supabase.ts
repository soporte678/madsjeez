import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Cliente browser sin `Database` generado: tipado laxo hasta migrar a tipos PostgREST reales. */
let _supabase: SupabaseClient<any> | null = null;

export function getSupabaseClient(): SupabaseClient<any> {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient<any>, {
  get(_target, prop) {
    const client = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as any)[prop];
  },
});

// Tipos para la base de datos
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          image: string | null
          role: 'USER' | 'SELLER' | 'ADMIN'
          subscription_tier: 'FREE' | 'PLATA' | 'GOLD' | 'PLATINUM'
          reputation_color: 'ROJO' | 'NARANJA' | 'AMARILLO' | 'VERDE' | 'VERDE_OSCURO'
          total_sales: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          image?: string | null
          role?: 'USER' | 'SELLER' | 'ADMIN'
          subscription_tier?: 'FREE' | 'PLATA' | 'GOLD' | 'PLATINUM'
          reputation_color?: 'ROJO' | 'NARANJA' | 'AMARILLO' | 'VERDE' | 'VERDE_OSCURO'
          total_sales?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          image?: string | null
          role?: 'USER' | 'SELLER' | 'ADMIN'
          subscription_tier?: 'FREE' | 'PLATA' | 'GOLD' | 'PLATINUM'
          reputation_color?: 'ROJO' | 'NARANJA' | 'AMARILLO' | 'VERDE' | 'VERDE_OSCURO'
          total_sales?: number
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          title: string
          description: string
          price: number
          category_id: string
          seller_id: string
          condition: 'NEW' | 'USED' | 'REACONDITIONED'
          stock: number
          status: 'ACTIVE' | 'PAUSED' | 'SOLD'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          price: number
          category_id: string
          seller_id: string
          condition?: 'NEW' | 'USED' | 'REACONDITIONED'
          stock?: number
          status?: 'ACTIVE' | 'PAUSED' | 'SOLD'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          price?: number
          category_id?: string
          seller_id?: string
          condition?: 'NEW' | 'USED' | 'REACONDITIONED'
          stock?: number
          status?: 'ACTIVE' | 'PAUSED' | 'SOLD'
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total: number
          status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
          shipping_address: string
          tracking_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total: number
          status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
          shipping_address: string
          tracking_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total?: number
          status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
          shipping_address?: string
          tracking_number?: string | null
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          product_id: string
          user_id: string
          question: string
          answer: string | null
          answered: boolean
          answered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          question: string
          answer?: string | null
          answered?: boolean
          answered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          question?: string
          answer?: string | null
          answered?: boolean
          answered_at?: string | null
          updated_at?: string
        }
      }
    }
  }
}

export type DatabaseType = Database
