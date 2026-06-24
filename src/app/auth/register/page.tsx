"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RainbowLogo, { MadsjeezMark } from "@/components/brand/RainbowLogo"
import { Lock, Mail, ShieldCheck } from "lucide-react"
import { trackEvent } from "@/lib/analytics"

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
          Cargando…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const trimmedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Email inválido")
      return
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Error al registrarse")

      trackEvent("sign_up", { method: "email" })

      const signRes = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
      })

      if (signRes?.error) {
        router.push("/auth/login?registered=true")
        return
      }

      // Redirigir al perfil para completar datos
      router.push("/perfil?onboarding=true")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al registrarse")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 selection:bg-[#3483fa] selection:text-white">
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-center">
          <RainbowLogo href="/" textSizeClassName="text-xl md:text-2xl" iconSizeClassName="w-11 h-11" variant="onDark" />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 pb-16">
        <div className="w-full max-w-[440px]">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#60a5fa] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-white font-semibold">Registro rápido — 2 pasos</p>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Creá tu cuenta con email y contraseña. Completás tu perfil adentro, sin presión.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] border border-slate-200/80 overflow-hidden">
            <div className="px-8 pt-8 pb-2 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/70 shadow-sm mb-4">
                <MadsjeezMark className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Crear cuenta</h1>
              <p className="text-sm text-slate-500 mt-2">
                Solo email y contraseña — completás el resto adentro
              </p>
            </div>

            <div className="px-8 pb-8 pt-4 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm border border-red-200">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">
                    Correo electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-11 border-slate-200 focus-visible:ring-[#3483fa]"
                      placeholder="nombre@ejemplo.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="pl-10 h-11 border-slate-200 focus-visible:ring-[#3483fa]"
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                    />
                  </div>
                  <p className="text-xs text-slate-400">Mínimo 8 caracteres</p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#3483fa] hover:bg-[#2968c8] text-white font-semibold shadow-md shadow-blue-500/20"
                  disabled={loading}
                >
                  {loading ? "Creando cuenta…" : "Crear cuenta gratis"}
                </Button>
              </form>

              <p className="text-center text-sm pt-1 text-slate-500">
                Al registrarte activás <strong className="text-slate-700">6 meses gratis</strong> del plan PRO.
              </p>

              <p className="text-center text-sm text-slate-600 pt-2">
                ¿Ya tenés cuenta?{" "}
                <Link href="/auth/login" className="text-[#3483fa] font-semibold hover:underline">
                  Iniciar sesión
                </Link>
              </p>

              <p className="text-center">
                <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                  ← Volver al inicio
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
