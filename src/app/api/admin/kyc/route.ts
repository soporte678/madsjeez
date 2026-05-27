import { NextRequest, NextResponse } from "next/server"
import { requireAdminRequest } from "@/lib/admin-api"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminRequest(request)
    if (admin instanceof NextResponse) return admin

    const status = request.nextUrl.searchParams.get("status")

    let query = admin.service.from("kyc_verifications").select("*")
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query.order("submitted_at", { ascending: false })
    if (error) {
      return NextResponse.json(
        { error: "No se pudieron cargar las verificaciones KYC." },
        { status: 500 }
      )
    }

    const userIds = Array.from(new Set((data ?? []).map((row) => row.user_id).filter(Boolean)))
    let profilesById = new Map<string, { email?: string | null; name?: string | null; full_name?: string | null }>()

    if (userIds.length > 0) {
      const { data: profiles } = await admin.service
        .from("profiles")
        .select("id, email, name, full_name")
        .in("id", userIds)

      profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
    }

    const items = (data ?? []).map((row) => {
      const profile = profilesById.get(row.user_id)
      return {
        ...row,
        user_email: profile?.email ?? "",
        user_name: profile?.name ?? profile?.full_name ?? "",
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    logger.error("admin/kyc GET error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
