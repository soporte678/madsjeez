"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RainbowLogo from "@/components/brand/RainbowLogo"
import { Lock, Mail, Shield } from "lucide-react"
import { trackEvent } from "@/lib/analytics"

function authErrorMessage(code: string | null): string | null {
  if (!code) return null
  return `No se pudo iniciar sesión (${code}). Verificá tus credenciales o creá una cuenta nueva.`
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")
  const callbackUrl = "/"
  const authErrCode = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const urlAuthHint = authErrorMessage(authErrCode)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      trackEvent("login", {
        method: "credentials",
      })
      router.push("/")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 selection:bg-[#3483fa] selection:text-white">
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-center">
          <RainbowLogo href="/" textSizeClassName="text-xl md:text-2xl" iconSizeClassName="w-11 h-11" />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 pb-16">
        <div className="w-full max-w-[440px]">
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-amber-100 font-medium">Cuenta MADSJEEZ Marketplace</p>
                <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                  Accedé a favoritos, compras, carrito y panel de vendedor con la misma cuenta.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] border border-slate-200/80 overflow-hidden">
            <div className="px-8 pt-8 pb-2 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#FFF159] shadow-lg mb-4">
                <span className="text-[#2D3277] font-black text-xl tracking-tight">MQ</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Iniciar sesión</h1>
              <p className="text-sm text-slate-500 mt-2">Entrá con tu correo y contraseña</p>
            </div>

            <div className="px-8 pb-8 pt-4 space-y-4">
              {registered && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm border border-emerald-200">
                  ¡Cuenta creada! Te activamos <strong>14 días gratis</strong> con todos los beneficios del plan ULTRA.
                </div>
              )}

              {urlAuthHint && (
                <div className="p-3 rounded-lg bg-amber-50 text-amber-950 text-sm border border-amber-200 leading-snug">
                  {urlAuthHint}
                </div>
              )}

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
                      className="pl-10 h-11 border-slate-200 focus-visible:ring-[#3483fa]"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#3483fa] hover:bg-[#2968c8] text-white font-semibold shadow-md shadow-blue-500/20"
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión…" : "Iniciar sesión"}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-600 pt-2">
                ¿No tenés cuenta?{" "}
                <Link href="/auth/register" className="text-[#3483fa] font-semibold hover:underline">
                  Crear cuenta
                </Link>
              </p>

              <p className="text-center">
                <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
                  ← Volver al inicio
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-8 px-4 leading-relaxed">
            Al continuar aceptás las políticas del marketplace. Si usás Google, revisá que el dominio en la barra de
            direcciones coincida con el configurado en el servidor (evita mezclar www y sin www).
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
          Cargando…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
