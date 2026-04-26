"use client"

interface EmptyChartStateProps {
  text: string
  subtext: string
  icon: React.ReactNode
}

export function EmptyChartState({ text, subtext, icon }: EmptyChartStateProps) {
  return (
    <div className="p-8 pb-12 relative flex flex-col items-center justify-center min-h-[250px] bg-gray-50/30">
      <div className="flex flex-col items-center text-gray-400">
        <div className="mb-2 opacity-50">{icon}</div>
        <span className="text-sm font-medium">{text}</span>
        <span className="text-xs mt-1 text-center">{subtext}</span>
      </div>
    </div>
  )
}
