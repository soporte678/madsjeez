"use client";

/**
 * Form para que el seller pegue su email de PayPal Business y opcionalmente
 * un merchant ID. Persiste vía /api/seller/payment-gateway/paypal/connect.
 */

import { useEffect, useState } from "react";
import { Loader2, Check, AlertCircle, Trash2 } from "lucide-react";

type Status = {
  connected: boolean;
  email: string | null;
  merchantId: string | null;
  currency: string;
};

const ENDPOINT = "/api/seller/payment-gateway/paypal/connect";

export function PaypalConnectForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [s, setS] = useState<Status>({ connected: false, email: null, merchantId: null, currency: "USD" });
  const [email, setEmail] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(ENDPOINT, { cache: "no-store" });
        if (!r.ok) throw new Error("No pudimos leer tu config PayPal");
        const j = (await r.json()) as Status;
        if (!cancelled) {
          setS(j);
          setEmail(j.email ?? "");
          setMerchantId(j.merchantId ?? "");
          setCurrency(j.currency ?? "USD");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const r = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, merchantId: merchantId || undefined, currency }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No pudimos guardar");
      setS({ connected: true, email, merchantId: merchantId || null, currency });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    if (!confirm("¿Desconectar PayPal? Los compradores no podrán pagarte con PayPal hasta que lo vincules de nuevo.")) {
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(ENDPOINT, { method: "DELETE" });
      if (!r.ok) throw new Error("No pudimos desconectar");
      setS({ connected: false, email: null, merchantId: null, currency: "USD" });
      setEmail("");
      setMerchantId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#0070ba] grid place-items-center text-white font-black text-xs">
          PP
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight">PayPal</h2>
          <p className="text-[12.5px] text-muted-foreground">
            Cobrá compradores del exterior en USD. Requiere PayPal Business.
          </p>
        </div>
        {s.connected && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-3 py-1 text-[11px] font-bold">
            <Check size={12} /> Vinculado
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[12.5px] font-bold uppercase tracking-wide text-foreground mb-1.5">
            Email PayPal Business
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucuenta@ejemplo.com"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
            autoComplete="email"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-[12.5px] font-bold uppercase tracking-wide text-foreground mb-1.5">
              Merchant ID (opcional)
            </label>
            <input
              type="text"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              placeholder="Opcional"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-bold uppercase tracking-wide text-foreground mb-1.5">
              Moneda
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="MXN">MXN</option>
              <option value="BRL">BRL</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-[13px] text-rose-800">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
        <p className="text-[11.5px] text-muted-foreground italic max-w-[60ch]">
          Los compradores van a poder elegir PayPal en el checkout. El cargo aparece directamente en tu cuenta PayPal Business.
        </p>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <Check size={14} /> Guardado
            </span>
          )}
          {s.connected && (
            <button
              type="button"
              onClick={() => void disconnect()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border hover:border-rose-300 hover:text-rose-700 text-foreground text-xs font-bold px-3 py-2 transition-colors disabled:opacity-50"
            >
              <Trash2 size={12} /> Desvincular
            </button>
          )}
          <button
            type="button"
            disabled={saving || !email}
            onClick={() => void save()}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground hover:bg-foreground/90 text-background text-sm font-bold px-5 py-2.5 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {s.connected ? "Actualizar" : "Vincular PayPal"}
          </button>
        </div>
      </div>
    </div>
  );
}
