"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Eye, EyeOff, Lock, Mail, AlertTriangle, Shield } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Clear any stale sessions on mount
  React.useEffect(() => {
    const clearStaleSession = async () => {
      const supabase = createClient()
      // Check if there's a broken session and clear it
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // If there's a session but we're on the login page, clear it
        await supabase.auth.signOut()
      }
    }
    clearStaleSession()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate inputs before sending to Supabase
    if (!email || !email.trim()) {
      setError("Ingresa tu correo electrónico")
      setLoading(false)
      return
    }
    if (!password || !password.trim()) {
      setError("Ingresa tu contraseña")
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      // Sign in with email/password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error("No se pudo autenticar")
      }

      // Check if user has admin access
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("*, roles:role_id(*)")
        .eq("user_id", authData.user.id)
        .eq("is_active", true)
        .single()

      if (adminError || !adminUser) {
        // Sign out and show error
        await supabase.auth.signOut()
        throw new Error("No tienes permisos para acceder al panel de administracion")
      }

      // Get IP and user agent for logging
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json")
        const { ip } = await ipResponse.json()
        
        // Send login alert
        await fetch("/api/admin/login-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminUserId: adminUser.id,
            email: adminUser.email,
            ip,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          }),
        })
      } catch (alertError) {
        console.error("Failed to send login alert:", alertError)
        // Don't block login if alert fails
      }

      toast.success(`Bienvenido, ${adminUser.first_name || adminUser.email}`)
      router.push("/admin")
      router.refresh()
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Error al iniciar sesión")
      toast.error(err.message || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFF159] rounded-xl mb-4 shadow-lg">
            <span className="text-[#2D3277] font-bold text-2xl">MQ</span>
          </div>
          <h1 className="text-2xl font-bold text-white">MaqJeez ERP</h1>
          <p className="text-slate-400 mt-1">Panel de Administración</p>
        </div>

        {/* Security Notice */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-200 font-medium">Acceso Unico - Solo Personal Autorizado</p>
              <p className="text-xs text-amber-300/70 mt-1">
                Este sistema es exclusivo para personal autorizado. Las cuentas solo pueden ser creadas por el administrador del sistema. Todas las acciones son registradas.
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Iniciar Sesión</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="admin@maqjeez.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <span>Iniciar Sesión</span>
                )}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-500">
                Acceso exclusivo. No es posible crear cuentas desde aqui.
              </p>
              <p className="text-xs text-gray-400">
                ¿Problemas para acceder? Contacta al administrador del sistema
              </p>
            </div>
          </div>
        </div>

        {/* Back to site */}
        <div className="text-center mt-6">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Volver al sitio público
          </Link>
        </div>
      </div>
    </div>
  )
}
