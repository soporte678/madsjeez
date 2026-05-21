import { NextRequest, NextResponse } from "next/server"
import { requireAdminRequest } from "@/lib/admin-api"

export async function GET(request: NextRequest) {
  const admin = await requireAdminRequest(request)
  if (admin instanceof NextResponse) return admin

  const status = request.nextUrl.searchParams.get("status")
  const severity = request.nextUrl.searchParams.get("severity")
  const page = Math.max(Number(request.nextUrl.searchParams.get("page") ?? "1"), 1)
  const pageSize = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("pageSize") ?? "20"), 1),
    100
  )

  let query = admin.service.from("fraud_logs").select("*", { count: "exact" })
  if (status && status !== "all") query = query.eq("status", status)
  if (severity && severity !== "all") query = query.eq("severity", severity)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar los casos de fraude." },
      { status: 500 }
    )
  }

  const profileIds = Array.from(
    new Set(
      (data ?? [])
        .flatMap((row) => [row.user_id, row.reporter_id])
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  )

  let profilesById = new Map<string, { email?: string | null; name?: string | null; full_name?: string | null }>()
  if (profileIds.length > 0) {
    const { data: profiles } = await admin.service
      .from("profiles")
      .select("id, email, name, full_name")
      .in("id", profileIds)
    profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  }

  const items = (data ?? []).map((row) => {
    const userProfile = profilesById.get(row.user_id)
    const reporterProfile = profilesById.get(row.reporter_id)
    return {
      ...row,
      user_email: userProfile?.email ?? "",
      user_name: userProfile?.name ?? userProfile?.full_name ?? "",
      reporter_email: reporterProfile?.email ?? "",
    }
  })

  return NextResponse.json({ items, totalCount: count ?? 0 })
}
