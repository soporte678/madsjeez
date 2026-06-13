"use client";

/**
 * Panel "Mi tienda" (Madsjeez Tiendas — Fase 2).
 * Tabs: Configuración · Diseño · SEO · Dominios.
 * Lee/guarda en /api/seller/store. Requiere la migración Fase 1 aplicada.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Check, X, Copy, Share2, ExternalLink, Store as StoreIcon, Palette, Search, Globe, Lock, BarChart3, Eye, MousePointerClick, MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { StoreShareTools } from "./StoreShareTools";

type Tab = "config" | "design" | "seo" | "domains" | "share" | "stats";
type StoreStats = { totals: Record<string, number>; last30: Record<string, number>; topProducts: { id: string; title: string; clicks: number }[] };

type StoreData = {
  id: string; name: string; slug: string; subdomain: string | null;
  customDomain: string | null; description: string | null; shortDescription: string | null;
  whatsapp: string | null; email: string | null; province: string | null; city: string | null;
  category: string | null; logoUrl: string | null; bannerUrl: string | null;
  primaryColor: string | null; secondaryColor: string | null; font: string | null;
  instagram: string | null; facebook: string | null; website: string | null;
  seoTitle: string | null; seoDescription: string | null; ogImageUrl: string | null;
  isActive: boolean;
};

const ROOT = "madsjeez.com.ar";
const input = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelCls = "mb-1 block text-xs font-semibold text-foreground";

export function StoreBuilderPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("config");
  const [store, setStore] = useState<StoreData | null>(null);
  const [tier, setTier] = useState("FREE");
  const [internalUrl, setInternalUrl] = useState("");
  const [subdomainUrl, setSubdomainUrl] = useState<string | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [slugStatus, setSlugStatus] = useState<{ checking: boolean; ok: boolean | null; msg: string }>({ checking: false, ok: null, msg: "" });
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPro = tier !== "FREE";

  // Dominios propios
  type DomainRow = {
    id: string; domain: string; dnsStatus: string; sslStatus: string; isPrimary: boolean;
    instructions: { cname: { host: string; target: string }; txt: { host: string; value: string }; note?: string };
  };
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [premium, setPremium] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [domainBusy, setDomainBusy] = useState(false);

  const loadDomains = useCallback(async () => {
    const res = await fetch("/api/seller/store/domains");
    if (res.ok) { const d = await res.json(); setDomains(d.domains || []); setPremium(Boolean(d.premium)); }
  }, []);
  useEffect(() => { if (tab === "domains") void loadDomains(); }, [tab, loadDomains]);

  const addDomain = async () => {
    if (!domainInput.trim()) return;
    setDomainBusy(true);
    try {
      const res = await fetch("/api/seller/store/domains", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: domainInput.trim() }) });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "No se pudo agregar"); return; }
      toast.success("Dominio agregado. Configurá los registros DNS y verificá."); setDomainInput("");
      trackEvent("store_domain_added", { source: "panel" });
      await loadDomains();
    } finally { setDomainBusy(false); }
  };

  const verifyDomain = async (id: string) => {
    const res = await fetch(`/api/seller/store/domains/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify" }) });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error || "Error"); return; }
    if (d.ok) { toast.success(d.message); trackEvent("store_domain_verified", { source: "panel" }); } else { toast(d.message); }
    await loadDomains();
  };

  const setPrimaryDomain = async (id: string) => {
    const res = await fetch(`/api/seller/store/domains/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "primary" }) });
    if (!res.ok) { toast.error("Error"); return; }
    toast.success("Dominio principal actualizado"); await loadDomains();
  };

  const disconnectDomain = async (id: string) => {
    const res = await fetch(`/api/seller/store/domains/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("No se pudo desconectar"); return; }
    toast.success("Dominio desconectado"); await loadDomains();
  };

  // Estadísticas reales
  const [stats, setStats] = useState<StoreStats | null>(null);
  const loadStats = useCallback(async () => {
    const res = await fetch("/api/seller/store/stats");
    if (res.ok) setStats(await res.json());
  }, []);
  useEffect(() => { if (tab === "stats") void loadStats(); }, [tab, loadStats]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seller/store");
      if (!res.ok) { toast.error("No se pudo cargar tu tienda."); return; }
      const d = await res.json();
      setStore(d.store); setTier(d.tier); setInternalUrl(d.internalUrl);
      setSubdomainUrl(d.subdomainUrl); setProductCount(d.productCount ?? 0);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const set = (k: keyof StoreData, v: string | boolean) => setStore((s) => (s ? { ...s, [k]: v } : s));

  const checkSlug = (value: string) => {
    setSlugStatus({ checking: true, ok: null, msg: "" });
    if (slugTimer.current) clearTimeout(slugTimer.current);
    slugTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/seller/store/slug-check?slug=${encodeURIComponent(value)}`);
        const d = await res.json();
        setSlugStatus({ checking: false, ok: d.available, msg: d.error || (d.available ? "Disponible" : "") });
        trackEvent("store_slug_checked", { available: d.available });
      } catch { setSlugStatus({ checking: false, ok: null, msg: "" }); }
    }, 450);
  };

  const save = async (extra?: Partial<StoreData>, opts?: { publish?: boolean }) => {
    if (!store) return;
    setSaving(true);
    try {
      const payload = { ...store, ...extra };
      const res = await fetch("/api/seller/store", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "No se pudo guardar."); return; }
      setStore(d.store); setInternalUrl(d.internalUrl); setSubdomainUrl(d.subdomainUrl);
      toast.success(opts?.publish ? "Tienda publicada" : "Cambios guardados");
      if (opts?.publish) trackEvent("store_published", { source: "panel" });
    } finally { setSaving(false); }
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copiado"); };
  const share = (kind: "whatsapp" | "facebook") => {
    const u = subdomainUrl || internalUrl;
    trackEvent("store_share_click", { channel: kind });
    const href = kind === "whatsapp"
      ? `https://wa.me/?text=${encodeURIComponent(`Mirá mi tienda en Madsjeez: ${u}`)}`
      : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!store) return <p className="text-sm text-muted-foreground">No se pudo cargar la tienda.</p>;

  const TABS: [Tab, string, typeof StoreIcon][] = [
    ["config", "Configuración", StoreIcon], ["design", "Diseño", Palette],
    ["seo", "SEO", Search], ["domains", "Dominios", Globe], ["share", "Compartir", Share2], ["stats", "Estadísticas", BarChart3],
  ];

  return (
    <div className="max-w-4xl">
      {/* Estado + link público */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${store.isActive ? "bg-[color:var(--success)]/15 text-[color:var(--success)]" : "bg-muted text-muted-foreground"}`}>
              {store.isActive ? "Activa" : "Borrador"}
            </span>
            <a href={internalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 truncate text-sm font-medium text-primary hover:underline">
              {internalUrl.replace(/^https?:\/\//, "")} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{productCount} producto(s) activo(s) · Plan {tier}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => copy(internalUrl)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"><Copy className="h-3.5 w-3.5" /> Copiar link</button>
          <button onClick={() => share("whatsapp")} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"><Share2 className="h-3.5 w-3.5" /> WhatsApp</button>
          <button
            onClick={async () => { const next = !store.isActive; await save({ isActive: next }, { publish: next }); }}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {store.isActive ? "Despublicar" : "Publicar tienda"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-semibold ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* CONFIGURACIÓN */}
      {tab === "config" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nombre de la tienda</label>
            <input className={input} value={store.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Dirección de tu tienda (slug)</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{ROOT}/tienda/</span>
              <input className={input} value={store.slug} onChange={(e) => { set("slug", e.target.value); checkSlug(e.target.value); }} />
              {slugStatus.checking ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                : slugStatus.ok === true ? <Check className="h-4 w-4 text-[color:var(--success)]" />
                : slugStatus.ok === false ? <X className="h-4 w-4 text-[color:var(--destructive)]" /> : null}
            </div>
            {slugStatus.msg && <p className={`mt-1 text-xs ${slugStatus.ok ? "text-[color:var(--success)]" : "text-[color:var(--destructive)]"}`}>{slugStatus.msg}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Descripción corta</label>
            <input className={input} value={store.shortDescription ?? ""} onChange={(e) => set("shortDescription", e.target.value)} maxLength={160} placeholder="Una línea sobre tu negocio" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Descripción</label>
            <textarea className={input} rows={3} value={store.description ?? ""} onChange={(e) => set("description", e.target.value)} maxLength={2000} />
          </div>
          <div><label className={labelCls}>Rubro</label><input className={input} value={store.category ?? ""} onChange={(e) => set("category", e.target.value)} placeholder="Ej. Ferretería" /></div>
          <div><label className={labelCls}>WhatsApp</label><input className={input} value={store.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} placeholder="Ej. 11 2345 6789" /></div>
          <div><label className={labelCls}>Provincia</label><input className={input} value={store.province ?? ""} onChange={(e) => set("province", e.target.value)} /></div>
          <div><label className={labelCls}>Localidad</label><input className={input} value={store.city ?? ""} onChange={(e) => set("city", e.target.value)} /></div>
          <div><label className={labelCls}>Logo (URL)</label><input className={input} value={store.logoUrl ?? ""} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://…" /></div>
          <div><label className={labelCls}>Banner (URL)</label><input className={input} value={store.bannerUrl ?? ""} onChange={(e) => set("bannerUrl", e.target.value)} placeholder="https://…" /></div>
          <div><label className={labelCls}>Instagram (URL)</label><input className={input} value={store.instagram ?? ""} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/…" /></div>
          <div><label className={labelCls}>Facebook (URL)</label><input className={input} value={store.facebook ?? ""} onChange={(e) => set("facebook", e.target.value)} placeholder="https://facebook.com/…" /></div>
        </div>
      )}

      {/* DISEÑO */}
      {tab === "design" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div><label className={labelCls}>Color principal</label><input type="color" className="h-10 w-full rounded-lg border border-border bg-background" value={store.primaryColor ?? "#1d4ed8"} onChange={(e) => set("primaryColor", e.target.value)} /></div>
            <div><label className={labelCls}>Color secundario</label><input type="color" className="h-10 w-full rounded-lg border border-border bg-background" value={store.secondaryColor ?? "#3b82f6"} onChange={(e) => set("secondaryColor", e.target.value)} /></div>
            <div>
              <label className={labelCls}>Tipografía</label>
              <select className={input} value={store.font ?? "Outfit"} onChange={(e) => set("font", e.target.value)}>
                {["Outfit", "Inter", "Montserrat", "Poppins", "System"].map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          {/* Preview en vivo */}
          <div>
            <label className={labelCls}>Vista previa</label>
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="h-20" style={{ background: `linear-gradient(135deg, ${store.primaryColor ?? "#1d4ed8"}, ${store.secondaryColor ?? "#3b82f6"})` }} />
              <div className="bg-card p-4">
                <div className="-mt-8 mb-2 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-lg font-black" style={{ color: store.primaryColor ?? "#1d4ed8" }}>
                  {(store.name || "M").charAt(0).toUpperCase()}
                </div>
                <p className="font-bold text-foreground">{store.name || "Mi tienda"}</p>
                <p className="text-xs text-muted-foreground">{store.shortDescription || "Tu vidriera online en Madsjeez"}</p>
                <button className="mt-3 rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ background: store.primaryColor ?? "#1d4ed8" }}>Ver productos</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEO */}
      {tab === "seo" && (
        <div className="grid grid-cols-1 gap-4">
          <div><label className={labelCls}>Título SEO</label><input className={input} value={store.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} maxLength={70} placeholder={`${store.name} | Tienda online en Madsjeez`} /></div>
          <div><label className={labelCls}>Meta description</label><textarea className={input} rows={2} value={store.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} maxLength={180} /></div>
          <div><label className={labelCls}>Imagen para compartir (OG, URL)</label><input className={input} value={store.ogImageUrl ?? ""} onChange={(e) => set("ogImageUrl", e.target.value)} placeholder="https://…" /></div>
          {/* Preview Google */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Vista previa en Google</p>
            <p className="truncate text-sm text-[color:var(--success)]">{internalUrl}</p>
            <p className="text-base font-medium text-primary">{store.seoTitle || `${store.name} | Tienda online en Madsjeez`}</p>
            <p className="text-sm text-muted-foreground">{store.seoDescription || store.shortDescription || "Descripción de tu tienda para los buscadores."}</p>
          </div>
        </div>
      )}

      {/* DOMINIOS */}
      {tab === "domains" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-bold text-foreground">URL interna</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">{internalUrl.replace(/^https?:\/\//, "")}
              <button onClick={() => copy(internalUrl)} className="text-primary hover:underline"><Copy className="h-3.5 w-3.5" /></button></p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-foreground">Subdominio {!isPro && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground"><Lock className="h-3 w-3" /> Pro</span>}</p>
            <div className="mt-2 flex items-center gap-2">
              <input className={input} disabled={!isPro} value={store.subdomain ?? ""} onChange={(e) => set("subdomain", e.target.value)} placeholder="tunombre" />
              <span className="text-xs text-muted-foreground">.{ROOT}</span>
            </div>
            {!isPro && <p className="mt-1 text-xs text-muted-foreground">Disponible en el plan Pro. {subdomainUrl ? "" : ""}</p>}
            {subdomainUrl && <p className="mt-1 text-xs text-[color:var(--success)]">{subdomainUrl.replace(/^https?:\/\//, "")}</p>}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-foreground">Dominio propio
              {!premium && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground"><Lock className="h-3 w-3" /> Premium</span>}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Conectá un dominio que ya compraste (ej: www.tunegocio.com.ar). La activación con HTTPS se completa en una etapa de infraestructura posterior; por ahora podés cargarlo y verificar el DNS.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <input className={input} disabled={!premium} value={domainInput} onChange={(e) => setDomainInput(e.target.value)} placeholder="www.tunegocio.com.ar" />
              <button onClick={() => void addDomain()} disabled={!premium || domainBusy} className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {domainBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agregar"}
              </button>
            </div>
            {!premium && <p className="mt-1 text-xs text-muted-foreground">Disponible en el plan Premium.</p>}

            <div className="mt-4 space-y-3">
              {domains.map((d) => (
                <div key={d.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{d.domain}
                      {d.isPrimary && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Principal</span>}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${d.dnsStatus === "verified" ? "bg-[color:var(--success)]/15 text-[color:var(--success)]" : "bg-[color:var(--warning)]/15 text-[color:var(--warning)]"}`}>
                      {d.dnsStatus === "verified" ? "Verificado · HTTPS pendiente" : "Esperando DNS"}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                    <p><b>CNAME</b> — Host: <code>{d.instructions.cname.host}</code> · Destino: <code>{d.instructions.cname.target}</code></p>
                    <p className="break-all"><b>TXT</b> — Host: <code>{d.instructions.txt.host}</code> · Valor: <code>{d.instructions.txt.value}</code>
                      <button onClick={() => copy(d.instructions.txt.value)} className="ml-1 text-primary">copiar</button></p>
                    {d.instructions.note && <p>{d.instructions.note}</p>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={() => void verifyDomain(d.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">Verificar dominio</button>
                    {d.dnsStatus === "verified" && !d.isPrimary && <button onClick={() => void setPrimaryDomain(d.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">Hacer principal</button>}
                    <button onClick={() => void disconnectDomain(d.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-[color:var(--destructive)] hover:bg-muted">Desconectar</button>
                  </div>
                </div>
              ))}
              {premium && domains.length === 0 && <p className="text-xs text-muted-foreground">Todavía no agregaste un dominio propio.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === "share" && (
        <StoreShareTools url={internalUrl} subdomainUrl={subdomainUrl} name={store.name} primaryColor={store.primaryColor} />
      )}

      {/* ESTADÍSTICAS */}
      {tab === "stats" && (
        <div className="max-w-3xl">
          {!stats ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (stats.totals.view + stats.totals.product_click + stats.totals.whatsapp_click + stats.totals.share === 0) ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <BarChart3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-semibold text-foreground">Todavía no hay datos</p>
              <p className="mt-1 text-sm text-muted-foreground">Compartí tu tienda para empezar a medir visitas, clicks y consultas.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { Icon: Eye, label: "Visitas", key: "view" },
                  { Icon: MousePointerClick, label: "Clicks en productos", key: "product_click" },
                  { Icon: MessageCircle, label: "Clicks WhatsApp", key: "whatsapp_click" },
                  { Icon: Share2, label: "Compartidos", key: "share" },
                ].map((m) => (
                  <div key={m.key} className="rounded-2xl border border-border bg-card p-5">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><m.Icon className="h-5 w-5" /></span>
                    <p className="mt-3 text-3xl font-black text-foreground">{stats.totals[m.key] ?? 0}</p>
                    <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{stats.last30[m.key] ?? 0} en 30 días</p>
                  </div>
                ))}
              </div>
              {stats.topProducts.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-foreground">Productos más vistos</h3>
                  <div className="mt-3 divide-y divide-border rounded-2xl border border-border">
                    {stats.topProducts.map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="truncate text-sm text-foreground"><span className="mr-2 text-muted-foreground">{i + 1}.</span>{p.title}</span>
                        <span className="shrink-0 text-sm font-bold text-primary">{p.clicks} clicks</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-4 text-xs text-muted-foreground">Datos reales de tu tienda. Las consultas por WhatsApp y las ventas con checkout se sumarán a medida que se integren.</p>
            </>
          )}
        </div>
      )}

      {/* Guardar */}
      {tab !== "domains" && tab !== "share" && tab !== "stats" && (
        <div className="mt-6">
          <button onClick={() => save()} disabled={saving || slugStatus.ok === false}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Guardar cambios
          </button>
        </div>
      )}
    </div>
  );
}

export default StoreBuilderPanel;
