import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/products/wholesale?productId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("product_wholesale_prices")
      .select("*")
      .eq("product_id", productId)
      .order("min_quantity", { ascending: true })

    if (error) {
      console.error("Error fetching wholesale prices:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ prices: data || [] })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/products/wholesale - Create/update wholesale prices
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, prices } = body

    if (!productId || !Array.isArray(prices)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Delete existing prices for this product
    await supabase
      .from("product_wholesale_prices")
      .delete()
      .eq("product_id", productId)

    // Insert new prices (max 10)
    const pricesToInsert = prices
      .slice(0, 10)
      .filter((p: any) => p.min_quantity > 0 && p.price > 0)
      .map((p: any) => ({
        product_id: productId,
        min_quantity: p.min_quantity,
        price: p.price,
        label: p.label || `x${p.min_quantity}`,
      }))

    if (pricesToInsert.length === 0) {
      return NextResponse.json({ success: true, prices: [] })
    }

    const { data, error } = await supabase
      .from("product_wholesale_prices")
      .insert(pricesToInsert)
      .select()

    if (error) {
      console.error("Error inserting wholesale prices:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, prices: data })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/products/wholesale?productId=xxx
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from("product_wholesale_prices")
      .delete()
      .eq("product_id", productId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
