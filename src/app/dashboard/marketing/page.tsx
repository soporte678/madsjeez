"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  Mail,
  BarChart3,
  TrendingUp,
  Search,
  Megaphone,
  Zap,
  Hash,
  Share2,
  AlertTriangle,
} from "lucide-react";

type Tab = "social" | "email" | "banners" | "pricing" | "seo";

/** Vista Marketing IA: visible para desarrollo y pruebas; aviso permanente de beta / construcción. */
export default function MarketingPage() {
  const { status } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("social");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState("");

  const [socialForm, setSocialForm] = useState({
    productTitle: "",
    productDescription: "",
    productPrice: "",
    productCategory: "",
    platform: "instagram",
    tone: "profesional",
  });

  const [emailForm, setEmailForm] = useState({
    emailType: "promotion",
    productTitle: "",
    productPrice: "",
    customerName: "",
    storeName: "",
    promotionDetails: "",
  });

  const [bannerForm, setBannerForm] = useState({
    campaignType: "",
    discount: "",
    dateRange: "",
    targetAudience: "",
    products: "",
  });

  const [pricingForm, setPricingForm] = useState({
    productTitle: "",
    productPrice: "",
    productCategory: "",
  });

  const [seoForm, setSeoForm] = useState({
    productTitle: "",
    productDescription: "",
    productCategory: "",
  });

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const callApi = async (action: string, formData: Record<string, unknown>) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...formData }),
      });
      const data = (await res.json()) as Record<string, unknown>;
      setResult(data);
    } catch (e) {
      console.error("Marketing AI error:", e);
    }
    setLoading(false);
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-600 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-fuchsia-500/60 focus:ring-1 focus:ring-fuchsia-500/40";

  if (status === "loading") {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-800 bg-[#0a0f18]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-fuchsia-500/30 border-t-fuchsia-500" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Share2; color: string }[] = [
    { id: "social", label: "Redes Sociales", icon: Share2, color: "from-pink-500 to-purple-600" },
    { id: "email", label: "Emails", icon: Mail, color: "from-blue-500 to-cyan-500" },
    { id: "banners", label: "Campañas", icon: Megaphone, color: "from-orange-500 to-red-500" },
    { id: "pricing", label: "Precios", icon: TrendingUp, color: "from-green-500 to-emerald-500" },
    { id: "seo", label: "SEO", icon: Search, color: "from-indigo-500 to-blue-500" },
  ];

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <button
      type="button"
      onClick={() => copyText(text, label)}
      className="inline-flex items-center gap-1 text-xs text-blue-400 transition-colors hover:text-blue-300"
    >
      {copied === label ? <Check size={12} /> : <Copy size={12} />}
      {copied === label ? "Copiado" : "Copiar"}
    </button>
  );

  return (
    <div className="space-y-6 rounded-2xl border border-slate-800 bg-[#0a0f18] p-4 text-slate-100 shadow-xl sm:p-6 lg:p-8">
      <div className="rounded-xl border border-amber-500/35 bg-amber-950/25 px-4 py-3 text-sm text-amber-50 backdrop-blur-sm">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
          <div>
            <p className="font-semibold text-amber-100">Sección en construcción — modo beta</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-100/85">
              Esta área está en desarrollo y no está garantizada al 100%. Podés usarla para pruebas y para seguir
              construyéndola; las respuestas de IA pueden fallar, tardar o ser incompletas según el backend y cuotas.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 shadow-lg shadow-purple-900/40">
          <Sparkles className="h-6 w-6 text-white" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Marketing IA</h1>
            <span className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-pink-900/40">
              Beta
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">Herramientas de marketing potenciadas por inteligencia artificial</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setResult(null);
            }}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                : "border border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:bg-slate-800/80 hover:text-slate-200"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-6 shadow-inner backdrop-blur-md">
          {activeTab === "social" && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Share2 size={20} className="text-pink-400" /> Generador de Posts
              </h2>
              <input
                value={socialForm.productTitle}
                onChange={(e) => setSocialForm((p) => ({ ...p, productTitle: e.target.value }))}
                placeholder="Título del producto"
                className={fieldClass}
              />
              <textarea
                value={socialForm.productDescription}
                onChange={(e) => setSocialForm((p) => ({ ...p, productDescription: e.target.value }))}
                placeholder="Descripción del producto (opcional)"
                rows={3}
                className={`${fieldClass} resize-none`}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={socialForm.productPrice}
                  onChange={(e) => setSocialForm((p) => ({ ...p, productPrice: e.target.value }))}
                  placeholder="Precio ($)"
                  className={fieldClass}
                />
                <input
                  value={socialForm.productCategory}
                  onChange={(e) => setSocialForm((p) => ({ ...p, productCategory: e.target.value }))}
                  placeholder="Categoría"
                  className={fieldClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={socialForm.platform}
                  onChange={(e) => setSocialForm((p) => ({ ...p, platform: e.target.value }))}
                  className={fieldClass}
                >
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="tiktok">TikTok</option>
                </select>
                <select
                  value={socialForm.tone}
                  onChange={(e) => setSocialForm((p) => ({ ...p, tone: e.target.value }))}
                  className={fieldClass}
                >
                  <option value="profesional">Profesional</option>
                  <option value="casual">Casual</option>
                  <option value="urgente">Urgente</option>
                  <option value="divertido">Divertido</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => callApi("social_posts", socialForm)}
                disabled={loading || !socialForm.productTitle}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-sm font-medium text-white transition-all hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {loading ? "Generando..." : "Generar Post"}
              </button>
            </div>
          )}

          {activeTab === "email" && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Mail size={20} className="text-blue-400" /> Generador de Emails
              </h2>
              <select
                value={emailForm.emailType}
                onChange={(e) => setEmailForm((p) => ({ ...p, emailType: e.target.value }))}
                className={fieldClass}
              >
                <option value="promotion">Promoción / Oferta</option>
                <option value="abandoned_cart">Carrito Abandonado</option>
                <option value="welcome">Bienvenida</option>
                <option value="restock">Producto Disponible</option>
                <option value="review">Pedir Reseña</option>
                <option value="inactive">Reactivar Cliente</option>
              </select>
              <input
                value={emailForm.productTitle}
                onChange={(e) => setEmailForm((p) => ({ ...p, productTitle: e.target.value }))}
                placeholder="Producto (opcional)"
                className={fieldClass}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={emailForm.productPrice}
                  onChange={(e) => setEmailForm((p) => ({ ...p, productPrice: e.target.value }))}
                  placeholder="Precio ($)"
                  className={fieldClass}
                />
                <input
                  value={emailForm.customerName}
                  onChange={(e) => setEmailForm((p) => ({ ...p, customerName: e.target.value }))}
                  placeholder="Nombre cliente"
                  className={fieldClass}
                />
              </div>
              <input
                value={emailForm.promotionDetails}
                onChange={(e) => setEmailForm((p) => ({ ...p, promotionDetails: e.target.value }))}
                placeholder="Detalles de la promo (ej: 20% OFF en taladros)"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => callApi("remarketing_email", emailForm)}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 py-3 text-sm font-medium text-white transition-all hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {loading ? "Generando..." : "Generar Email"}
              </button>
            </div>
          )}

          {activeTab === "banners" && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Megaphone size={20} className="text-orange-400" /> Generador de Campañas
              </h2>
              <input
                value={bannerForm.campaignType}
                onChange={(e) => setBannerForm((p) => ({ ...p, campaignType: e.target.value }))}
                placeholder="Tipo de campaña (ej: Hot Sale, Black Friday, Liquidación)"
                className={fieldClass}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={bannerForm.discount}
                  onChange={(e) => setBannerForm((p) => ({ ...p, discount: e.target.value }))}
                  placeholder="Descuento (ej: 30% OFF)"
                  className={fieldClass}
                />
                <input
                  value={bannerForm.dateRange}
                  onChange={(e) => setBannerForm((p) => ({ ...p, dateRange: e.target.value }))}
                  placeholder="Duración (ej: 1-5 Mayo)"
                  className={fieldClass}
                />
              </div>
              <input
                value={bannerForm.targetAudience}
                onChange={(e) => setBannerForm((p) => ({ ...p, targetAudience: e.target.value }))}
                placeholder="Público objetivo (ej: profesionales de la construcción)"
                className={fieldClass}
              />
              <input
                value={bannerForm.products}
                onChange={(e) => setBannerForm((p) => ({ ...p, products: e.target.value }))}
                placeholder="Productos destacados (ej: taladros, amoladoras)"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => callApi("banner_text", bannerForm)}
                disabled={loading || !bannerForm.campaignType}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3 text-sm font-medium text-white transition-all hover:from-orange-600 hover:to-red-700 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {loading ? "Generando..." : "Generar Campaña"}
              </button>
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <TrendingUp size={20} className="text-green-400" /> Análisis de Precios
              </h2>
              <input
                value={pricingForm.productTitle}
                onChange={(e) => setPricingForm((p) => ({ ...p, productTitle: e.target.value }))}
                placeholder="Nombre del producto"
                className={fieldClass}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={pricingForm.productPrice}
                  onChange={(e) => setPricingForm((p) => ({ ...p, productPrice: e.target.value }))}
                  placeholder="Tu precio actual ($)"
                  className={fieldClass}
                />
                <input
                  value={pricingForm.productCategory}
                  onChange={(e) => setPricingForm((p) => ({ ...p, productCategory: e.target.value }))}
                  placeholder="Categoría"
                  className={fieldClass}
                />
              </div>
              <button
                type="button"
                onClick={() => callApi("price_analysis", pricingForm)}
                disabled={loading || !pricingForm.productTitle}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3 text-sm font-medium text-white transition-all hover:from-green-600 hover:to-emerald-700 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
                {loading ? "Analizando..." : "Analizar Precio"}
              </button>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Search size={20} className="text-indigo-400" /> Optimización SEO
              </h2>
              <input
                value={seoForm.productTitle}
                onChange={(e) => setSeoForm((p) => ({ ...p, productTitle: e.target.value }))}
                placeholder="Título del producto"
                className={fieldClass}
              />
              <textarea
                value={seoForm.productDescription}
                onChange={(e) => setSeoForm((p) => ({ ...p, productDescription: e.target.value }))}
                placeholder="Descripción actual del producto"
                rows={4}
                className={`${fieldClass} resize-none`}
              />
              <input
                value={seoForm.productCategory}
                onChange={(e) => setSeoForm((p) => ({ ...p, productCategory: e.target.value }))}
                placeholder="Categoría"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => callApi("seo_optimize", seoForm)}
                disabled={loading || !seoForm.productTitle}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 py-3 text-sm font-medium text-white transition-all hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {loading ? "Optimizando..." : "Optimizar SEO"}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-6 shadow-inner backdrop-blur-md">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Zap size={20} className="text-sky-400" /> Resultados
          </h2>

          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-500/20 border-t-purple-500" />
                <Sparkles className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-purple-400" />
              </div>
              <p className="animate-pulse text-sm text-slate-400">Generando con IA...</p>
            </div>
          )}

          {!loading && !result && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <Sparkles size={40} strokeWidth={1} className="text-slate-600" />
              <p className="text-center text-sm">Completá el formulario y hacé clic en generar</p>
              <p className="max-w-xs text-center text-xs text-slate-600">Modo beta: si algo falla, revisá la consola o el endpoint `/api/ai/marketing`.</p>
            </div>
          )}

          {!loading && result && (
            <div className="max-h-[600px] space-y-4 overflow-y-auto pr-2">
              {activeTab === "social" && result.post_text != null && typeof result.post_text === "string" && (
                <>
                  <ResultCard
                    title="Post"
                    content={result.post_text}
                    onCopy={() => copyText(result.post_text as string, "post")}
                    copied={copied === "post"}
                  />
                  {typeof result.caption_long === "string" && (
                    <ResultCard
                      title="Caption Largo"
                      content={result.caption_long}
                      onCopy={() => copyText(result.caption_long as string, "caption")}
                      copied={copied === "caption"}
                    />
                  )}
                  {typeof result.caption_short === "string" && (
                    <ResultCard
                      title="Caption Stories"
                      content={result.caption_short}
                      onCopy={() => copyText(result.caption_short as string, "stories")}
                      copied={copied === "stories"}
                    />
                  )}
                  {typeof result.call_to_action === "string" && (
                    <ResultCard
                      title="Call to Action"
                      content={result.call_to_action}
                      onCopy={() => copyText(result.call_to_action as string, "cta")}
                      copied={copied === "cta"}
                    />
                  )}
                  {Array.isArray(result.hashtags) && (
                    <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="flex items-center gap-1 text-xs font-medium text-slate-400">
                          <Hash size={12} /> Hashtags
                        </p>
                        <CopyButton
                          text={(result.hashtags as string[])
                            .map((h) => (h.startsWith("#") ? h : `#${h}`))
                            .join(" ")}
                          label="hashtags"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(result.hashtags as string[]).map((h) => (
                          <span key={h} className="rounded-full bg-purple-950/80 px-2 py-0.5 text-xs text-purple-200">
                            {h.startsWith("#") ? h : `#${h}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {typeof result.best_time === "string" && (
                    <p className="text-xs text-slate-500">Mejor horario: {result.best_time}</p>
                  )}
                  {Array.isArray(result.content_ideas) && (
                    <div className="rounded-lg border border-blue-900/40 bg-blue-950/30 p-3">
                      <p className="mb-2 text-xs font-medium text-blue-300">Ideas de contenido visual:</p>
                      <ul className="space-y-1 text-xs text-blue-100/90">
                        {(result.content_ideas as string[]).map((idea, i) => (
                          <li key={i}>• {idea}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {activeTab === "email" && typeof result.subject === "string" && (
                <>
                  <ResultCard
                    title="Asunto"
                    content={result.subject}
                    onCopy={() => copyText(result.subject as string, "subject")}
                    copied={copied === "subject"}
                  />
                  {typeof result.preview_text === "string" && (
                    <ResultCard
                      title="Preview"
                      content={result.preview_text}
                      onCopy={() => copyText(result.preview_text as string, "preview")}
                      copied={copied === "preview"}
                    />
                  )}
                  {typeof result.body_html === "string" && (
                    <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-400">Cuerpo del Email</p>
                        <CopyButton text={result.body_html as string} label="body" />
                      </div>
                      <div
                        className="rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm text-slate-200"
                        dangerouslySetInnerHTML={{ __html: result.body_html }}
                      />
                    </div>
                  )}
                  {typeof result.cta_text === "string" && (
                    <ResultCard
                      title="Botón CTA"
                      content={result.cta_text}
                      onCopy={() => copyText(result.cta_text as string, "email_cta")}
                      copied={copied === "email_cta"}
                    />
                  )}
                  {typeof result.urgency_line === "string" && (
                    <p className="text-xs font-medium text-orange-400">{result.urgency_line}</p>
                  )}
                </>
              )}

              {activeTab === "banners" && typeof result.headline === "string" && (
                <>
                  <ResultCard
                    title="Titular Principal"
                    content={result.headline}
                    onCopy={() => copyText(result.headline as string, "headline")}
                    copied={copied === "headline"}
                    highlight
                  />
                  {typeof result.subheadline === "string" && (
                    <ResultCard
                      title="Subtítulo"
                      content={result.subheadline}
                      onCopy={() => copyText(result.subheadline as string, "sub")}
                      copied={copied === "sub"}
                    />
                  )}
                  {typeof result.banner_hero === "string" && (
                    <ResultCard
                      title="Banner Hero"
                      content={result.banner_hero}
                      onCopy={() => copyText(result.banner_hero as string, "hero")}
                      copied={copied === "hero"}
                    />
                  )}
                  {(typeof result.popup_title === "string" || typeof result.popup_body === "string") && (
                    <ResultCard
                      title="Popup"
                      content={`${result.popup_title ?? ""}\n${result.popup_body ?? ""}`}
                      onCopy={() =>
                        copyText(`${result.popup_title ?? ""} ${result.popup_body ?? ""}`, "popup")
                      }
                      copied={copied === "popup"}
                    />
                  )}
                  {typeof result.push_notification === "string" && (
                    <ResultCard
                      title="Push Notification"
                      content={result.push_notification}
                      onCopy={() => copyText(result.push_notification as string, "push")}
                      copied={copied === "push"}
                    />
                  )}
                  {typeof result.whatsapp_message === "string" && (
                    <ResultCard
                      title="WhatsApp"
                      content={result.whatsapp_message}
                      onCopy={() => copyText(result.whatsapp_message as string, "wa")}
                      copied={copied === "wa"}
                    />
                  )}
                  {typeof result.sms_text === "string" && (
                    <ResultCard
                      title="SMS"
                      content={result.sms_text}
                      onCopy={() => copyText(result.sms_text as string, "sms")}
                      copied={copied === "sms"}
                    />
                  )}
                  {(result.meta_ad_primary || result.google_ad_title) && (
                    <div className="space-y-2 rounded-lg border border-blue-900/40 bg-blue-950/25 p-3">
                      <p className="text-xs font-medium text-blue-300">Anuncios pagos:</p>
                      {typeof result.meta_ad_headline === "string" && (
                        <p className="text-xs text-slate-300">
                          <strong className="text-white">Meta:</strong> {result.meta_ad_headline} —{" "}
                          {String(result.meta_ad_primary ?? "")}
                        </p>
                      )}
                      {typeof result.google_ad_title === "string" && (
                        <p className="text-xs text-slate-300">
                          <strong className="text-white">Google:</strong> {result.google_ad_title} —{" "}
                          {String(result.google_ad_description ?? "")}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeTab === "pricing" && typeof result.market_analysis === "string" && (
                <>
                  {typeof result.price_position === "string" && (
                    <div
                      className={`rounded-lg border p-4 ${
                        result.price_position === "barato"
                          ? "border-green-700/50 bg-green-950/40"
                          : result.price_position === "competitivo"
                            ? "border-blue-700/50 bg-blue-950/40"
                            : result.price_position === "caro"
                              ? "border-orange-700/50 bg-orange-950/40"
                              : "border-red-700/50 bg-red-950/40"
                      }`}
                    >
                      <p className="text-sm font-bold text-white">
                        Tu precio es: <span className="uppercase">{result.price_position}</span>
                      </p>
                      {result.recommended_price != null && (
                        <p className="mt-1 text-sm text-slate-200">
                          Precio recomendado:{" "}
                          <strong>{`$${Number(result.recommended_price).toLocaleString("es-AR")}`}</strong>
                        </p>
                      )}
                      {result.recommended_original_price != null && (
                        <p className="text-xs text-slate-400">
                          Precio tachado sugerido: $
                          {Number(result.recommended_original_price).toLocaleString("es-AR")}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                    <p className="mb-2 text-xs font-medium text-slate-400">Mercado interno</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-green-400">
                          ${Number(result.min_price ?? 0).toLocaleString("es-AR")}
                        </p>
                        <p className="text-xs text-slate-500">Mínimo</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-400">
                          ${Number(result.avg_price ?? 0).toLocaleString("es-AR")}
                        </p>
                        <p className="text-xs text-slate-500">Promedio</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-red-400">
                          ${Number(result.max_price ?? 0).toLocaleString("es-AR")}
                        </p>
                        <p className="text-xs text-slate-500">Máximo</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                    <p className="text-sm text-slate-300">{result.market_analysis}</p>
                  </div>
                  {Array.isArray(result.tips) && (
                    <div className="rounded-lg border border-green-900/40 bg-green-950/25 p-3">
                      <p className="mb-2 text-xs font-medium text-green-300">Tips:</p>
                      <ul className="space-y-1 text-xs text-green-100/90">
                        {(result.tips as string[]).map((t, i) => (
                          <li key={i}>• {t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(result.competitors) && (result.competitors as unknown[]).length > 0 && (
                    <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                      <p className="mb-2 text-xs font-medium text-slate-400">
                        Competidores ({Number(result.competitors_count ?? 0)})
                      </p>
                      {(result.competitors as { title?: string; price?: number }[])
                        .slice(0, 5)
                        .map((c, i) => (
                          <div
                            key={i}
                            className="flex justify-between gap-2 border-b border-slate-800 py-1 text-xs last:border-0"
                          >
                            <span className="flex-1 truncate text-slate-300">{c.title}</span>
                            <span className="font-medium text-slate-100">
                              ${Number(c.price ?? 0).toLocaleString("es-AR")}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "seo" && typeof result.optimized_title === "string" && (
                <>
                  {result.seo_score !== undefined && (
                    <div
                      className={`rounded-lg border p-4 ${
                        Number(result.seo_score) >= 70
                          ? "border-green-700/50 bg-green-950/35"
                          : Number(result.seo_score) >= 40
                            ? "border-fuchsia-700/40 bg-fuchsia-950/25"
                            : "border-red-700/50 bg-red-950/35"
                      }`}
                    >
                      <p className="text-2xl font-bold text-white">{String(result.seo_score)}/100</p>
                      <p className="text-xs text-slate-400">Score SEO</p>
                    </div>
                  )}
                  <ResultCard
                    title="Título SEO"
                    content={result.optimized_title}
                    onCopy={() => copyText(result.optimized_title as string, "seo_title")}
                    copied={copied === "seo_title"}
                  />
                  {typeof result.meta_description === "string" && (
                    <ResultCard
                      title="Meta Description"
                      content={result.meta_description}
                      onCopy={() => copyText(result.meta_description as string, "meta")}
                      copied={copied === "meta"}
                    />
                  )}
                  {typeof result.optimized_description === "string" && (
                    <ResultCard
                      title="Descripción Optimizada"
                      content={result.optimized_description}
                      onCopy={() => copyText(result.optimized_description as string, "seo_desc")}
                      copied={copied === "seo_desc"}
                    />
                  )}
                  {Array.isArray(result.primary_keywords) && (
                    <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                      <p className="mb-2 text-xs font-medium text-slate-400">Keywords principales:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(result.primary_keywords as string[]).map((k) => (
                          <span key={k} className="rounded-full bg-indigo-950/70 px-2 py-0.5 text-xs text-indigo-200">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {Array.isArray(result.long_tail_keywords) && (
                    <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
                      <p className="mb-2 text-xs font-medium text-slate-400">Long-tail keywords:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(result.long_tail_keywords as string[]).map((k) => (
                          <span key={k} className="rounded-full bg-blue-950/70 px-2 py-0.5 text-xs text-blue-200">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.google_snippet_preview != null &&
                    typeof result.google_snippet_preview === "object" &&
                    result.google_snippet_preview !== null && (
                      <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-4">
                        <p className="mb-2 text-xs text-slate-500">Preview en Google:</p>
                        <p className="cursor-pointer text-sm font-medium text-blue-400 hover:underline">
                          {(result.google_snippet_preview as { title?: string }).title}
                        </p>
                        <p className="text-xs text-green-400">
                          {(result.google_snippet_preview as { url?: string }).url}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {(result.google_snippet_preview as { description?: string }).description}
                        </p>
                      </div>
                    )}
                  {Array.isArray(result.improvements) && (
                    <div className="rounded-lg border border-green-900/40 bg-green-950/25 p-3">
                      <p className="mb-2 text-xs font-medium text-green-300">Mejoras aplicadas:</p>
                      <ul className="space-y-1 text-xs text-green-100/90">
                        {(result.improvements as string[]).map((m, i) => (
                          <li key={i}>• {m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {result.error != null && typeof result.error === "string" && (
                <div className="rounded-lg border border-red-800/60 bg-red-950/40 p-3 text-sm text-red-200">
                  {result.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  title,
  content,
  onCopy,
  copied,
  highlight,
}: {
  title: string;
  content: string;
  onCopy: () => void;
  copied: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight
          ? "border-purple-700/50 bg-gradient-to-r from-purple-950/50 to-blue-950/40"
          : "border-slate-700 bg-slate-950/50"
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400">{title}</p>
        <button type="button" onClick={onCopy} className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className={`whitespace-pre-wrap text-sm text-slate-100 ${highlight ? "text-base font-semibold" : ""}`}>
        {content}
      </p>
    </div>
  );
}
