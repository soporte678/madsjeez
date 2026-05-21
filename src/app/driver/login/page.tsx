"use client"
import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Zap, Mail, Lock, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DriverLoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Si ya está autenticado, redirigir directo al dashboard
  useEffect(() => {
    if (status === "authenticated") router.replace("/driver")
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/driver",
      })
      if (result?.error) {
        setError("Credenciales incorrectas. Verificá tu email y contraseña.")
        return
      }
      router.replace("/driver")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Zap className="h-10 w-10 text-yellow-400 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center bg-yellow-400 rounded-2xl w-16 h-16 mb-4">
          <Zap className="h-9 w-9 text-black fill-black" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">⚡ FLASH</h1>
        <p className="text-yellow-400 text-sm font-semibold mt-1 tracking-widest uppercase">
          Portal Transportistas
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-white font-bold text-lg mb-1">Iniciar sesión</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Accedé con tu cuenta de transportista Flash.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-zinc-300 text-xs mb-1.5 block">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                type="email"
                placeholder="tucorreo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-400 focus:ring-yellow-400/20"
              />
            </div>
          </div>

          <div>
            <Label className="text-zinc-300 text-xs mb-1.5 block">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-400 focus:ring-yellow-400/20"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black text-base h-11 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Ingresar"}
          </Button>
        </form>

        <p className="text-center text-zinc-600 text-xs mt-6">
          ¿Problemas para ingresar? Contactá al administrador.
        </p>
      </div>

      <p className="mt-8 text-zinc-700 text-xs">
        Madsjeez Flash — Servicio de logística
      </p>
    </div>
  )
}
