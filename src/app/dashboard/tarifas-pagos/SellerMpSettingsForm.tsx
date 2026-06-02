"use client";

/**
 * Form de configuración de cuotas + medios de pago del seller.
 *
 * - installments_max: tope de cuotas (1..24) o "default MP del seller".
 * - accepted_payment_types: subconjunto de tipos o "todos".
 * - interest_free_installments: cuotas sin interés (informativo).
 *
 * Persiste en seller_mercadopago vía PUT /api/seller/payment-gateway/mercadopago/settings.
 */

import { useEffect, useState } from "react";
import { Loader2, Save, Check, AlertCircle, CreditCard, Banknote, FileText, ArrowLeftRight, Receipt } from "lucide-react";

type Settings = {
  connected: boolean;
  installments_max: number | null;
  accepted_payment_types: string[] | null;
  interest_free_installments: number | null;
};

const PAYMENT_TYPE_LABELS: Array<{ id: string; label: string; Icon: typeof CreditCard }> = [
  { id: "credit_card", label: "Tarjeta de crédito", Icon: CreditCard },
  { id: "debit_card", label: "Tarjeta de débito", Icon: CreditCard },
  { id: "ticket", label: "Efectivo (RapiPago, Pago Fácil)", Icon: Receipt },
  { id: "bank_transfer", label: "Transferencia bancaria", Icon: ArrowLeftRight },
  { id: "atm", label: "Cajero automático", Icon: Banknote },
];

const INSTALLMENTS_OPTIONS = [null, 1, 3, 6, 9, 12, 18, 24];

const ENDPOINT = "/api/seller/payment-gateway/mercadopago/settings";

export function SellerMpSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [s, setS] = useState<Settings>({
    connected: false,
    installments_max: null,
    accepted_payment_types: null,
    interest_free_installments: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(ENDPOINT, { cache: "no-store" });
        if (!r.ok) throw new Error("No pudimos leer tu config");
        const j = (await r.json()) as Settings;
        if (!cancelled) setS(j);
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

  function toggleType(id: string) {
    setS((prev) => {
      const current = prev.accepted_payment_types ?? PAYMENT_TYPE_LABELS.map((t) => t.id);
      const next = current.includes(id)
        ? current.filter((t) => t !== id)
        : [...current, id];
      // Si activan todos → guardamos como null (= todos por default)
      const allChecked = PAYMENT_TYPE_LABELS.every((t) => next.includes(t.id));
      return { ...prev, accepted_payment_types: allChecked ? null : next };
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const r = await fetch(ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installments_max: s.installments_max,
          accepted_payment_types: s.accepted_payment_types,
          interest_free_installments: s.interest_free_installments,
        }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "No pudimos guardar");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!s.connected) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-start gap-3">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertCircle size={18} />
          <strong className="font-semibold">Conectá Mercado Pago primero</strong>
        </div>
        <p className="text-sm text-muted-foreground">
          Para configurar cuotas y medios de pago necesitás vincular tu cuenta
          de Mercado Pago. Eso permite que los compradores te paguen directo.
        </p>
        <a
          href="/api/seller/payment-gateway/mercadopago/auth"
          className="inline-flex items-center gap-2 rounded-xl bg-[#009ee3] hover:bg-[#008ac9] text-white text-sm font-bold px-4 py-2.5 transition-colors"
        >
          Conectar Mercado Pago
        </a>
      </div>
    );
  }

  const selectedTypes = s.accepted_payment_types ?? PAYMENT_TYPE_LABELS.map((t) => t.id);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col gap-8">
      {/* Cuotas */}
      <section>
        <h2 className="text-base font-bold text-foreground tracking-tight">Cuotas máximas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuántas cuotas ve el comprador en el checkout. Si dejás "Default MP",
          se usa lo que tengas configurado en tu panel de Mercado Pago.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {INSTALLMENTS_OPTIONS.map((opt) => {
            const active = s.installments_max === opt;
            return (
              <button
                key={String(opt)}
                type="button"
                onClick={() => setS({ ...s, installments_max: opt })}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors border ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background border-border text-foreground hover:border-foreground/40"
                }`}
              >
                {opt == null ? "Default MP" : `${opt} cuotas`}
              </button>
            );
          })}
        </div>
      </section>

      {/* Cuotas sin interés (informativo) */}
      <section>
        <h2 className="text-base font-bold text-foreground tracking-tight">
          Cuotas sin interés que absorbés
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Informativo. El costo financiero real lo cobra Mercado Pago a tu cuenta
          según las promociones que tengas activas en su panel.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={24}
            placeholder="0"
            value={s.interest_free_installments ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setS({
                ...s,
                interest_free_installments: v === "" ? null : Math.max(0, Math.min(24, Number(v) || 0)),
              });
            }}
            className="w-28 rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold"
          />
          <span className="text-sm text-muted-foreground">cuotas</span>
        </div>
      </section>

      {/* Medios de pago */}
      <section>
        <h2 className="text-base font-bold text-foreground tracking-tight">Medios de pago aceptados</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Destildá los que NO querés ofrecer. Si dejás todos tildados, MP usa
          tu config por defecto.
        </p>
        <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {PAYMENT_TYPE_LABELS.map((t) => {
            const checked = selectedTypes.includes(t.id);
            return (
              <li key={t.id}>
                <label
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                    checked
                      ? "border-foreground/40 bg-background"
                      : "border-border bg-background/50 opacity-70"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleType(t.id)}
                    className="h-4 w-4"
                  />
                  <t.Icon size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{t.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Save */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <FileText size={12} />
          Los cambios se aplican a tus próximas ventas. Las pendientes no se modifican.
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-xs text-rose-600 font-semibold">{error}</span>
          )}
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <Check size={14} /> Guardado
            </span>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground hover:bg-foreground/90 text-background text-sm font-bold px-5 py-2.5 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
