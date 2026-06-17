import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export const ADMIN_SESSION_COOKIE = "mz_admin_session"
const ADMIN_SESSION_TTL_DAYS = 30

export function generateAdminSessionToken() {
  return crypto.randomBytes(32).toString("hex")
}

export function hashAdminSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function getAdminSessionExpiryDate() {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + ADMIN_SESSION_TTL_DAYS)
  return expiresAt
}

export function getAdminSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  }
}

export function getRequestIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null
  }

  return headers.get("x-real-ip") || null
}

export async function createAdminSession(params: {
  adminUserId: string
  userId: string
  email: string
  userAgent?: string | null
  ipAddress?: string | null
}) {
  const now = new Date()

  const existingSession = await prisma.adminSession.findFirst({
    where: {
      adminUserId: params.adminUserId,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  })

  if (existingSession) {
    return { ok: false as const }
  }

  const rawToken = generateAdminSessionToken()
  const expiresAt = getAdminSessionExpiryDate()

  await prisma.adminSession.create({
    data: {
      adminUserId: params.adminUserId,
      userId: params.userId,
      email: params.email,
      sessionTokenHash: hashAdminSessionToken(rawToken),
      userAgent: params.userAgent || null,
      ipAddress: params.ipAddress || null,
      expiresAt,
    },
  })

  return { ok: true as const, rawToken, expiresAt }
}

export async function verifyAdminSession(params: {
  rawToken?: string | null
  adminUserId: string
  userId: string
}) {
  if (!params.rawToken) return null

  const now = new Date()
  return prisma.adminSession.findFirst({
    where: {
      sessionTokenHash: hashAdminSessionToken(params.rawToken),
      adminUserId: params.adminUserId,
      userId: params.userId,
      revokedAt: null,
      expiresAt: { gt: now },
    },
  })
}

export async function touchAdminSession(rawToken: string) {
  const expiresAt = getAdminSessionExpiryDate()
  await prisma.adminSession.updateMany({
    where: {
      sessionTokenHash: hashAdminSessionToken(rawToken),
      revokedAt: null,
    },
    data: {
      lastSeenAt: new Date(),
      expiresAt,
    },
  })

  return expiresAt
}

export async function revokeAdminSession(rawToken?: string | null) {
  if (!rawToken) return

  await prisma.adminSession.updateMany({
    where: {
      sessionTokenHash: hashAdminSessionToken(rawToken),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  })
}
