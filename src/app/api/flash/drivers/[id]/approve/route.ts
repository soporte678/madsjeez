import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/flash/drivers/[id]/approve — admin activa un transportista pendiente
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params

  const driver = await prisma.flashDriver.update({
    where: { id },
    data: { isActive: true },
    include: { user: { select: { name: true, email: true } } },
  })

  return NextResponse.json({ driver })
}

// DELETE /api/flash/drivers/[id]/approve — rechazar / desactivar transportista
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params

  await prisma.flashDriver.update({
    where: { id },
    data: { isActive: false },
  })

  return NextResponse.json({ ok: true })
}
