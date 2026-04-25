import { create } from "zustand"

interface AuthState {
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    role: string
    isSeller: boolean
    subscriptionTier: string
    reputationColor: string
  } | null
  isLoading: boolean
  setUser: (user: any) => void
  clearUser: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  setLoading: (loading) => set({ isLoading: loading })
}))
