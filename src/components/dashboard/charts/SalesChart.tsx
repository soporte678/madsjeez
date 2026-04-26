"use client"

import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface SalesChartProps {
  labels: string[]
  data: number[]
  label?: string
}

export function SalesChart({ labels, data, label = "Ventas" }: SalesChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        borderColor: "#3483FA",
        backgroundColor: "rgba(52, 131, 250, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#3483FA",
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
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
        ticks: { font: { size: 11 } },
      },
    },
  }

  return (
    <div className="h-[300px] w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}
