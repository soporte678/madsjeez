"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Tooltip,
  Legend,
  Filler
);

export type MeliAdsEcosystemChartProps = {
  labels: string[];
  revenueK: number[];
  costK: number[];
};

export function MeliAdsEcosystemChart({ labels, revenueK, costK }: MeliAdsEcosystemChartProps) {
  return (
    <div className="relative h-[280px] w-full max-w-full lg:h-[340px]">
      <Chart
        type="bar"
        data={{
          labels,
          datasets: [
            {
              type: "line",
              label: "Revenue ($ Miles)",
              data: revenueK,
              borderColor: "#34d399",
              backgroundColor: "rgba(52, 211, 153, 0.12)",
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              yAxisID: "y",
              order: 0,
            },
            {
              type: "bar",
              label: "Costo ($ Miles)",
              data: costK,
              backgroundColor: "rgba(251, 113, 133, 0.82)",
              borderRadius: 4,
              yAxisID: "y1",
              order: 1,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              labels: {
                color: "#cbd5e1",
                font: { family: "Inter, system-ui, sans-serif", size: 11 },
              },
            },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.92)",
              titleColor: "#fff",
              bodyColor: "#cbd5e1",
              padding: 12,
              borderColor: "rgba(51, 65, 85, 0.8)",
              borderWidth: 1,
            },
          },
          scales: {
            x: {
              grid: { color: "rgba(51, 65, 85, 0.45)", drawBorder: false },
              ticks: { color: "#94a3b8", font: { size: 11 } },
            },
            y: {
              type: "linear",
              display: true,
              position: "left",
              grid: { color: "rgba(51, 65, 85, 0.45)", drawBorder: false },
              ticks: { color: "#34d399", font: { size: 11 } },
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              grid: { drawOnChartArea: false },
              ticks: { color: "#fb7185", font: { size: 11 } },
            },
          },
        }}
      />
    </div>
  );
}
