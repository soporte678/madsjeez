"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import {
  Sparkles, Loader2, Copy, Check,
  Mail, MessageSquare, BarChart3, TrendingUp, DollarSign, Search,
  Megaphone, Target, Zap, ArrowRight, ExternalLink, Hash, Share2
} from "lucide-react"

type Tab = "social" | "email" | "banners" | "pricing" | "seo"

export default function MarketingPage() {
  const { status } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>("social")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState("")

  // Social posts form
  const [socialForm, setSocialForm] = useState({
    productTitle: "", productDescription: "", productPrice: "", productCategory: "",
    platform: "instagram", tone: "profesional"
  })

  // Email form
  const [emailForm, setEmailForm] = useState({
    emailType: "promotion", productTitle: "", productPrice: "",
    customerName: "", storeName: "", promotionDetails: ""
  })

  // Banner form
  const [bannerForm, setBannerForm] = useState({
    campaignType: "", discount: "", dateRange: "", targetAudience: "", products: ""
  })

  // Pricing form
  const [pricingForm, setPricingForm] = useState({
    productTitle: "", productPrice: "", productCategory: ""
  })

  // SEO form
  const [seoForm, setSeoForm] = useState({
    productTitle: "", productDescription: "", productCategory: ""
  })

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(""), 2000)
  }

  const callApi = async (action: string, formData: any) => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/ai/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...formData }),
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      console.error("Marketing AI error:", e)
    }
    setLoading(false)
  }

  if (status === "loading") return <div className="flex items-center justify-center h-96"><div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" /></div>

  const tabs: { id: Tab; label: string; icon: any; color: string }[] = [
    { id: "social", label: "Redes Sociales", icon: Share2, color: "from-pink-500 to-purple-500" },
    { id: "email", label: "Emails", icon: Mail, color: "from-blue-500 to-cyan-500" },
    { id: "banners", label: "Campañas", icon: Megaphone, color: "from-orange-500 to-red-500" },
    { id: "pricing", label: "Precios", icon: TrendingUp, color: "from-green-500 to-emerald-500" },
    { id: "seo", label: "SEO", icon: Search, color: "from-indigo-500 to-blue-500" },
  ]

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={() => copyText(text, label)}
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
    >
      {copied === label ? <Check size={12} /> : <Copy size={12} />}
      {copied === label ? "Copiado" : "Copiar"}
    </button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketing IA</h1>
          <p className="text-sm text-slate-500">Herramientas de marketing potenciadas por inteligencia artificial</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setResult(null) }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═══ LEFT: Form ═══ */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">

          {/* SOCIAL POSTS */}
          {activeTab === "social" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Share2 size={20} className="text-pink-500" /> Generador de Posts</h2>
              <input value={socialForm.productTitle} onChange={e => setSocialForm(p => ({ ...p, productTitle: e.target.value }))} placeholder="Título del producto" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              <textarea value={socialForm.productDescription} onChange={e => setSocialForm(p => ({ ...p, productDescription: e.target.value }))} placeholder="Descripción del producto (opcional)" rows={3} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <input value={socialForm.productPrice} onChange={e => setSocialForm(p => ({ ...p, productPrice: e.target.value }))} placeholder="Precio ($)" className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
                <input value={socialForm.productCategory} onChange={e => setSocialForm(p => ({ ...p, productCategory: e.target.value }))} placeholder="Categoría" className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={socialForm.platform} onChange={e => setSocialForm(p => ({ ...p, platform: e.target.value }))} className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="tiktok">TikTok</option>
                </select>
                <select value={socialForm.tone} onChange={e => setSocialForm(p => ({ ...p, tone: e.target.value }))} className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                  <option value="profesional">Profesional</option>
                  <option value="casual">Casual</option>
                  <option value="urgente">Urgente</option>
                  <option value="divertido">Divertido</option>
                </select>
              </div>
              <button onClick={() => callApi("social_posts", socialForm)} disabled={loading || !socialForm.productTitle} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-medium text-sm hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {loading ? "Generando..." : "✨ Generar Post"}
              </button>
            </div>
          )}

          {/* EMAILS */}
          {activeTab === "email" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Mail size={20} className="text-blue-500" /> Generador de Emails</h2>
              <select value={emailForm.emailType} onChange={e => setEmailForm(p => ({ ...p, emailType: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                <option value="promotion">Promoción / Oferta</option>
                <option value="abandoned_cart">Carrito Abandonado</option>
                <option value="welcome">Bienvenida</option>
                <option value="restock">Producto Disponible</option>
                <option value="review">Pedir Reseña</option>
                <option value="inactive">Reactivar Cliente</option>
              </select>
              <input value={emailForm.productTitle} onChange={e => setEmailForm(p => ({ ...p, productTitle: e.target.value }))} placeholder="Producto (opcional)" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <input value={emailForm.productPrice} onChange={e => setEmailForm(p => ({ ...p, productPrice: e.target.value }))} placeholder="Precio ($)" className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
                <input value={emailForm.customerName} onChange={e => setEmailForm(p => ({ ...p, customerName: e.target.value }))} placeholder="Nombre cliente" className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              </div>
              <input value={emailForm.promotionDetails} onChange={e => setEmailForm(p => ({ ...p, promotionDetails: e.target.value }))} placeholder="Detalles de la promo (ej: 20% OFF en taladros)" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              <button onClick={() => callApi("remarketing_email", emailForm)} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-lg font-medium text-sm hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 transition-all">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {loading ? "Generando..." : "✨ Generar Email"}
              </button>
            </div>
          )}

          {/* BANNERS */}
          {activeTab === "banners" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Megaphone size={20} className="text-orange-500" /> Generador de Campañas</h2>
              <input value={bannerForm.campaignType} onChange={e => setBannerForm(p => ({ ...p, campaignType: e.target.value }))} placeholder="Tipo de campaña (ej: Hot Sale, Black Friday, Liquidación)" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <input value={bannerForm.discount} onChange={e => setBannerForm(p => ({ ...p, discount: e.target.value }))} placeholder="Descuento (ej: 30% OFF)" className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
                <input value={bannerForm.dateRange} onChange={e => setBannerForm(p => ({ ...p, dateRange: e.target.value }))} placeholder="Duración (ej: 1-5 Mayo)" className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              </div>
              <input value={bannerForm.targetAudience} onChange={e => setBannerForm(p => ({ ...p, targetAudience: e.target.value }))} placeholder="Público objetivo (ej: profesionales de la construcción)" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              <input value={bannerForm.products} onChange={e => setBannerForm(p => ({ ...p, products: e.target.value }))} placeholder="Productos destacados (ej: taladros, amoladoras)" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              <button onClick={() => callApi("banner_text", bannerForm)} disabled={loading || !bannerForm.campaignType} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-lg font-medium text-sm hover:from-orange-600 hover:to-red-700 disabled:opacity-50 transition-all">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {loading ? "Generando..." : "✨ Generar Campaña"}
              </button>
            </div>
          )}

          {/* PRICING */}
          {activeTab === "pricing" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><TrendingUp size={20} className="text-green-500" /> Análisis de Precios</h2>
              <input value={pricingForm.productTitle} onChange={e => setPricingForm(p => ({ ...p, productTitle: e.target.value }))} placeholder="Nombre del producto" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <input value={pricingForm.productPrice} onChange={e => setPricingForm(p => ({ ...p, productPrice: e.target.value }))} placeholder="Tu precio actual ($)" className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
                <input value={pricingForm.productCategory} onChange={e => setPricingForm(p => ({ ...p, productCategory: e.target.value }))} placeholder="Categoría" className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              </div>
              <button onClick={() => callApi("price_analysis", pricingForm)} disabled={loading || !pricingForm.productTitle} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-medium text-sm hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
                {loading ? "Analizando..." : "📊 Analizar Precio"}
              </button>
            </div>
          )}

          {/* SEO */}
          {activeTab === "seo" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Search size={20} className="text-indigo-500" /> Optimización SEO</h2>
              <input value={seoForm.productTitle} onChange={e => setSeoForm(p => ({ ...p, productTitle: e.target.value }))} placeholder="Título del producto" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              <textarea value={seoForm.productDescription} onChange={e => setSeoForm(p => ({ ...p, productDescription: e.target.value }))} placeholder="Descripción actual del producto" rows={4} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 resize-none" />
              <input value={seoForm.productCategory} onChange={e => setSeoForm(p => ({ ...p, productCategory: e.target.value }))} placeholder="Categoría" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              <button onClick={() => callApi("seo_optimize", seoForm)} disabled={loading || !seoForm.productTitle} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50 transition-all">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {loading ? "Optimizando..." : "🔍 Optimizar SEO"}
              </button>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Results ═══ */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap size={20} className="text-yellow-500" /> Resultados
          </h2>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-600" size={20} />
              </div>
              <p className="text-sm text-slate-500 animate-pulse">Generando con IA...</p>
            </div>
          )}

          {!loading && !result && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Sparkles size={40} strokeWidth={1} />
              <p className="text-sm">Completá el formulario y hacé clic en generar</p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">

              {/* SOCIAL RESULTS */}
              {activeTab === "social" && result.post_text && (
                <>
                  <ResultCard title="Post" content={result.post_text} onCopy={() => copyText(result.post_text, "post")} copied={copied === "post"} />
                  {result.caption_long && <ResultCard title="Caption Largo" content={result.caption_long} onCopy={() => copyText(result.caption_long, "caption")} copied={copied === "caption"} />}
                  {result.caption_short && <ResultCard title="Caption Stories" content={result.caption_short} onCopy={() => copyText(result.caption_short, "stories")} copied={copied === "stories"} />}
                  {result.call_to_action && <ResultCard title="Call to Action" content={result.call_to_action} onCopy={() => copyText(result.call_to_action, "cta")} copied={copied === "cta"} />}
                  {result.hashtags && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-slate-500 flex items-center gap-1"><Hash size={12} /> Hashtags</p>
                        <CopyButton text={result.hashtags.map((h: string) => h.startsWith("#") ? h : `#${h}`).join(" ")} label="hashtags" />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.hashtags.map((h: string) => (
                          <span key={h} className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">{h.startsWith("#") ? h : `#${h}`}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.best_time && <p className="text-xs text-slate-500">⏰ Mejor horario: {result.best_time}</p>}
                  {result.content_ideas && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-600 mb-2">💡 Ideas de contenido visual:</p>
                      <ul className="text-xs text-blue-800 space-y-1">{result.content_ideas.map((idea: string, i: number) => <li key={i}>• {idea}</li>)}</ul>
                    </div>
                  )}
                </>
              )}

              {/* EMAIL RESULTS */}
              {activeTab === "email" && result.subject && (
                <>
                  <ResultCard title="Asunto" content={result.subject} onCopy={() => copyText(result.subject, "subject")} copied={copied === "subject"} />
                  {result.preview_text && <ResultCard title="Preview" content={result.preview_text} onCopy={() => copyText(result.preview_text, "preview")} copied={copied === "preview"} />}
                  {result.body_html && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-slate-500">Cuerpo del Email</p>
                        <CopyButton text={result.body_html} label="body" />
                      </div>
                      <div className="bg-white rounded-lg p-4 border text-sm" dangerouslySetInnerHTML={{ __html: result.body_html }} />
                    </div>
                  )}
                  {result.cta_text && <ResultCard title="Botón CTA" content={result.cta_text} onCopy={() => copyText(result.cta_text, "email_cta")} copied={copied === "email_cta"} />}
                  {result.urgency_line && <p className="text-xs text-orange-600 font-medium">⚡ {result.urgency_line}</p>}
                </>
              )}

              {/* BANNER RESULTS */}
              {activeTab === "banners" && result.headline && (
                <>
                  <ResultCard title="Titular Principal" content={result.headline} onCopy={() => copyText(result.headline, "headline")} copied={copied === "headline"} highlight />
                  {result.subheadline && <ResultCard title="Subtítulo" content={result.subheadline} onCopy={() => copyText(result.subheadline, "sub")} copied={copied === "sub"} />}
                  {result.banner_hero && <ResultCard title="Banner Hero" content={result.banner_hero} onCopy={() => copyText(result.banner_hero, "hero")} copied={copied === "hero"} />}
                  {result.popup_title && <ResultCard title="Popup" content={`${result.popup_title}\n${result.popup_body || ""}`} onCopy={() => copyText(`${result.popup_title} ${result.popup_body}`, "popup")} copied={copied === "popup"} />}
                  {result.push_notification && <ResultCard title="Push Notification" content={result.push_notification} onCopy={() => copyText(result.push_notification, "push")} copied={copied === "push"} />}
                  {result.whatsapp_message && <ResultCard title="WhatsApp" content={result.whatsapp_message} onCopy={() => copyText(result.whatsapp_message, "wa")} copied={copied === "wa"} />}
                  {result.sms_text && <ResultCard title="SMS" content={result.sms_text} onCopy={() => copyText(result.sms_text, "sms")} copied={copied === "sms"} />}
                  {(result.meta_ad_primary || result.google_ad_title) && (
                    <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-blue-600">📢 Anuncios pagos:</p>
                      {result.meta_ad_headline && <p className="text-xs"><strong>Meta:</strong> {result.meta_ad_headline} — {result.meta_ad_primary}</p>}
                      {result.google_ad_title && <p className="text-xs"><strong>Google:</strong> {result.google_ad_title} — {result.google_ad_description}</p>}
                    </div>
                  )}
                </>
              )}

              {/* PRICING RESULTS */}
              {activeTab === "pricing" && result.market_analysis && (
                <>
                  {result.price_position && (
                    <div className={`rounded-lg p-4 ${
                      result.price_position === "barato" ? "bg-green-50 border border-green-200" :
                      result.price_position === "competitivo" ? "bg-blue-50 border border-blue-200" :
                      result.price_position === "caro" ? "bg-orange-50 border border-orange-200" :
                      "bg-red-50 border border-red-200"
                    }`}>
                      <p className="text-sm font-bold">Tu precio es: <span className="uppercase">{result.price_position}</span></p>
                      {result.recommended_price && <p className="text-sm mt-1">💰 Precio recomendado: <strong>${result.recommended_price?.toLocaleString()}</strong></p>}
                      {result.recommended_original_price && <p className="text-xs text-slate-500">Precio tachado sugerido: ${result.recommended_original_price?.toLocaleString()}</p>}
                    </div>
                  )}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-slate-500 mb-2">📊 Mercado interno</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><p className="text-lg font-bold text-green-600">${result.min_price?.toLocaleString()}</p><p className="text-xs text-slate-400">Mínimo</p></div>
                      <div><p className="text-lg font-bold text-blue-600">${result.avg_price?.toLocaleString()}</p><p className="text-xs text-slate-400">Promedio</p></div>
                      <div><p className="text-lg font-bold text-red-600">${result.max_price?.toLocaleString()}</p><p className="text-xs text-slate-400">Máximo</p></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-sm text-slate-700">{result.market_analysis}</p>
                  </div>
                  {result.tips && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-green-600 mb-2">💡 Tips:</p>
                      <ul className="text-xs text-green-800 space-y-1">{result.tips.map((t: string, i: number) => <li key={i}>• {t}</li>)}</ul>
                    </div>
                  )}
                  {result.competitors && result.competitors.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-slate-500 mb-2">🏪 Competidores ({result.competitors_count})</p>
                      {result.competitors.slice(0, 5).map((c: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-200 last:border-0">
                          <span className="truncate flex-1">{c.title}</span>
                          <span className="font-medium ml-2">${c.price?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* SEO RESULTS */}
              {activeTab === "seo" && result.optimized_title && (
                <>
                  {result.seo_score !== undefined && (
                    <div className={`rounded-lg p-4 ${result.seo_score >= 70 ? "bg-green-50 border border-green-200" : result.seo_score >= 40 ? "bg-yellow-50 border border-yellow-200" : "bg-red-50 border border-red-200"}`}>
                      <p className="text-2xl font-bold">{result.seo_score}/100</p>
                      <p className="text-xs text-slate-500">Score SEO</p>
                    </div>
                  )}
                  <ResultCard title="Título SEO" content={result.optimized_title} onCopy={() => copyText(result.optimized_title, "seo_title")} copied={copied === "seo_title"} />
                  {result.meta_description && <ResultCard title="Meta Description" content={result.meta_description} onCopy={() => copyText(result.meta_description, "meta")} copied={copied === "meta"} />}
                  {result.optimized_description && <ResultCard title="Descripción Optimizada" content={result.optimized_description} onCopy={() => copyText(result.optimized_description, "seo_desc")} copied={copied === "seo_desc"} />}
                  {result.primary_keywords && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-slate-500 mb-2">Keywords principales:</p>
                      <div className="flex flex-wrap gap-1.5">{result.primary_keywords.map((k: string) => <span key={k} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{k}</span>)}</div>
                    </div>
                  )}
                  {result.long_tail_keywords && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-slate-500 mb-2">Long-tail keywords:</p>
                      <div className="flex flex-wrap gap-1.5">{result.long_tail_keywords.map((k: string) => <span key={k} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{k}</span>)}</div>
                    </div>
                  )}
                  {result.google_snippet_preview && (
                    <div className="bg-white rounded-lg p-4 border">
                      <p className="text-xs text-slate-400 mb-2">Preview en Google:</p>
                      <p className="text-blue-700 text-sm font-medium hover:underline cursor-pointer">{result.google_snippet_preview.title}</p>
                      <p className="text-green-700 text-xs">{result.google_snippet_preview.url}</p>
                      <p className="text-slate-600 text-xs mt-0.5">{result.google_snippet_preview.description}</p>
                    </div>
                  )}
                  {result.improvements && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-green-600 mb-2">✅ Mejoras aplicadas:</p>
                      <ul className="text-xs text-green-800 space-y-1">{result.improvements.map((m: string, i: number) => <li key={i}>• {m}</li>)}</ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultCard({ title, content, onCopy, copied, highlight }: { title: string; content: string; onCopy: () => void; copied: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? "bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200" : "bg-slate-50"}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <button onClick={onCopy} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className={`text-sm text-slate-800 whitespace-pre-wrap ${highlight ? "font-semibold text-lg" : ""}`}>{content}</p>
    </div>
  )
}
