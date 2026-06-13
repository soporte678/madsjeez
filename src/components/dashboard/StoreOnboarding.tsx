"use client";

/**
 * Onboarding de tienda en pasos (Fase 3b). UI guiada sobre /api/seller/store.
 * Pasos: 1 Nombre → 2 Rubro/datos → 3 Diseño → 4 Productos → 5 Publicar → 6 Dominio.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { Loader2, Check, X, ChevronRight, ChevronLeft, Copy, Share2, ExternalLink, PartyPopper } from "lucide-react";

const ROOT = "madsjeez.com.ar";
const RUBROS = ["Repuestos", "Ferretería", "Herramientas", "Hogar", "Bebé e indumentaria", "Bazar", "Tecnología", "Mayoristas", "Productos varios"];
const input = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
const label = "mb-1 block text-xs font-semibold text-foreground";

const STEPS = ["Nombre", "Tu negocio", "Diseño", "Productos", "Publicar", "Dominio"];

type Form = {
  name: string; slug: string; category: string; shortDescription: string;
  province: string; city: string; logoUrl: string; bannerUrl: string; primaryColor: string;
};

export function StoreOnboarding() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [internalUrl, setInternalUrl] = useState("");
  const [subdomainUrl, setSubdomainUrl] = useState<string | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [createdFired, setCreatedFired] = useState(false);
  const [slug, setSlugStatus] = useState<{ checking: boolean; ok: boolean | null; msg: string }>({ checking: false, ok: null, msg: "" });
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [f, setF] = useState<Form>({ name: "", slug: "", category: "", shortDescription: "", province: "", city: "", logoUrl: "", bannerUrl: "", primaryColor: "#1d4ed8" });

  const set = (k: keyof Form, v: string) => setF((s) => ({ ...s, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seller/store");
      if (!res.ok) { toast.error("No se pudo cargar tu tienda."); return; }
      const d = await res.json();
      const s = d.store;
      setF({
        name: s.name ?? "", slug: s.slug ?? "", category: s.category ?? "", shortDescription: s.shortDescription ?? "",
        province: s.province ?? "", city: s.city ?? "", logoUrl: s.logoUrl ?? "", bannerUrl: s.bannerUrl ?? "",
        primaryColor: s.primaryColor ?? "#1d4ed8",
      });
      setInternalUrl(d.internalUrl); setSubdomainUrl(d.subdomainUrl); setProductCount(d.productCount ?? 0);
      if (s.isActive) setStep(5);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const checkSlug = (value: string) => {
    setSlugStatus({ checking: true, ok: null, msg: "" });
    if (slugTimer.current) clearTimeout(slugTimer.current);
    slugTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/seller/store/slug-check?slug=${encodeURIComponent(value)}`);
        const d = await res.json();
        setSlugStatus({ checking: false, ok: d.available, msg: d.error || (d.available ? "Disponible" : "") });
      } catch { setSlugStatus({ checking: false, ok: null, msg: "" }); }
    }, 450);
  };

  const patch = async (data: Record<string, unknown>): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await fetch("/api/seller/store", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "No se pudo guardar"); return false; }
      setInternalUrl(d.internalUrl); setSubdomainUrl(d.subdomainUrl);
      return true;
    } finally { setSaving(false); }
  };

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success("Copiado"); };
  const shareWhatsapp = () => {
    const u = subdomainUrl || internalUrl;
    trackEvent("store_share_click", { channel: "whatsapp", source: "onboarding" });
    window.open(`https://wa.me/?text=${encodeURIComponent(`Mirá mi tienda en Madsjeez: ${u}`)}`, "_blank", "noopener,noreferrer");
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  const next = async () => {
    if (step === 1) {
      if (!f.name.trim()) { toast.error("Poné un nombre."); return; }
      if (slug.ok === false) { toast.error("Elegí una dirección disponible."); return; }
      if (!(await patch({ name: f.name, slug: f.slug }))) return;
      if (!createdFired) { trackEvent("store_created", { source: "onboarding" }); setCreatedFired(true); }
      setStep(2);
    } else if (step === 2) {
      if (!(await patch({ category: f.category, shortDescription: f.shortDescription, province: f.province, city: f.city }))) return;
      setStep(3);
    } else if (step === 3) {
      if (!(await patch({ logoUrl: f.logoUrl || undefined, bannerUrl: f.bannerUrl || undefined, primaryColor: f.primaryColor }))) return;
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  const publish = async () => {
    if (!(await patch({ isActive: true }))) return;
    trackEvent("store_published", { source: "onboarding" });
    toast.success("¡Tu tienda está publicada!");
    setStep(6);
  };

  return (
    <div className="max-w-2xl">
      {/* Progreso */}
      <div className="mb-8 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${i + 1 <= step ? "bg-primary" : "bg-muted"}`} />
            <p className={`mt-1.5 text-[10px] font-semibold ${i + 1 === step ? "text-primary" : "text-muted-foreground"}`}>{s}</p>
          </div>
        ))}
      </div>

      {/* Paso 1 — Nombre */}
      {step === 1 && (
        <div className="space-y-4">
          <div><h2 className="text-xl font-bold text-foreground">Elegí el nombre de tu tienda</h2><p className="mt-1 text-sm text-muted-foreground">Así te van a encontrar los compradores.</p></div>
          <div><label className={label}>Nombre de la tienda</label><input className={input} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej. Ferretería López" maxLength={80} /></div>
          <div>
            <label className={label}>Tu dirección</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{ROOT}/tienda/</span>
              <input className={input} value={f.slug} onChange={(e) => { set("slug", e.target.value); checkSlug(e.target.value); }} placeholder="ferreteria-lopez" />
              {slug.checking ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : slug.ok === true ? <Check className="h-4 w-4 text-[color:var(--success)]" /> : slug.ok === false ? <X className="h-4 w-4 text-[color:var(--destructive)]" /> : null}
            </div>
            {slug.msg && <p className={`mt-1 text-xs ${slug.ok ? "text-[color:var(--success)]" : "text-[color:var(--destructive)]"}`}>{slug.msg}</p>}
          </div>
        </div>
      )}

      {/* Paso 2 — Tu negocio */}
      {step === 2 && (
        <div className="space-y-4">
          <div><h2 className="text-xl font-bold text-foreground">Contanos qué vendés</h2><p className="mt-1 text-sm text-muted-foreground">Datos básicos de tu negocio.</p></div>
          <div><label className={label}>Rubro</label>
            <select className={input} value={f.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">Elegí tu rubro…</option>{RUBROS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div><label className={label}>Descripción corta</label><input className={input} value={f.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} placeholder="Una línea sobre tu negocio" maxLength={160} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Provincia</label><input className={input} value={f.province} onChange={(e) => set("province", e.target.value)} /></div>
            <div><label className={label}>Localidad</label><input className={input} value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
          </div>
        </div>
      )}

      {/* Paso 3 — Diseño */}
      {step === 3 && (
        <div className="space-y-4">
          <div><h2 className="text-xl font-bold text-foreground">Personalizá tu tienda</h2><p className="mt-1 text-sm text-muted-foreground">Sumá tu logo, banner y color.</p></div>
          <div><label className={label}>Logo (URL)</label><input className={input} value={f.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://…" /></div>
          <div><label className={label}>Banner (URL)</label><input className={input} value={f.bannerUrl} onChange={(e) => set("bannerUrl", e.target.value)} placeholder="https://…" /></div>
          <div><label className={label}>Color principal</label><input type="color" className="h-10 w-24 rounded-lg border border-border bg-background" value={f.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} /></div>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="h-16" style={{ background: f.primaryColor }} />
            <div className="bg-card p-3"><p className="font-bold text-foreground">{f.name || "Tu tienda"}</p><p className="text-xs text-muted-foreground">{f.shortDescription || "Tu vidriera online"}</p></div>
          </div>
        </div>
      )}

      {/* Paso 4 — Productos */}
      {step === 4 && (
        <div className="space-y-4">
          <div><h2 className="text-xl font-bold text-foreground">Tus productos</h2><p className="mt-1 text-sm text-muted-foreground">Tus productos activos con foto aparecen automáticamente en tu tienda.</p></div>
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <p className="text-3xl font-black text-foreground">{productCount}</p>
            <p className="text-sm text-muted-foreground">producto(s) activo(s) con imagen</p>
            {productCount === 0 && (
              <Link href="/dashboard/products" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90">Cargar mi primer producto</Link>
            )}
          </div>
          {productCount === 0 && <p className="text-xs text-muted-foreground">Podés publicar igual y cargar productos después, pero tu tienda se ve mejor con al menos uno.</p>}
        </div>
      )}

      {/* Paso 5 — Publicar */}
      {step === 5 && (
        <div className="space-y-4">
          <div><h2 className="text-xl font-bold text-foreground">Publicá tu tienda</h2><p className="mt-1 text-sm text-muted-foreground">Cuando publiques, tu tienda será visible y compartible.</p></div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Tu link</p>
            <p className="mt-1 flex items-center gap-2 font-medium text-primary">{internalUrl.replace(/^https?:\/\//, "")}
              <button onClick={() => copy(internalUrl)} className="text-primary"><Copy className="h-4 w-4" /></button></p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => void publish()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Publicar tienda</button>
              <button onClick={shareWhatsapp} className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted"><Share2 className="h-4 w-4" /> Compartir</button>
              <a href={internalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted"><ExternalLink className="h-4 w-4" /> Ver tienda</a>
            </div>
          </div>
        </div>
      )}

      {/* Paso 6 — Dominio / fin */}
      {step === 6 && (
        <div className="space-y-4 text-center">
          <PartyPopper className="mx-auto h-12 w-12 text-primary" />
          <h2 className="text-xl font-bold text-foreground">¡Tu tienda está lista!</h2>
          <p className="text-sm text-muted-foreground">Compartí tu link y seguí personalizando desde tu panel.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => copy(internalUrl)} className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted"><Copy className="h-4 w-4" /> Copiar link</button>
            <button onClick={shareWhatsapp} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"><Share2 className="h-4 w-4" /> Compartir por WhatsApp</button>
          </div>
          <div className="mt-2">
            <Link href="/dashboard/mi-tienda" className="text-sm font-semibold text-primary hover:underline">¿Querés conectar un dominio propio? Configuralo en tu panel →</Link>
          </div>
        </div>
      )}

      {/* Navegación */}
      {step <= 4 && (
        <div className="mt-8 flex items-center justify-between">
          <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Atrás</button>
          <button onClick={() => void next()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Continuar <ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}

export default StoreOnboarding;
