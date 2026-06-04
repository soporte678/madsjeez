"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No pudimos enviar el email");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center px-4 font-outfit">
      <div className="max-w-md w-full">
        <Link
          href="/auth/login"
          prefetch={false}
          className="text-[13px] font-semibold text-white/70 hover:text-white inline-flex items-center gap-1.5 mb-6"
        >
          <ArrowLeft size={14} />
          Volver al login
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 mb-5">
            <Mail className="text-blue-600" size={22} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
            Ingresá tu email y te mandamos un link para crear una nueva.
            El link caduca en 1 hora.
          </p>

          {sent ? (
            <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
              <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
              <div className="text-[13.5px] text-emerald-900 leading-relaxed">
                <p className="font-bold mb-1">Email enviado</p>
                <p>
                  Si <span className="font-mono">{email}</span> está registrada, te llega el link
                  en ~30 segundos. Revisá la bandeja de entrada (y spam por las dudas).
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-[12.5px] font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@gmail.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[14px]"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-[13px] text-rose-800">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold py-3.5 text-[14px] disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                Enviar link de reset
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
