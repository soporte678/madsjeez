import { NextRequest, NextResponse } from "next/server"
import { requireAdminRequest } from "@/lib/admin-api"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminRequest(request)
  if (admin instanceof NextResponse) return admin

  const { id } = await params
  const body = await request.json().catch(() => null)
  const status = body?.status
  const notes =
    typeof body?.resolution_notes === "string" ? body.resolution_notes.trim() : null

  if (!["open", "investigating", "resolved", "false_positive"].includes(status)) {
    return NextResponse.json({ error: "Estado invalido" }, { status: 400 })
  }

  const payload = {
    status,
    resolution_notes: notes,
    resolved_at: status === "resolved" ? new Date().toISOString() : null,
    assigned_to: admin.user.id,
  }

  const { data, error } = await admin.service
    .from("fraud_logs")
    .update(payload)
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(
      { error: "No se pudo actualizar el caso." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
