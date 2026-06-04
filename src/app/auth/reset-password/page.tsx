"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { KeyRound, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

function ResetForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No pudimos actualizar la contraseña");
      setDone(true);

      // Auto-login después del reset si conocemos el email del token.
      // Pero como el token sólo lo verifica el server, simplemente redirigimos al login.
      setTimeout(() => router.push("/auth/login?reset=ok"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center px-4 font-outfit">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
          <AlertCircle size={40} className="mx-auto text-rose-500 mb-3" />
          <h1 className="text-xl font-black text-slate-900">Link inválido</h1>
          <p className="mt-2 text-[14px] text-slate-600">
            Falta el token en el link. Pedí uno nuevo desde 'Olvidé mi contraseña'.
          </p>
          <Link
            href="/auth/forgot-password"
            className="mt-6 inline-block rounded-xl bg-slate-900 text-white font-bold px-5 py-3 text-[13.5px]"
          >
            Pedir link nuevo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center px-4 font-outfit">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 mb-5">
            <KeyRound className="text-blue-600" size={22} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Nueva contraseña
          </h1>
          <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
            Elegí una contraseña nueva de al menos 8 caracteres.
          </p>

          {done ? (
            <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
              <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
              <div className="text-[13.5px] text-emerald-900">
                <p className="font-bold mb-1">¡Contraseña actualizada!</p>
                <p>Te llevamos al login en un segundo…</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-[12.5px] font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px]"
                  autoComplete="new-password"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                  Repetir contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px]"
                  autoComplete="new-password"
                />
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
                {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                Actualizar contraseña
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
