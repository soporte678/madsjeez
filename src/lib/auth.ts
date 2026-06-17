import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { getProfileUuidByEmail } from "./supabase-profile-map"
import { logger } from "./logger"

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

/**
 * Cookies de NextAuth deben compartirse entre www y apex para evitar:
 * - OAuth callback: "State cookie was missing"
 * - Login exitoso pero sesión perdida al volver (loop al login)
 */
function useSecureAuthCookies(): boolean {
  const url = process.env.NEXTAUTH_URL ?? ""
  if (url.startsWith("https://")) return true
  if (process.env.VERCEL) return true
  return process.env.NODE_ENV === "production"
}

function deriveCookieDomain(): string | null {
  const explicit = process.env.NEXTAUTH_COOKIE_DOMAIN?.trim()
  if (explicit) return explicit.startsWith(".") ? explicit : `.${explicit}`

  const raw = process.env.NEXTAUTH_URL?.trim()
  if (!raw) return null
  try {
    const host = new URL(raw).hostname.toLowerCase()
    if (host === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null
    const parts = host.split(".")
    if (parts.length < 2) return null
    // TLD compuesto frecuente en AR: .com.ar
    if (host.endsWith(".com.ar") && parts.length >= 3) {
      return `.${parts.slice(-3).join(".")}`
    }
    return `.${parts.slice(-2).join(".")}`
  } catch {
    return null
  }
}

function buildAuthCookies(): NextAuthOptions["cookies"] | undefined {
  const domain = deriveCookieDomain()
  if (!domain) return undefined

  const secure = useSecureAuthCookies()
  const prefix = secure ? "__Secure-" : ""
  const csrfName = secure ? "__Secure-next-auth.csrf-token" : "next-auth.csrf-token"
  const sessionMaxAge = 30 * 24 * 60 * 60

  const common = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure,
    domain,
  }

  return {
    sessionToken: {
      name: `${prefix}next-auth.session-token`,
      options: {
        ...common,
        maxAge: sessionMaxAge,
      },
    },
    callbackUrl: {
      name: `${prefix}next-auth.callback-url`,
      options: common,
    },
    csrfToken: {
      name: csrfName,
      options: common,
    },
    state: {
      name: `${prefix}next-auth.state`,
      options: {
        ...common,
        maxAge: 60 * 15,
      },
    },
    pkceCodeVerifier: {
      name: `${prefix}next-auth.pkce.code_verifier`,
      options: {
        ...common,
        maxAge: 60 * 15,
      },
    },
    nonce: {
      name: `${prefix}next-auth.nonce`,
      options: common,
    },
  }
}

const sharedAuthCookies = buildAuthCookies()

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.trim().toLowerCase()
        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          isSeller: user.isSeller,
          subscriptionTier: user.subscriptionTier,
          reputationColor: user.reputationColor,
        }
      }
    }),
    ...(googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            authorization: {
              params: {
                // No usar prompt: "consent" en cada login: Google mostraría la validación
                // como si fuera siempre el primer acceso. El consentimiento se pide la primera vez.
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),
  ],
  ...(sharedAuthCookies ? { cookies: sharedAuthCookies } : {}),
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      logger.info("signIn callback called", { provider: account?.provider, email: user.email })
      
      // Si es login con Google, crear/actualizar usuario en la base de datos
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            logger.info("Creating new user for:", user.email)
            // Crear nuevo usuario con Google
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || "Usuario Google",
                image: user.image,
                role: "USER",
                isSeller: false,
                subscriptionTier: "FREE",
                emailVerified: new Date(),
                reputationColor: "VERDE",
              }
            })
            logger.info("Usuario creado exitosamente:", newUser.id)
          } else {
            logger.info("Usuario existente:", existingUser.id)
            // Actualizar imagen si cambió
            if (user.image && existingUser.image !== user.image) {
              await prisma.user.update({
                where: { email: user.email! },
                data: { image: user.image }
              })
            }
          }
        } catch (error: any) {
          console.error("Error CRITICO en signIn callback:", error.message, error.stack)
          // No bloqueamos el login si hay error en DB
        }
      }

      // Sincroniza SIEMPRE el perfil en Supabase para no bloquear checkout MP.
      if (user.email) {
        try {
          const profileId = await getProfileUuidByEmail(user.email)
          if (!profileId) {
            console.warn("[auth.signIn] Supabase profile no disponible para:", user.email)
          }
        } catch (e) {
          console.error("[auth.signIn] error sincronizando perfil Supabase:", e)
        }
      }
      return true
    },
    async jwt({ token, user, account, trigger }) {
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
        })
        if (dbUser) {
          if (trigger === "signIn" || !token.id) {
            token.id = dbUser.id
            token.subscriptionTier = dbUser.subscriptionTier
            token.reputationColor = dbUser.reputationColor
            token.name = dbUser.name
            token.image = dbUser.image
          }
          // Siempre refrescar roles/permisos críticos en cada validación de token:
          token.role = dbUser.role
          token.isSeller = dbUser.isSeller
          token.hasAccessKey = !!dbUser.accessKey
          const driver = await prisma.flashDriver.findUnique({
            where: { userId: dbUser.id },
            select: { isActive: true },
          })
          token.isDriver = !!driver?.isActive
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.isSeller = token.isSeller as boolean
        session.user.subscriptionTier = token.subscriptionTier as string
        session.user.reputationColor = token.reputationColor as string
        session.user.hasAccessKey = token.hasAccessKey as boolean
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/login",
  }
}
