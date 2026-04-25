import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Si es login con Google, crear/actualizar usuario en la base de datos
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })

        if (!existingUser) {
          // Crear nuevo usuario con Google
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || "Usuario Google",
              image: user.image,
              role: "user",
              isSeller: false,
              subscriptionTier: "free",
              emailVerified: new Date(),
            }
          })
        } else {
          // Actualizar imagen si cambió
          if (user.image && existingUser.image !== user.image) {
            await prisma.user.update({
              where: { email: user.email! },
              data: { image: user.image }
            })
          }
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.isSeller = user.isSeller
        token.subscriptionTier = user.subscriptionTier
        token.reputationColor = user.reputationColor
      }
      // Si es login con Google, obtener datos actualizados de la BD
      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string }
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.isSeller = dbUser.isSeller
          token.subscriptionTier = dbUser.subscriptionTier
          token.reputationColor = dbUser.reputationColor
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
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/login",
  }
}
