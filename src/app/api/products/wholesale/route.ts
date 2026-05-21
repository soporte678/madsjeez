import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isMarketplaceAdminEmail } from "@/lib/admin-api"

interface WholesalePriceInput {
  min_quantity: number
  price: number
  label?: string
}

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function assertCanManageWholesalePrices(productId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    }
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true },
  })

  if (!product) {
    return {
      error: NextResponse.json({ error: "Producto no encontrado" }, { status: 404 }),
    }
  }

  const isAdmin = await isMarketplaceAdminEmail(session.user.email)
  if (!isAdmin && product.sellerId !== session.user.id) {
    return {
      error: NextResponse.json({ error: "No tienes permiso para modificar precios de este producto" }, { status: 403 }),
    }
  }

  return { session, product }
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

    const access = await assertCanManageWholesalePrices(productId)
    if (access.error) return access.error

    const supabase = getSupabaseClient()

    // Delete existing prices for this product
    await supabase
      .from("product_wholesale_prices")
      .delete()
      .eq("product_id", productId)

    // Insert new prices (max 10)
    const pricesToInsert = (prices as WholesalePriceInput[])
      .slice(0, 10)
      .filter((p) => p.min_quantity > 0 && p.price > 0)
      .map((p) => ({
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

    const access = await assertCanManageWholesalePrices(productId)
    if (access.error) return access.error

    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from("product_wholesale_prices")
      .delete()
      .eq("product_id", productId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
