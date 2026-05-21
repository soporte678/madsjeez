import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  adminActorId,
  adminJson,
  requireAdminRequest,
  type AdminRequestContext,
} from "@/lib/admin-api"

export { adminActorId, adminJson, type AdminRequestContext }

/** Panel /admin — único gate de administración del marketplace. */
export async function requireFlashAdmin(
  request: NextRequest
): Promise<AdminRequestContext | NextResponse> {
  return requireAdminRequest(request)
}

export async function requireFlashUser(): Promise<
  { userId: string; email: string | null } | NextResponse
> {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  return {
    userId,
    email: session?.user?.email ?? null,
  }
}

export async function requireFlashDriver(): Promise<
  | { userId: string; driverId: string; driver: { id: string; isActive: boolean } }
  | NextResponse
> {
  const auth = await requireFlashUser()
  if (auth instanceof NextResponse) return auth

  const driver = await prisma.flashDriver.findUnique({
    where: { userId: auth.userId },
    select: { id: true, isActive: true },
  })

  if (!driver?.isActive) {
    return NextResponse.json(
      { error: "No tenés acceso como transportista Flash activo" },
      { status: 403 }
    )
  }

  return { userId: auth.userId, driverId: driver.id, driver }
}
