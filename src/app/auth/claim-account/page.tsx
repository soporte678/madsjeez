"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { KeyRound, AlertCircle, Loader2, Sparkles } from "lucide-react";

function ClaimForm() {
  const router = useRouter();
  const search = useSearchParams();
  const initialEmail = search.get("email") ?? "";
  const fromOrder = search.get("order");

  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/claim-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          password,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No pudimos crear tu cuenta");

      // Auto-login
      const sig = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (sig?.error) throw new Error("Cuenta creada pero no pudimos loguearte. Probá entrar manualmente.");

      router.push("/orders");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-10 font-outfit">
      <div className="max-w-md w-full">
        <Link
          href="/"
          prefetch={false}
          className="text-[13px] font-semibold text-slate-600 hover:text-slate-900 inline-block mb-6"
        >
          ← Volver al sitio
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.18)]">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 mb-5">
            <Sparkles className="text-slate-900" size={22} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Guardá tus compras
          </h1>
          <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
            Creá una contraseña con tu email. Todas tus órdenes pasadas se
            vinculan automáticamente a tu cuenta nueva.
          </p>

          {fromOrder && (
            <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-[12.5px] text-amber-900">
              Vinculando orden <span className="font-mono font-bold">{fromOrder}</span>.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-[12.5px] font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                readOnly={!!initialEmail}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] read-only:bg-slate-50 read-only:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                Nombre (opcional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px]"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                Contraseña (mín. 8 caracteres)
              </label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-[14px]"
                  autoComplete="new-password"
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
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Crear cuenta y vincular órdenes
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ClaimAccountPage() {
  return (
    <Suspense>
      <ClaimForm />
    </Suspense>
  );
}
