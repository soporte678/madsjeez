import { NextRequest, NextResponse } from "next/server"
import { requireAdminRequest } from "@/lib/admin-api"

type LogSeverity = "info" | "warning" | "error" | "critical"

function normalizeSeverity(value: unknown): LogSeverity {
  if (value === "warning" || value === "error" || value === "critical") return value
  return "info"
}

export async function GET(request: NextRequest) {
  const admin = await requireAdminRequest(request)
  if (admin instanceof NextResponse) return admin

  const severity = request.nextUrl.searchParams.get("severity") ?? "all"
  const entityType = request.nextUrl.searchParams.get("entityType") ?? "all"
  const page = Math.max(Number(request.nextUrl.searchParams.get("page") ?? "1"), 1)
  const pageSize = Math.min(Math.max(Number(request.nextUrl.searchParams.get("pageSize") ?? "50"), 1), 100)

  let query = admin.service
    .from("admin_audit_logs")
    .select("id, admin_user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at", {
      count: "exact",
    })

  if (entityType !== "all") query = query.eq("entity_type", entityType)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to)

  if (error) {
    return NextResponse.json({ error: "No se pudieron cargar los logs." }, { status: 500 })
  }

  const adminIds = Array.from(
    new Set(
      (data ?? [])
        .map((row) => row.admin_user_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  )

  let adminsById = new Map<string, { email?: string | null; first_name?: string | null; last_name?: string | null }>()
  if (adminIds.length > 0) {
    const { data: admins } = await admin.service
      .from("admin_users")
      .select("id, email, first_name, last_name")
      .in("id", adminIds)

    adminsById = new Map((admins ?? []).map((entry) => [entry.id, entry]))
  }

  const items = (data ?? [])
    .map((row) => {
      const details =
        row.details && typeof row.details === "object" && !Array.isArray(row.details)
          ? (row.details as Record<string, unknown>)
          : null
      const adminEntry = row.admin_user_id ? adminsById.get(row.admin_user_id) : null
      return {
        ...row,
        user_email: adminEntry?.email ?? null,
        user_name: [adminEntry?.first_name, adminEntry?.last_name].filter(Boolean).join(" ").trim() || null,
        severity: normalizeSeverity(details?.severity),
      }
    })
    .filter((row) => severity === "all" || row.severity === severity)

  return NextResponse.json({ items, totalCount: severity === "all" ? count ?? 0 : items.length })
}
