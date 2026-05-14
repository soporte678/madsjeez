"use client"

import { useState } from "react"
import { Sparkles, Loader2, Scale, Trophy, ThumbsUp, ThumbsDown, X, DollarSign } from "lucide-react"

interface Props {
  productIds: string[]
  onClose?: () => void
}

export default function AIProductCompare({ productIds, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const compare = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds }),
      })
      const data = await res.json()
      setResult(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (!result && !loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 text-center">
        <Scale className="mx-auto text-blue-600 mb-3" size={32} />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Comparar {productIds.length} productos con IA</h3>
        <p className="text-sm text-slate-500 mb-4">La IA analizará y comparará estos productos para ayudarte a elegir</p>
        <button onClick={compare} className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:from-blue-700 hover:to-purple-700 transition-all">
          <Sparkles size={16} /> Comparar con IA
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-8 text-center">
        <Loader2 className="mx-auto text-blue-600 animate-spin mb-3" size={32} />
        <p className="text-sm text-slate-500 animate-pulse">Analizando productos...</p>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Scale size={20} />
          <h3 className="font-semibold">Comparación IA</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        )}
      </div>

      {/* Products row */}
      {result.products && (
        <div className="grid gap-3 p-4" style={{ gridTemplateColumns: `repeat(${result.products.length}, 1fr)` }}>
          {result.products.map((p: any, i: number) => (
            <div key={p.id} className={`text-center p-3 rounded-lg ${result.winner?.index === i ? "bg-green-50 border-2 border-green-300" : "bg-slate-50 border"}`}>
              {result.winner?.index === i && <div className="flex items-center justify-center gap-1 text-green-600 text-xs font-bold mb-1"><Trophy size={12} /> MEJOR</div>}
              {p.image && <img src={p.image} alt={p.title} className="w-16 h-16 object-contain mx-auto mb-2 rounded" />}
              <p className="text-xs font-medium text-slate-800 line-clamp-2">{p.title}</p>
              <p className="text-sm font-bold text-blue-600 mt-1">${p.price?.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Comparison table */}
      {result.comparison_table && (
        <div className="px-4 pb-4">
          <table className="w-full text-sm">
            <tbody>
              {result.comparison_table.map((row: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? "bg-slate-50" : ""}>
                  <td className="px-3 py-2 font-medium text-slate-600 text-xs whitespace-nowrap">{row.feature}</td>
                  {row.values?.map((v: string, j: number) => (
                    <td key={j} className="px-3 py-2 text-center text-xs text-slate-700">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pros & Cons */}
      {result.pros_cons && (
        <div className="grid gap-3 px-4 pb-4" style={{ gridTemplateColumns: `repeat(${result.pros_cons.length}, 1fr)` }}>
          {result.pros_cons.map((pc: any, i: number) => (
            <div key={i} className="space-y-2">
              {pc.pros?.map((pro: string, j: number) => (
                <div key={`pro-${j}`} className="flex items-start gap-1.5 text-xs text-green-700">
                  <ThumbsUp size={10} className="shrink-0 mt-0.5" /> {pro}
                </div>
              ))}
              {pc.cons?.map((con: string, j: number) => (
                <div key={`con-${j}`} className="flex items-start gap-1.5 text-xs text-amber-800">
                  <ThumbsDown size={10} className="shrink-0 mt-0.5" /> {con}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Winner & Summary */}
      {result.winner && (
        <div className="bg-green-50 border-t px-4 py-3">
          <p className="text-xs font-bold text-green-700 flex items-center gap-1"><Trophy size={12} /> Ganador: {result.products?.[result.winner.index]?.title}</p>
          <p className="text-xs text-green-600 mt-1">{result.winner.reason}</p>
        </div>
      )}
      {result.best_value && (
        <div className="bg-blue-50 border-t px-4 py-3">
          <p className="text-xs font-bold text-blue-700 flex items-center gap-1"><DollarSign size={12} /> Mejor valor: {result.products?.[result.best_value.index]?.title}</p>
          <p className="text-xs text-blue-600 mt-1">{result.best_value.reason}</p>
        </div>
      )}
      {result.summary && (
        <div className="px-4 py-3 border-t">
          <p className="text-xs text-slate-600">{result.summary}</p>
        </div>
      )}
    </div>
  )
}
