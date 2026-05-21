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
  const rejectionReason =
    typeof body?.rejection_reason === "string" ? body.rejection_reason.trim() : null

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Estado invalido" }, { status: 400 })
  }

  if (status === "rejected" && !rejectionReason) {
    return NextResponse.json(
      { error: "Debes indicar un motivo de rechazo." },
      { status: 400 }
    )
  }

  const payload = {
    status,
    rejection_reason: status === "rejected" ? rejectionReason : null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: admin.user.id,
  }

  const { data, error } = await admin.service
    .from("kyc_verifications")
    .update(payload)
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(
      { error: "No se pudo actualizar la verificacion." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
