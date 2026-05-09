import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { getProfileUuidByEmail } from "./supabase-profile-map"

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

/**
 * Cookies OAuth (state + pkce) deben persistir entre redirect a Google y el callback.
 * Si NEXTAUTH_URL usa apex pero el usuario entra por www (o al revés), el navegador no envía
 * cookies host-only → "State cookie was missing". Solución: misma URL canónica en NEXTAUTH_URL
 * o NEXTAUTH_COOKIE_DOMAIN=.tudominio.com para compartir cookie entre subdominios.
 */
function oauthCookieDomain(): { domain?: string } {
  const raw = process.env.NEXTAUTH_COOKIE_DOMAIN?.trim()
  if (!raw) return {}
  const domain = raw.startsWith(".") ? raw : `.${raw}`
  return { domain }
}

function useSecureOAuthCookies(): boolean {
  const url = process.env.NEXTAUTH_URL ?? ""
  if (url.startsWith("https://")) return true
  if (process.env.VERCEL) return true
  return process.env.NODE_ENV === "production"
}

function buildOAuthFlowCookies(): NextAuthOptions["cookies"] | undefined {
  if (!process.env.NEXTAUTH_COOKIE_DOMAIN?.trim()) return undefined
  const secure = useSecureOAuthCookies()
  const prefix = secure ? "__Secure-" : ""
  const extras = oauthCookieDomain()
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure,
    maxAge: 60 * 15,
    ...extras,
  }
  return {
    state: {
      name: `${prefix}next-auth.state`,
      options: base,
    },
    pkceCodeVerifier: {
      name: `${prefix}next-auth.pkce.code_verifier`,
      options: base,
    },
  }
}

const oauthCookiesMerged = buildOAuthFlowCookies()

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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
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
  ...(oauthCookiesMerged ? { cookies: oauthCookiesMerged } : {}),
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("signIn callback called", { provider: account?.provider, email: user.email })
      
      // Si es login con Google, crear/actualizar usuario en la base de datos
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            console.log("Creating new user for:", user.email)
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
            console.log("Usuario creado exitosamente:", newUser.id)
          } else {
            console.log("Usuario existente:", existingUser.id)
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
      // Si es login inicial, obtener datos de la BD
      if (trigger === "signIn" || !token.id) {
        if (token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string }
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.isSeller = dbUser.isSeller
            token.subscriptionTier = dbUser.subscriptionTier
            token.reputationColor = dbUser.reputationColor
            token.name = dbUser.name
            token.image = dbUser.image
            token.hasAccessKey = !!dbUser.accessKey
          }
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
