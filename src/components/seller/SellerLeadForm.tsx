"use client";

/**
 * Formulario de captación de vendedores. Postea a /api/seller/leads (público).
 * Dispara eventos de analytics: seller_form_start, seller_form_submit, generate_lead.
 * Campos sin columna propia en la DB (provincia, canales actuales) se componen
 * dentro de `message` para no requerir migración.
 */

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { RUBROS } from "@/data/seller-landings";
import { Loader2, CheckCircle2 } from "lucide-react";

const CANALES = ["Mercado Libre", "Instagram", "WhatsApp", "Facebook", "Tienda física", "Otro", "Todavía no vendo"];

export function SellerLeadForm({ source, title, subtitle }: { source: string; title?: string; subtitle?: string }) {
  const params = useSearchParams();
  const inviteCode = useMemo(() => (params.get("inv") || "").toUpperCase(), [params]);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    businessName: "",
    businessType: "",
    phone: "",
    email: "",
    province: "",
    monthlyCatalog: "",
    currentChannel: "",
    message: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onFirstFocus = () => {
    if (started) return;
    setStarted(true);
    trackEvent("seller_form_start", { source });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
      setError("Completá al menos tu nombre y email.");
      return;
    }
    setLoading(true);
    setError("");

    const extra = [
      form.province.trim() && `Provincia/localidad: ${form.province.trim()}`,
      form.currentChannel && `Vende actualmente en: ${form.currentChannel}`,
    ].filter(Boolean).join("\n");
    const composedMessage = [form.message.trim(), extra].filter(Boolean).join("\n\n");

    let res: Response;
    try {
      res = await fetch("/api/seller/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          businessName: form.businessName.trim() || undefined,
          businessType: form.businessType || undefined,
          monthlyCatalog: form.monthlyCatalog ? Number(form.monthlyCatalog) : undefined,
          message: composedMessage || undefined,
          inviteCode: inviteCode || undefined,
        }),
      });
    } catch {
      setLoading(false);
      setError("No se pudo enviar. Revisá tu conexión e intentá de nuevo.");
      return;
    }
    setLoading(false);
    if (!res.ok) {
      setError("No se pudo enviar tu solicitud. Intentá de nuevo en un momento.");
      return;
    }

    trackEvent("seller_form_submit", { source, business_type: form.businessType || undefined });
    trackEvent("generate_lead", {
      lead_type: "seller_registration",
      source,
      business_type: form.businessType || undefined,
      invite_code: inviteCode || undefined,
      estimated_catalog: form.monthlyCatalog ? Number(form.monthlyCatalog) : undefined,
    });
    setOk(true);
  };

  if (ok) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-[color:var(--success)]" />
        <h3 className="text-xl font-bold text-foreground">¡Gracias! Recibimos tus datos</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          El equipo de Madsjeez va a contactarte para ayudarte a empezar a vender.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40";

  return (
    <form onSubmit={submit} onFocusCapture={onFirstFocus} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      {(title || subtitle) && (
        <div className="mb-5">
          {title && <h3 className="text-lg font-bold text-foreground">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-semibold text-foreground">Nombre *</label>
          <input className={inputCls} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Tu nombre" autoComplete="name" required />
        </div>
        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-semibold text-foreground">Nombre del negocio</label>
          <input className={inputCls} value={form.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="Ej. Ferretería El Tornillo" />
        </div>
        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-semibold text-foreground">Rubro</label>
          <select className={inputCls} value={form.businessType} onChange={(e) => set("businessType", e.target.value)}>
            <option value="">Elegí tu rubro…</option>
            {RUBROS.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-semibold text-foreground">WhatsApp</label>
          <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Ej. 11 2345 6789" inputMode="tel" autoComplete="tel" />
        </div>
        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-semibold text-foreground">Email *</label>
          <input className={inputCls} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="tu@email.com" autoComplete="email" required />
        </div>
        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-semibold text-foreground">Provincia / localidad</label>
          <input className={inputCls} value={form.province} onChange={(e) => set("province", e.target.value)} placeholder="Ej. Córdoba" />
        </div>
        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-semibold text-foreground">Cantidad aprox. de productos</label>
          <input className={inputCls} value={form.monthlyCatalog} onChange={(e) => set("monthlyCatalog", e.target.value.replace(/\D/g, ""))} placeholder="Ej. 120" inputMode="numeric" />
        </div>
        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-semibold text-foreground">¿Dónde vendés hoy?</label>
          <select className={inputCls} value={form.currentChannel} onChange={(e) => set("currentChannel", e.target.value)}>
            <option value="">Elegí una opción…</option>
            {CANALES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-foreground">Mensaje (opcional)</label>
          <textarea className={inputCls} rows={3} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Contanos qué vendés o qué necesitás" />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-[color:var(--destructive)]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Enviando…" : "Quiero vender en Madsjeez"}
      </button>
      <p className="mt-2 text-center text-xs text-muted-foreground">Dejás tus datos sin compromiso. Te contactamos para ayudarte a empezar.</p>
    </form>
  );
}

export default SellerLeadForm;
