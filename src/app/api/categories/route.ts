import { NextResponse } from "next/server"
import { getCategoryCatalog } from "@/lib/categoryCatalog"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    return NextResponse.json(await getCategoryCatalog())
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}
