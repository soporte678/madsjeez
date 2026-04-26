"use client"

import { Info } from "lucide-react"

interface MetricBlockProps {
  title: string
  value: string | number
  color: string
}

export function MetricBlock({ title, value, color }: MetricBlockProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 mb-1">
        <span className={`w-2 h-2 rounded-full ${color}`}></span> {title} <Info size={12}/>
      </div>
      <div className="text-xl font-black text-gray-800">{value}</div>
    </div>
  )
}
