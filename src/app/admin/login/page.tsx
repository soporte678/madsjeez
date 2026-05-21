"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    fetch("/api/admin/auth/status", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json().catch(() => ({}))) as { authenticated?: boolean };
        if (data.authenticated) {
          router.replace("/admin");
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email?.trim()) {
      setError("Ingresa tu correo electrónico");
      setLoading(false);
      return;
    }
    if (!password?.trim()) {
      setError("Ingresa tu contraseña");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/auth/sign-in", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        admin?: { id: string; email: string; first_name?: string | null };
      };

      if (!res.ok || !data.ok || !data.admin) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const { ip } = await ipResponse.json();

        await fetch("/api/admin/login-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            adminUserId: data.admin.id,
            email: data.admin.email,
            ip,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (alertError) {
        console.error("Failed to send login alert:", alertError);
      }

      toast.success(`Bienvenido, ${data.admin.first_name || data.admin.email}`);
      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar sesión";
      console.error("Login error:", err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFF159] rounded-xl mb-4 shadow-lg">
            <span className="text-[#2D3277] font-bold text-2xl">MQ</span>
          </div>
          <h1 className="text-2xl font-bold text-white">MadsJeez ERP</h1>
          <p className="text-slate-400 mt-1">Panel de Administración</p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-200 font-medium">
                Acceso Unico - Solo Personal Autorizado
              </p>
              <p className="text-xs text-amber-300/70 mt-1">
                Este sistema es exclusivo para personal autorizado. Las cuentas solo pueden ser
                creadas por el administrador del sistema. Todas las acciones son registradas.
              </p>
            </div>
          </div>
        </div>

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
                    placeholder="admin@madsjeez.com"
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

        <div className="text-center mt-6">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Volver al sitio público
          </Link>
        </div>
      </div>
    </div>
  );
}
