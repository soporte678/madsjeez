import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Extiende la sesión por defecto para incluir el ID del usuario
   */
  interface Session {
    user: {
      id: string
      role: string
      isSeller: boolean
      subscriptionTier: string
      reputationColor: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    isSeller: boolean
    subscriptionTier: string
    reputationColor: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    isSeller: boolean
    subscriptionTier: string
    reputationColor: string
  }
}
