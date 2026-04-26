"use client"

import { Doughnut } from "react-chartjs-2"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(ArcElement, Tooltip, Legend)

interface CategoryChartProps {
  categories: Array<{ name: string; count: number; color?: string }>
}

export function CategoryChart({ categories }: CategoryChartProps) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <div className="w-24 h-24 rounded-full border-[12px] border-gray-100 flex items-center justify-center mb-2">
          <span className="text-gray-400 font-bold">0</span>
        </div>
        <span className="text-sm">Sin datos de categorías</span>
      </div>
    )
  }

  const defaultColors = [
    "#3483FA", "#A855F7", "#F59E0B", "#10B981", "#EF4444", 
    "#6366F1", "#EC4899", "#14B8A6", "#F97316", "#8B5CF6"
  ]

  const chartData = {
    labels: categories.map(c => c.name),
    datasets: [{
      data: categories.map(c => c.count),
      backgroundColor: categories.map((c, i) => c.color || defaultColors[i % defaultColors.length]),
      borderWidth: 2,
      borderColor: "#fff",
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { font: { size: 11 }, usePointStyle: true, padding: 15 },
      },
    },
    cutout: "60%",
  }

  return (
    <div className="h-[250px] w-full">
      <Doughnut data={chartData} options={options} />
    </div>
  )
}
