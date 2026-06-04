"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Mail, Hash, Loader2, AlertCircle } from "lucide-react";

export default function OrderLookupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), orderNumber: orderNumber.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(j.error || "No pudimos encontrar la orden");
      }
      if (j.token) {
        router.push(`/orders/access?token=${encodeURIComponent(j.token)}`);
      } else {
        throw new Error("Respuesta inesperada del servidor");
      }
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
            <Search className="text-slate-900" size={22} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Buscar mi orden
          </h1>
          <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
            Ingresá el email con el que pagaste y el número de orden que viste en
            el comprobante o recibiste por mail.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-[12.5px] font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@gmail.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-[14px]"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12.5px] font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                Número de orden
              </label>
              <div className="relative">
                <Hash
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="MP-XXXXXX"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-[14px] font-mono uppercase"
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
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Buscar mi orden
            </button>
          </form>

          <p className="mt-6 text-[12px] text-slate-500 leading-relaxed text-center">
            Después de 5 intentos fallidos te pediremos esperar 15 minutos.
            Si seguís sin encontrar tu orden, escribinos por WhatsApp.
          </p>
        </div>
      </div>
    </main>
  );
}
