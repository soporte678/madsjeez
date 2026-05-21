import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminJson, requireFlashAdmin } from "@/lib/flash/auth"
import {
  DEFAULT_FLASH_RATE_SETTINGS,
  ensureFlashRateConfig,
  type FlashRateSettings,
} from "@/lib/flash/rate-config"

export async function GET(req: NextRequest) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  await ensureFlashRateConfig()
  const config = await prisma.flashRateConfig.findUnique({ where: { id: "default" } })

  return adminJson(admin, {
    config: config ?? {
      id: "default",
      settings: DEFAULT_FLASH_RATE_SETTINGS,
      currency: "ARS",
    },
    defaults: DEFAULT_FLASH_RATE_SETTINGS,
  })
}

export async function PUT(req: NextRequest) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  let body: { settings?: Partial<FlashRateSettings>; label?: string }
  try {
    body = await req.json()
  } catch {
    return adminJson(admin, { error: "JSON inválido" }, { status: 400 })
  }

  await ensureFlashRateConfig()
  const current = await prisma.flashRateConfig.findUnique({ where: { id: "default" } })
  const merged = {
    ...DEFAULT_FLASH_RATE_SETTINGS,
    ...(current?.settings as FlashRateSettings),
    ...body.settings,
  }

  const config = await prisma.flashRateConfig.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      label: body.label ?? "Tarifas Flash Argentina",
      currency: "ARS",
      settings: merged,
      updatedBy: admin.adminUser.email ?? undefined,
    },
    update: {
      settings: merged,
      label: body.label,
      updatedBy: admin.adminUser.email ?? undefined,
    },
  })

  return adminJson(admin, { config })
}
