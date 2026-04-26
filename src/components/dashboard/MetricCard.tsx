"use client"

import { Info } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  borderRight?: boolean
  icon?: React.ReactNode
}

export function MetricCard({ title, value, subtitle, borderRight = true, icon }: MetricCardProps) {
  return (
    <div className={`p-6 ${borderRight ? 'border-r border-gray-100' : ''} hover:bg-gray-50 cursor-pointer transition-colors`}>
      <div className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-2">
        {title} <Info size={14} className="text-gray-400" />
      </div>
      <div className="text-xl font-black text-gray-800">{value}</div>
      {subtitle && (
        <div className="text-[10px] font-semibold text-gray-400 mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> {subtitle}
        </div>
      )}
    </div>
  )
}
