"use client"

import { useState } from "react"
import {
  Sparkles, Loader2, Copy, Check, BookOpen, Lightbulb,
  Search, TrendingUp, Clock, Tag, ChevronRight, FileText, Zap
} from "lucide-react"

type View = "ideas" | "generator" | "preview"

export default function BlogPage() {
  const [view, setView] = useState<View>("ideas")
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<any[]>([])
  const [article, setArticle] = useState<any>(null)
  const [copied, setCopied] = useState("")

  // Generator form
  const [topic, setTopic] = useState("")
  const [keyword, setKeyword] = useState("")
  const [articleType, setArticleType] = useState("buying_guide")
  const [ideaCategory, setIdeaCategory] = useState("")

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(""), 2000)
  }

  const generateIdeas = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_ideas", category: ideaCategory, count: 10 }),
      })
      const data = await res.json()
      setIdeas(data.ideas || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const generateArticle = async (topicOverride?: string, keywordOverride?: string, typeOverride?: string) => {
    setLoading(true)
    setView("preview")
    try {
      const res = await fetch("/api/ai/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_article",
          topic: topicOverride || topic,
          targetKeyword: keywordOverride || keyword,
          articleType: typeOverride || articleType,
        }),
      })
      const data = await res.json()
      setArticle(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const typeLabels: Record<string, string> = {
    buying_guide: "Guía de compra",
    comparison: "Comparativa",
    how_to: "Tutorial",
    tips: "Tips",
    trends: "Tendencias",
    maintenance: "Mantenimiento",
  }

  const difficultyColors: Record<string, string> = {
    baja: "bg-green-100 text-green-700",
    media: "bg-yellow-100 text-yellow-700",
    alta: "bg-red-100 text-red-700",
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Blog IA</h1>
            <p className="text-sm text-slate-500">Generador de contenido SEO automático para atraer tráfico</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8">
          <button onClick={() => setView("ideas")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${view === "ideas" ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg" : "bg-white text-slate-600 border hover:bg-slate-50"}`}>
            <Lightbulb size={16} /> Ideas de artículos
          </button>
          <button onClick={() => setView("generator")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${view === "generator" ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg" : "bg-white text-slate-600 border hover:bg-slate-50"}`}>
            <FileText size={16} /> Generar artículo
          </button>
          {article && (
            <button onClick={() => setView("preview")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${view === "preview" ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg" : "bg-white text-slate-600 border hover:bg-slate-50"}`}>
              <BookOpen size={16} /> Preview
            </button>
          )}
        </div>

        {/* ═══ IDEAS VIEW ═══ */}
        {view === "ideas" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Lightbulb size={20} className="text-orange-500" /> Generar ideas de artículos</h2>
              <div className="flex gap-3">
                <input value={ideaCategory} onChange={e => setIdeaCategory(e.target.value)} placeholder="Categoría o tema (ej: taladros, soldadoras)" className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-orange-500" />
                <button onClick={generateIdeas} disabled={loading} className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Generar ideas
                </button>
              </div>
            </div>

            {ideas.length > 0 && (
              <div className="space-y-3">
                {ideas.map((idea, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 mb-2">{idea.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{typeLabels[idea.type] || idea.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[idea.difficulty] || "bg-slate-100 text-slate-600"}`}>Dificultad: {idea.difficulty}</span>
                          {idea.priority === "alta" && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Prioridad alta</span>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Search size={12} /> {idea.target_keyword}</span>
                          <span className="flex items-center gap-1"><TrendingUp size={12} /> ~{idea.estimated_monthly_searches} búsq/mes</span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setTopic(idea.title); setKeyword(idea.target_keyword); setArticleType(idea.type); generateArticle(idea.title, idea.target_keyword, idea.type) }}
                        className="flex items-center gap-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shrink-0"
                      >
                        <Zap size={14} /> Escribir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ GENERATOR VIEW ═══ */}
        {view === "generator" && (
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><FileText size={20} className="text-purple-500" /> Escribir artículo</h2>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Tema del artículo (ej: Mejores amoladoras 2025)" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500" />
            <div className="grid grid-cols-2 gap-3">
              <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Keyword SEO principal" className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500" />
              <select value={articleType} onChange={e => setArticleType(e.target.value)} className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500">
                <option value="buying_guide">Guía de compra</option>
                <option value="comparison">Comparativa/ranking</option>
                <option value="how_to">Tutorial</option>
                <option value="tips">Tips y consejos</option>
                <option value="trends">Tendencias</option>
                <option value="maintenance">Mantenimiento</option>
              </select>
            </div>
            <button onClick={() => generateArticle()} disabled={loading || !topic} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loading ? "Escribiendo artículo..." : "✨ Generar artículo completo"}
            </button>
          </div>
        )}

        {/* ═══ PREVIEW VIEW ═══ */}
        {view === "preview" && (
          <div className="space-y-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600" />
                  <BookOpen className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-600" size={24} />
                </div>
                <p className="text-sm text-slate-500 animate-pulse">Escribiendo artículo con IA...</p>
              </div>
            )}

            {!loading && article && (
              <>
                {/* SEO Preview */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-xs font-medium text-slate-400 mb-3">Preview en Google</h3>
                  <div className="max-w-xl">
                    <p className="text-blue-700 text-lg font-medium hover:underline cursor-pointer">{article.title}</p>
                    <p className="text-green-700 text-sm">madsjeez.com.ar/blog/{article.slug}</p>
                    <p className="text-slate-600 text-sm mt-0.5">{article.meta_description}</p>
                  </div>
                </div>

                {/* Meta info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg border p-3 text-center">
                    <Clock size={16} className="mx-auto text-slate-400 mb-1" />
                    <p className="text-lg font-bold text-slate-800">{article.estimated_reading_time || "5"}</p>
                    <p className="text-xs text-slate-400">min lectura</p>
                  </div>
                  <div className="bg-white rounded-lg border p-3 text-center">
                    <Tag size={16} className="mx-auto text-slate-400 mb-1" />
                    <p className="text-lg font-bold text-slate-800">{article.secondary_keywords?.length || 0}</p>
                    <p className="text-xs text-slate-400">keywords</p>
                  </div>
                  <div className="bg-white rounded-lg border p-3 text-center">
                    <Search size={16} className="mx-auto text-slate-400 mb-1" />
                    <p className="text-sm font-bold text-slate-800 truncate">{article.primary_keyword}</p>
                    <p className="text-xs text-slate-400">keyword principal</p>
                  </div>
                  <div className="bg-white rounded-lg border p-3 text-center">
                    <FileText size={16} className="mx-auto text-slate-400 mb-1" />
                    <p className="text-lg font-bold text-slate-800">{article.schema_faq?.length || 0}</p>
                    <p className="text-xs text-slate-400">FAQs</p>
                  </div>
                </div>

                {/* Keywords */}
                {article.secondary_keywords && (
                  <div className="bg-white rounded-xl shadow-sm border p-4">
                    <p className="text-xs font-medium text-slate-400 mb-2">Keywords secundarias</p>
                    <div className="flex flex-wrap gap-1.5">
                      {article.secondary_keywords.map((kw: string) => (
                        <span key={kw} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Article content */}
                <div className="bg-white rounded-xl shadow-sm border p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">{article.title}</h1>
                    <button
                      onClick={() => copyText(article.content_html || "", "article")}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 shrink-0"
                    >
                      {copied === "article" ? <Check size={14} /> : <Copy size={14} />}
                      {copied === "article" ? "Copiado" : "Copiar HTML"}
                    </button>
                  </div>
                  <div
                    className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-a:text-blue-600 prose-li:text-slate-600"
                    dangerouslySetInnerHTML={{ __html: article.content_html || "" }}
                  />
                </div>

                {/* FAQs */}
                {article.schema_faq && article.schema_faq.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold mb-4">Preguntas frecuentes</h3>
                    <div className="space-y-3">
                      {article.schema_faq.map((faq: any, i: number) => (
                        <details key={i} className="border rounded-lg">
                          <summary className="px-4 py-3 cursor-pointer font-medium text-slate-700 text-sm hover:bg-slate-50">{faq.question}</summary>
                          <p className="px-4 py-3 text-sm text-slate-600 border-t bg-slate-50">{faq.answer}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
