"use client"

import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface HourlySalesChartProps {
  hourlyData: Array<{ hour: number; sales_count: number; total_amount: number }>
  yesterdayData?: Array<{ hour: number; sales_count: number; total_amount: number }>
}

export function HourlySalesChart({ hourlyData, yesterdayData }: HourlySalesChartProps) {
  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)
  
  const todayAmounts = hours.map((_, i) => {
    const found = hourlyData.find(d => d.hour === i)
    return found ? found.total_amount : 0
  })

  const yesterdayAmounts = yesterdayData 
    ? hours.map((_, i) => {
        const found = yesterdayData.find(d => d.hour === i)
        return found ? found.total_amount : 0
      })
    : hours.map(() => 0)

  const chartData = {
    labels: hours,
    datasets: [
      {
        label: "Hoy",
        data: todayAmounts,
        backgroundColor: "rgba(52, 131, 250, 0.7)",
        borderColor: "#3483FA",
        borderWidth: 1,
        borderRadius: 4,
      },
      ...(yesterdayData ? [{
        label: "Ayer",
        data: yesterdayAmounts,
        backgroundColor: "rgba(168, 85, 247, 0.5)",
        borderColor: "#A855F7",
        borderWidth: 1,
        borderRadius: 4,
      }] : []),
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { font: { size: 11 }, usePointStyle: true },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          font: { size: 11 },
          callback: function(value: any) {
            if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
            if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
            return `$${value}`
          },
        },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, maxRotation: 0 },
      },
    },
  }

  return (
    <div className="h-[350px] w-full">
      <Bar data={chartData} options={options} />
    </div>
  )
}
