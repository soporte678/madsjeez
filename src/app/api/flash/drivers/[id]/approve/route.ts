import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminJson, requireFlashAdmin } from "@/lib/flash/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  const { id } = await params

  const driver = await prisma.flashDriver.update({
    where: { id },
    data: { isActive: true },
    include: { user: { select: { name: true, email: true } } },
  })

  return adminJson(admin, { driver })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  const { id } = await params

  await prisma.flashDriver.update({
    where: { id },
    data: { isActive: false },
  })

  return adminJson(admin, { ok: true })
}
